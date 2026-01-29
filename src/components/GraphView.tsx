'use client'

import React, { useEffect, useRef } from 'react';
import Link from 'next/link';
import { X } from 'lucide-react';
import { GlossaryTerm, tagColors } from '@/data/glossaryData';
import { GRAPH_PHYSICS_CONFIG } from '@/config/graph.config';
import MediaGallery from '@/components/MediaGallery';

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
  setZoom: React.Dispatch<React.SetStateAction<number>>;
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
  setZoom,
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
    // Strip backticks from the definition for display
    const displayDefinition = term.definition.replace(/`([^`]+)`/g, '$1');

    if (!term.autoLinks || term.autoLinks.length === 0) {
      return <p className="text-white leading-relaxed">{displayDefinition}</p>;
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

    // Find all matches and their positions (use displayDefinition for matching)
    const matches: Array<{ start: number; end: number; linkId: string; text: string }> = [];
    linkMap.forEach((value, linkId) => {
      value.patterns.forEach(pattern => {
        let match;
        while ((match = pattern.exec(displayDefinition)) !== null) {
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
        parts.push(displayDefinition.substring(lastIndex, match.start));
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
            className={`underline decoration-1 underline-offset-2 transition-colors ${
              isDiscovered
                ? 'text-[#c28f2c] hover:text-[#d4a03d]'
                : 'text-[rgba(255,255,255,0.5)] hover:text-[#c28f2c]'
            }`}
          >
            {match.text}
          </button>
        );
      }

      lastIndex = match.end;
    });

    // Add remaining text
    if (lastIndex < displayDefinition.length) {
      parts.push(displayDefinition.substring(lastIndex));
    }

    return <p className="text-white leading-relaxed">{parts}</p>;
  };

  // Initialize nodes when glossaryData changes
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    // Check if we need to initialize or update nodes
    // We need to update if:
    // 1. glossaryData changed (different terms available)
    // 2. Number of nodes doesn't match glossaryData length
    const needsUpdate = nodes.length !== glossaryData.length ||
      glossaryData.some(term => !nodes.find(n => n.id === term.id));

    if (!needsUpdate) return;

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
  }, [glossaryData, nodes, setNodes]);

  // Physics simulation
  useEffect(() => {
    if (nodes.length === 0) {
      // Clean up animation frame if nodes are cleared
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
        animationRef.current = null;
      }
      return;
    }

    // Physics constants from config (edit src/config/graph.config.ts to adjust)
    const DAMPING = GRAPH_PHYSICS_CONFIG.damping;
    const CENTER_FORCE = GRAPH_PHYSICS_CONFIG.centerForce;
    const REPULSION = GRAPH_PHYSICS_CONFIG.repulsion;
    const LINK_DISTANCE = GRAPH_PHYSICS_CONFIG.linkDistance;
    const LINK_STRENGTH = GRAPH_PHYSICS_CONFIG.linkStrength;

    const simulate = () => {
      setNodes((prevNodes: any[]) => {
        // Safety check: if nodes array is empty, stop simulation
        if (prevNodes.length === 0) {
          return prevNodes;
        }

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
        animationRef.current = null;
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

      // Draw dark background
      ctx.fillStyle = '#161f32';
      ctx.fillRect(0, 0, width, height);

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
            ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)';
            ctx.lineWidth = 1.5;
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
            ctx.setLineDash([3, 3]);
            ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
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
          ctx.strokeStyle = 'rgba(194, 143, 44, 0.6)';
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
              ctx.strokeStyle = 'rgba(194, 143, 44, 0.3)';
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

        // Check if node is connected to selected node (both manual and auto links)
        const isConnected = selectedNode && (
          (selectedNode.links && selectedNode.links.includes(node.id)) ||
          (selectedNode.autoLinks && selectedNode.autoLinks.includes(node.id))
        );

        // Draw node as pie chart if it has multiple tags
        const nodeTags = node.tags || [];
        const hasMultipleTags = nodeTags.length > 1;

        // Set glow effect for selected, connected, or hovered nodes
        if (isSelected) {
          ctx.shadowColor = '#E07A5F';
          ctx.shadowBlur = 20;
        } else if (isConnected) {
          ctx.shadowColor = '#F0A896';
          ctx.shadowBlur = 10;
        } else if (isHovered) {
          ctx.shadowColor = '#A0A0A0';
          ctx.shadowBlur = 10;
        }

        // Draw node with its actual tag colors
        if (hasMultipleTags) {
          // Multi-tagged nodes: draw as pie chart
          const angleStep = (Math.PI * 2) / nodeTags.length;
          let startAngle = -Math.PI / 2; // Start at top

          nodeTags.forEach((tag: string) => {
            const endAngle = startAngle + angleStep;
            const color = tagColors[tag] || '#64748b';

            ctx.beginPath();
            ctx.moveTo(node.x, node.y);
            ctx.arc(node.x, node.y, node.radius, startAngle, endAngle);
            ctx.closePath();
            ctx.fillStyle = color;
            ctx.fill();

            startAngle = endAngle;
          });
        } else {
          // Single-tagged nodes: solid color
          ctx.beginPath();
          ctx.arc(node.x, node.y, node.radius, 0, Math.PI * 2);
          const color = nodeTags[0] ? (tagColors[nodeTags[0]] || '#64748b') : '#64748b';
          ctx.fillStyle = color;
          ctx.fill();
        }

        // Clear glow effect
        ctx.shadowBlur = 0;

        // Draw border (applies to all node types)
        ctx.beginPath();
        ctx.arc(node.x, node.y, node.radius, 0, Math.PI * 2);
        ctx.strokeStyle = isSelected || isHovered ? '#c28f2c' : 'rgba(255, 255, 255, 0.3)';
        ctx.lineWidth = isSelected ? 3 : 1.5;
        ctx.stroke();

        // Draw labels
        // Case 1: No node selected - show all labels with transparency
        // Case 2: Node selected - show label for selected node and connected nodes
        const shouldShowLabel = !selectedNode || isSelected || isConnected || isHovered;

        if (shouldShowLabel) {
          ctx.font = isSelected ? 'bold 14px Georgia, serif' : '12px Georgia, serif';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'top';

          const textWidth = ctx.measureText(node.term).width;

          // Use reduced opacity when no node is selected
          const bgOpacity = !selectedNode ? 0.8 : 0.95;
          const textOpacity = !selectedNode ? 0.7 : 1.0;

          ctx.fillStyle = `rgba(30, 45, 69, ${bgOpacity})`;
          ctx.fillRect(node.x - textWidth / 2 - 4, node.y + node.radius + 4, textWidth + 8, 20);

          ctx.fillStyle = `rgba(255, 255, 255, ${textOpacity})`;
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
      setNodes(prev => prev.map(node =>
        node.id === draggedNode.id
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
    const canvas = canvasRef.current;
    if (!canvas) return;

    // Get mouse position relative to canvas
    const rect = canvas.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    // Convert mouse position to world coordinates (before zoom)
    const worldX = (mouseX - pan.x) / zoom;
    const worldY = (mouseY - pan.y) / zoom;

    // Calculate new zoom
    const delta = e.deltaY > 0 ? 0.9 : 1.1;
    const newZoom = Math.max(0.5, Math.min(3, zoom * delta));

    // Calculate new pan to keep the world point under the cursor
    const newPan = {
      x: mouseX - worldX * newZoom,
      y: mouseY - worldY * newZoom
    };

    setZoom(newZoom);
    setPan(newPan);
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
        <div className="absolute bottom-6 right-6 bg-[#1e2d45] border border-[rgba(255,255,255,0.2)] rounded shadow-paper-lg p-5 max-w-sm">
          <div className="flex items-start justify-between gap-3 mb-3">
            <div className="flex-1">
              <h3 className="text-xl font-display leading-tight">
                <Link href={`/term/${selectedNode.id}`} className="text-white hover:text-[#c28f2c] transition-colors">
                  {selectedNode.term}
                </Link>
              </h3>
              {selectedNode.alternates && selectedNode.alternates.length > 0 && (
                <p className="text-xs text-[rgba(255,255,255,0.5)] italic mt-1 font-light">
                  Also: {selectedNode.alternates.join(', ')}
                </p>
              )}
            </div>
            <button
              onClick={() => setSelectedNode(null)}
              className="p-1 text-[rgba(255,255,255,0.5)] hover:text-[#c28f2c] transition-colors flex-shrink-0"
            >
              <X size={18} />
            </button>
          </div>

          {/* Tags - dots instead of pills */}
          <div className="flex gap-2 mb-3 flex-wrap">
            {selectedNode.tags.map(tag => (
              <button
                key={tag}
                className="flex items-center gap-1.5 hover:opacity-70 transition-opacity"
                onClick={(e) => {
                  e.stopPropagation();
                  onToggleTag(tag);
                }}
                title={`Filter by ${tag}`}
              >
                <div
                  className="w-2.5 h-2.5 rounded-full"
                  style={{ backgroundColor: tagColors[tag] || '#A0A0A0' }}
                />
                <span className="text-xs text-[rgba(255,255,255,0.6)]">{tag}</span>
              </button>
            ))}
          </div>

          {/* Definition with inline autolinks */}
          <div className="divider-sketch">
            {renderDefinitionWithLinks(selectedNode)}
          </div>

          {/* Compact media */}
          {selectedNode.media && selectedNode.media.length > 0 && (
            <div className="divider-sketch">
              <MediaGallery media={selectedNode.media} compact />
            </div>
          )}

          {/* Manual links */}
          {selectedNode.links.length > 0 && (
            <div className="divider-sketch">
              <p className="text-[10px] text-[rgba(255,255,255,0.4)] mb-2 uppercase tracking-wider">
                Related
              </p>
              <div className="flex flex-wrap gap-2">
                {selectedNode.links.map(linkId => {
                  const linkedTerm = allGlossaryData.find(t => t.id === linkId);
                  if (!linkedTerm) return null;

                  const isDiscovered = discoveredTerms.has(linkedTerm.id);
                  return (
                    <button
                      key={linkId}
                      className={`text-xs transition-colors ${
                        isDiscovered
                          ? 'text-[#c28f2c] hover:text-[#d4a03d] hover:underline'
                          : 'text-[rgba(255,255,255,0.4)] hover:text-[rgba(255,255,255,0.6)]'
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
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Instructions overlay */}
      <div className="absolute top-2 left-4 bg-[#1e2d45]/95 border border-[rgba(255,255,255,0.2)] rounded px-3 py-2 text-xs text-[rgba(255,255,255,0.6)]">
        <div>Click & drag nodes • Scroll to zoom • Drag background to pan</div>
      </div>
    </>
  );
}