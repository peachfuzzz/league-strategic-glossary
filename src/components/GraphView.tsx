'use client'

import React, { useEffect, useRef } from 'react';
import { X } from 'lucide-react';
import { GlossaryTerm, tagColors } from '@/data/glossaryData';

interface GraphViewProps {
  nodes: any[];
  setNodes: React.Dispatch<React.SetStateAction<any[]>>;
  selectedNode: GlossaryTerm | null;
  setSelectedNode: (node: GlossaryTerm | null) => void;
  hoveredNode: GlossaryTerm | null;
  setHoveredNode: (node: GlossaryTerm | null) => void;
  draggedNode: any;
  setDraggedNode: (node: any) => void;
  zoom: number;
  pan: { x: number; y: number };
  setPan: React.Dispatch<React.SetStateAction<{ x: number; y: number }>>;
  searchQuery: string;
  selectedTags: string[];
  glossaryData: GlossaryTerm[];
  allGlossaryData: GlossaryTerm[];
  viewMode: 'explore' | 'viewAll';
  onDiscoverTerm: (termId: string) => void;
  discoveredTerms: Set<string>;
  hoveredTag: string | null;
  setHoveredTag: (tag: string | null) => void;
  onToggleTag: (tag: string) => void;
}

export default function GraphView({
  nodes,
  setNodes,
  selectedNode,
  setSelectedNode,
  hoveredNode,
  setHoveredNode,
  draggedNode,
  setDraggedNode,
  zoom,
  pan,
  setPan,
  searchQuery,
  selectedTags,
  glossaryData,
  allGlossaryData,
  viewMode,
  onDiscoverTerm,
  discoveredTerms,
  hoveredTag,
  setHoveredTag,
  onToggleTag
}: GraphViewProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number | null>(null);
  const isPanning = useRef(false);
  const lastPanPos = useRef({ x: 0, y: 0 });

  // Render definition with inline autolinks
  const renderDefinitionWithLinks = (term: GlossaryTerm) => {
    if (!term.autoLinks || term.autoLinks.length === 0) {
      return <p className="text-slate-300 text-sm mb-3">{term.definition}</p>;
    }

    // Build a map of term IDs to their display names and patterns (including alternates)
    const linkMap = new Map<string, { term: GlossaryTerm; patterns: RegExp[] }>();
    term.autoLinks.forEach(linkId => {
      const linkedTerm = allGlossaryData.find(t => t.id === linkId);
      if (linkedTerm) {
        const patterns: RegExp[] = [];

        // Add pattern for main term
        const escapedTerm = linkedTerm.term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        patterns.push(new RegExp(`\\b${escapedTerm}\\b`, 'gi'));

        // Add patterns for alternate forms
        if (linkedTerm.alternates && linkedTerm.alternates.length > 0) {
          linkedTerm.alternates.forEach(alternate => {
            const escapedAlt = alternate.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
            patterns.push(new RegExp(`\\b${escapedAlt}\\b`, 'gi'));
          });
        }

        linkMap.set(linkId, { term: linkedTerm, patterns });
      }
    });

    // Find all matches and their positions
    const matches: Array<{ start: number; end: number; linkId: string; text: string }> = [];
    linkMap.forEach((value, linkId) => {
      value.patterns.forEach(pattern => {
        let match;
        while ((match = pattern.exec(term.definition)) !== null) {
          matches.push({
            start: match.index,
            end: match.index + match[0].length,
            linkId,
            text: match[0]
          });
        }
      });
    });

    // Sort matches by position
    matches.sort((a, b) => a.start - b.start);

    // Build the JSX with links
    const parts: React.ReactNode[] = [];
    let lastIndex = 0;

    matches.forEach((match, i) => {
      // Skip overlapping matches
      if (match.start < lastIndex) return;

      // Add text before the match
      if (match.start > lastIndex) {
        parts.push(term.definition.substring(lastIndex, match.start));
      }

      // Add the link
      const linkedTerm = linkMap.get(match.linkId)?.term;
      if (linkedTerm) {
        const isDiscovered = discoveredTerms.has(linkedTerm.id);
        parts.push(
          <button
            key={`${match.linkId}-${i}`}
            onClick={(e) => {
              e.stopPropagation();
              if (viewMode === 'explore') {
                onDiscoverTerm(linkedTerm.id);
              } else {
                setSelectedNode(linkedTerm);
              }
            }}
            className={`underline decoration-2 underline-offset-2 hover:text-blue-400 transition-colors ${
              isDiscovered
                ? 'text-blue-300'
                : 'text-slate-300'
            }`}
          >
            {match.text}
          </button>
        );
      }

      lastIndex = match.end;
    });

    // Add remaining text
    if (lastIndex < term.definition.length) {
      parts.push(term.definition.substring(lastIndex));
    }

    return <p className="text-slate-300 text-sm mb-3">{parts}</p>;
  };

  // Initialize nodes when glossaryData changes
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const width = rect.width;
    const height = rect.height;

    // Create nodes for all glossary items, merging with existing positions if available
    const newNodes = glossaryData.map((term, i) => {
      const existingNode = nodes.find(n => n.id === term.id);
      return existingNode ? {
        ...existingNode,
        ...term
      } : {
        ...term,
        x: width / 2 + (Math.random() - 0.5) * 400,
        y: height / 2 + (Math.random() - 0.5) * 400,
        vx: 0,
        vy: 0,
        radius: 8
      };
    });

    setNodes(newNodes);
  }, [glossaryData.length, setNodes]); // Only depend on length, not the whole array

  // Physics simulation
  useEffect(() => {
    if (nodes.length === 0) return;

    // ADJUST THESE VALUES TO CONTROL GRAPH BEHAVIOR:
    const DAMPING = 0.80;              // Lower = slower movement (0.8-0.95)
    const CENTER_FORCE = 0.0003;       // Strength of pull to center
    const REPULSION = 2000;            // How much nodes push apart
    const LINK_DISTANCE = 150;         // Ideal distance between connected nodes
    const LINK_STRENGTH = 0.008;       // How strongly links pull nodes together

    const simulate = () => {
      setNodes((prevNodes: any[]) => {
        // Don't modify node data, just update physics
        const newNodes = [...prevNodes];

        for (let i = 0; i < newNodes.length; i++) {
          const node = newNodes[i];
          
          if (draggedNode && draggedNode.id === node.id) continue;

          const canvas = canvasRef.current;
          if (!canvas) continue;
          
          const rect = canvas.getBoundingClientRect();
          const centerX = rect.width / 2;
          const centerY = rect.height / 2;
          const toCenterX = (centerX - node.x) * CENTER_FORCE;
          const toCenterY = (centerY - node.y) * CENTER_FORCE;
          node.vx += toCenterX;
          node.vy += toCenterY;

          for (let j = 0; j < newNodes.length; j++) {
            if (i === j) continue;
            const other = newNodes[j];
            const dx = node.x - other.x;
            const dy = node.y - other.y;
            const dist = Math.sqrt(dx * dx + dy * dy) || 1;
            const force = REPULSION / (dist * dist);
            node.vx += (dx / dist) * force;
            node.vy += (dy / dist) * force;
          }

          // Combine manual links and auto-detected links
          const allLinks = [
            ...(node.links || []),
            ...(node.autoLinks || [])
          ];

          allLinks.forEach((linkId: string) => {
            const linked = newNodes.find(n => n.id === linkId);
            if (linked) {
              const dx = linked.x - node.x;
              const dy = linked.y - node.y;
              const dist = Math.sqrt(dx * dx + dy * dy) || 1;
              const force = (dist - LINK_DISTANCE) * LINK_STRENGTH;
              node.vx += (dx / dist) * force;
              node.vy += (dy / dist) * force;
            }
          });

          node.vx *= DAMPING;
          node.vy *= DAMPING;
          node.x += node.vx;
          node.y += node.vy;
        }

        return newNodes;
      });

      animationRef.current = requestAnimationFrame(simulate);
    };

    simulate();

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [nodes.length, draggedNode, setNodes]);

  // Drawing
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || nodes.length === 0) return;

    // Set canvas size to match display size
    const updateCanvasSize = () => {
      const rect = canvas.getBoundingClientRect();
      const dpr = window.devicePixelRatio || 1;
      canvas.width = rect.width * dpr;
      canvas.height = rect.height * dpr;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.scale(dpr, dpr);
      }
    };

    updateCanvasSize();
    window.addEventListener('resize', updateCanvasSize);

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const getCanvasSize = () => {
      const rect = canvas.getBoundingClientRect();
      return { width: rect.width, height: rect.height };
    };

    let drawAnimationId: number;
    const draw = () => {
      const { width, height } = getCanvasSize();
      ctx.clearRect(0, 0, width, height);
      
      ctx.save();
      ctx.translate(pan.x, pan.y);
      ctx.scale(zoom, zoom);

      const filteredNodes = nodes.filter(node => {
        if (!node.term || !node.tags) return false;
        const matchesSearch = searchQuery === '' ||
          node.term.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesTags = selectedTags.length === 0 ||
          selectedTags.every((tag: string) => node.tags.includes(tag));
        return matchesSearch && matchesTags;
      });

      // Draw links (both manual and auto-detected)
      ctx.lineWidth = 1.5;
      filteredNodes.forEach(node => {
        // Combine manual and auto links
        const allLinks = [
          ...(node.links || []),
          ...(node.autoLinks || [])
        ];

        allLinks.forEach((linkId: string) => {
          const linked = nodes.find(n => n.id === linkId);
          if (linked && filteredNodes.includes(linked)) {
            ctx.strokeStyle = 'rgba(148, 163, 184, 0.2)';
            ctx.beginPath();
            ctx.moveTo(node.x, node.y);
            ctx.lineTo(linked.x, linked.y);
            ctx.stroke();
          }
        });
      });

      // Draw "trail off" lines for undiscovered connections
      filteredNodes.forEach(node => {
        const allLinks = [
          ...(node.links || []),
          ...(node.autoLinks || [])
        ];

        // Find undiscovered links (links that don't have a node in filteredNodes)
        const undiscoveredLinks = allLinks.filter(linkId => {
          const linked = nodes.find(n => n.id === linkId);
          return !linked || !filteredNodes.includes(linked);
        });

        if (undiscoveredLinks.length > 0) {
          const trailLength = 40; // Length of the trail line
          const angleStep = (Math.PI * 2) / undiscoveredLinks.length;

          // Draw a trail line for each undiscovered connection
          undiscoveredLinks.forEach((_linkId, index) => {
            const angle = angleStep * index + (Math.PI / 4); // Offset for better distribution
            const endX = node.x + Math.cos(angle) * trailLength;
            const endY = node.y + Math.sin(angle) * trailLength;

            // Draw faint dashed line
            ctx.setLineDash([4, 4]);
            ctx.strokeStyle = 'rgba(148, 163, 184, 0.30)';
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(node.x, node.y);
            ctx.lineTo(endX, endY);
            ctx.stroke();
            ctx.setLineDash([]); // Reset dash pattern
          });
        }
      });

      // Highlight selected node connections
      if (selectedNode) {
        const selected = nodes.find(n => n.id === selectedNode.id);
        if (selected) {
          // Combine manual and auto links for highlighting
          const allLinks = [
            ...(selected.links || []),
            ...(selected.autoLinks || [])
          ];

          // Draw discovered connections
          ctx.strokeStyle = 'rgba(59, 130, 246, 0.6)';
          ctx.lineWidth = 2.5;
          allLinks.forEach((linkId: string) => {
            const linked = nodes.find(n => n.id === linkId);
            if (linked && filteredNodes.includes(linked)) {
              ctx.beginPath();
              ctx.moveTo(selected.x, selected.y);
              ctx.lineTo(linked.x, linked.y);
              ctx.stroke();
            }
          });

          // Draw highlighted trail lines for undiscovered connections
          const undiscoveredLinks = allLinks.filter(linkId => {
            const linked = nodes.find(n => n.id === linkId);
            return !linked || !filteredNodes.includes(linked);
          });

          if (undiscoveredLinks.length > 0) {
            const trailLength = 50; // Slightly longer for selected node
            const angleStep = (Math.PI * 2) / undiscoveredLinks.length;

            undiscoveredLinks.forEach((_linkId, index) => {
              const angle = angleStep * index + (Math.PI / 4);
              const endX = selected.x + Math.cos(angle) * trailLength;
              const endY = selected.y + Math.sin(angle) * trailLength;

              // Draw more visible dashed line for selected node
              ctx.setLineDash([5, 5]);
              ctx.strokeStyle = 'rgba(59, 130, 246, 0.3)';
              ctx.lineWidth = 2;
              ctx.beginPath();
              ctx.moveTo(selected.x, selected.y);
              ctx.lineTo(endX, endY);
              ctx.stroke();
              ctx.setLineDash([]);
            });
          }
        }
      }

      // Draw nodes
      filteredNodes.forEach(node => {
        const isSelected = selectedNode && selectedNode.id === node.id;
        const isHovered = hoveredNode && hoveredNode.id === node.id;
        const isConnected = selectedNode && selectedNode.links && selectedNode.links.includes(node.id);
        
        ctx.beginPath();
        ctx.arc(node.x, node.y, node.radius, 0, Math.PI * 2);
        
        if (isSelected) {
          ctx.fillStyle = '#3b82f6';
          ctx.shadowColor = '#3b82f6';
          ctx.shadowBlur = 20;
        } else if (isConnected) {
          ctx.fillStyle = '#60a5fa';
          ctx.shadowColor = '#60a5fa';
          ctx.shadowBlur = 10;
        } else if (isHovered) {
          ctx.fillStyle = '#94a3b8';
          ctx.shadowColor = '#94a3b8';
          ctx.shadowBlur = 10;
        } else {
          const color = (node.tags && node.tags[0]) ? (tagColors[node.tags[0]] || '#64748b') : '#64748b';
          ctx.fillStyle = color;
          ctx.shadowBlur = 0;
        }
        
        ctx.fill();
        ctx.shadowBlur = 0;

        ctx.strokeStyle = isSelected || isHovered ? '#fff' : 'rgba(255, 255, 255, 0.3)';
        ctx.lineWidth = isSelected ? 3 : 1.5;
        ctx.stroke();

        // Draw labels
        if (isSelected || isHovered || zoom > 1.2) {
          ctx.font = isSelected ? 'bold 14px sans-serif' : '12px sans-serif';
          ctx.fillStyle = '#fff';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'top';
          
          const textWidth = ctx.measureText(node.term).width;
          ctx.fillStyle = 'rgba(15, 23, 42, 0.8)';
          ctx.fillRect(node.x - textWidth / 2 - 4, node.y + node.radius + 4, textWidth + 8, 20);
          
          ctx.fillStyle = '#fff';
          ctx.fillText(node.term, node.x, node.y + node.radius + 8);
        }
      });

      ctx.restore();
      drawAnimationId = requestAnimationFrame(draw);
    };

    draw();

    return () => {
      window.removeEventListener('resize', updateCanvasSize);
      if (drawAnimationId) {
        cancelAnimationFrame(drawAnimationId);
      }
    };
  }, [nodes, selectedNode, hoveredNode, zoom, pan, searchQuery, selectedTags]);

  // Mouse interactions
  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const rect = canvas.getBoundingClientRect();
    const x = (e.clientX - rect.left - pan.x) / zoom;
    const y = (e.clientY - rect.top - pan.y) / zoom;

    const clicked = nodes.find(node => {
      const dx = x - node.x;
      const dy = y - node.y;
      return Math.sqrt(dx * dx + dy * dy) < node.radius * 2;
    });

    if (clicked) {
      setDraggedNode(clicked);
      setSelectedNode(clicked);
    } else {
      isPanning.current = true;
      lastPanPos.current = { x: e.clientX, y: e.clientY };
      setSelectedNode(null);
    }
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const rect = canvas.getBoundingClientRect();
    const x = (e.clientX - rect.left - pan.x) / zoom;
    const y = (e.clientY - rect.top - pan.y) / zoom;

    if (draggedNode) {
      setNodes(prev => prev.map((node, i) => 
        glossaryData[i].id === draggedNode.id 
          ? { ...node, x, y, vx: 0, vy: 0 }
          : node
      ));
      setDraggedNode({ ...draggedNode, x, y });
    } else if (isPanning.current) {
      const dx = e.clientX - lastPanPos.current.x;
      const dy = e.clientY - lastPanPos.current.y;
      setPan((prev: { x: number; y: number }) => ({ x: prev.x + dx, y: prev.y + dy }));
      lastPanPos.current = { x: e.clientX, y: e.clientY };
    } else {
      const hovered = nodes.find(node => {
        const dx = x - node.x;
        const dy = y - node.y;
        return Math.sqrt(dx * dx + dy * dy) < node.radius * 2;
      });
      setHoveredNode(hovered || null);
    }
  };

  const handleMouseUp = () => {
    setDraggedNode(null);
    isPanning.current = false;
  };

  const handleWheel = (e: React.WheelEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    const delta = e.deltaY > 0 ? 0.9 : 1.1;
    const newZoom = Math.max(0.5, Math.min(3, zoom * delta));
    
    // You could add zoom-to-cursor here if desired
    // For now, just update zoom directly
  };

  return (
    <>
      <canvas
        ref={canvasRef}
        className="w-full h-full cursor-grab active:cursor-grabbing"
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onWheel={handleWheel}
      />

      {/* Selected node info panel */}
      {selectedNode && (
        <div className="absolute bottom-4 right-4 bg-slate-800 border border-slate-700 rounded-lg p-4 max-w-sm shadow-xl">
          <div className="flex items-start justify-between gap-3 mb-2">
            <div className="flex-1">
              <h3 className="text-lg font-bold text-white">{selectedNode.term}</h3>
              {selectedNode.alternates && selectedNode.alternates.length > 0 && (
                <p className="text-xs text-slate-400 italic mt-1">
                  Also known as: {selectedNode.alternates.join(', ')}
                </p>
              )}
            </div>
            <div className="flex items-center gap-2">
              {/* Tags as colored circles with tooltips */}
              <div className="flex gap-1">
                {selectedNode.tags.map(tag => (
                  <div
                    key={tag}
                    title={tag}
                    className={`w-3 h-3 rounded-full cursor-pointer transition-all ${
                      hoveredTag === tag ? 'ring-2 ring-white ring-offset-1 ring-offset-slate-800' : ''
                    }`}
                    style={{ backgroundColor: tagColors[tag] || '#64748b' }}
                    onMouseEnter={() => setHoveredTag(tag)}
                    onMouseLeave={() => setHoveredTag(null)}
                    onClick={(e) => {
                      e.stopPropagation();
                      onToggleTag(tag);
                    }}
                  />
                ))}
              </div>
              <button
                onClick={() => setSelectedNode(null)}
                className="text-slate-400 hover:text-white transition-colors"
              >
                <X size={18} />
              </button>
            </div>
          </div>

          {/* Definition with inline autolinks */}
          {renderDefinitionWithLinks(selectedNode)}

          {/* Manual links (dashed border) */}
          {selectedNode.links.length > 0 && (
            <div className="flex flex-wrap gap-2 text-xs text-slate-400">
              <span className="font-semibold">Also see:</span>
              {selectedNode.links.map(linkId => {
                const linkedTerm = allGlossaryData.find(t => t.id === linkId);
                if (!linkedTerm) return null;

                const isDiscovered = discoveredTerms.has(linkedTerm.id);
                return (
                  <span
                    key={linkId}
                    className={`px-2 py-0.5 rounded border-2 border-dashed transition-colors cursor-pointer ${
                      isDiscovered
                        ? 'bg-blue-700/30 border-blue-600 text-blue-300 hover:bg-blue-700/50'
                        : 'bg-slate-700 border-slate-600 text-slate-300 hover:bg-slate-600'
                    }`}
                    onClick={(e) => {
                      e.stopPropagation();
                      if (viewMode === 'explore') {
                        onDiscoverTerm(linkedTerm.id);
                      } else {
                        setSelectedNode(linkedTerm);
                      }
                    }}
                  >
                    {linkedTerm.term}
                  </span>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Instructions overlay */}
      <div className="absolute top-4 left-4 bg-slate-800/90 border border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-300">
        <div>Click & drag nodes • Scroll to zoom • Drag background to pan</div>
      </div>
    </>
  );
}