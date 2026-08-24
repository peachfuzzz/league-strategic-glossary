'use client'

import React, { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { X, ZoomIn, ZoomOut, Maximize2, Maximize, Minimize } from 'lucide-react';
import { ConceptView as GlossaryTerm } from '@/data/vocab';
import { getTagColorMap } from '@/config/tags.config';

const tagColors = getTagColorMap();
import { GRAPH_PHYSICS_CONFIG } from '@/config/graph.config';

// Canvas fillStyle/strokeStyle/shadowColor need a resolved CSS color string;
// colorTokensRef caches tokens as "r, g, b" triples so call sites can layer
// their own alpha on top via rgba(rgb, alpha).
const rgba = (rgb: string, a = 1) => `rgba(${rgb}, ${a})`;

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
  const containerRef = useRef<HTMLDivElement>(null);
  const animationRef = useRef<number | null>(null);
  const isPanning = useRef(false);
  const lastPanPos = useRef({ x: 0, y: 0 });
  const timeRef = useRef<number>(0);

  // Graph controls (zoom, fit, fullscreen) — render only here, bottom-right.
  const [isFullscreen, setIsFullscreen] = useState(false);
  useEffect(() => {
    const handleFullscreenChange = () => setIsFullscreen(document.fullscreenElement === containerRef.current);
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  const handleZoomIn = () => setZoom(prev => Math.min(3, prev * 1.2));
  const handleZoomOut = () => setZoom(prev => Math.max(0.5, prev * 0.8));
  const handleFit = () => {
    setZoom(1);
    setPan({ x: 0, y: 0 });
  };
  const toggleFullscreen = () => {
    if (document.fullscreenElement) {
      document.exitFullscreen();
    } else {
      containerRef.current?.requestFullscreen();
    }
  };

  // Canvas can't use Tailwind classes — resolve the CSS tokens it needs once
  // on mount and cache them, rather than calling getComputedStyle per frame.
  // Stored as "r, g, b" triples so draw() can compose alphas via rgba().
  const colorTokensRef = useRef({
    paper: '247, 245, 240',
    ink: '23, 22, 20',
    signal: '176, 38, 31',
    rule: '221, 216, 206',
  });
  useEffect(() => {
    const hexToRgb = (hex: string) => {
      const h = hex.trim().replace('#', '');
      const full = h.length === 3 ? h.split('').map(c => c + c).join('') : h.slice(0, 6);
      const n = parseInt(full, 16);
      return `${(n >> 16) & 255}, ${(n >> 8) & 255}, ${n & 255}`;
    };

    const css = getComputedStyle(document.documentElement);
    colorTokensRef.current = {
      paper: hexToRgb(css.getPropertyValue('--color-paper')),
      ink: hexToRgb(css.getPropertyValue('--color-ink')),
      signal: hexToRgb(css.getPropertyValue('--color-signal')),
      rule: hexToRgb(css.getPropertyValue('--color-rule')),
    };
  }, []);

  /**
   * The definition's first sentence, as plain text. The ellipsis marks entries
   * whose definition continues on the term page.
   */
  const renderDefinition = (term: GlossaryTerm) => (
    <p className="text-ink leading-relaxed">
      {term.summary}
      {term.truncated && <span className="text-ink-3"> …</span>}
    </p>
  );

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

    // Compute connection counts for radius scaling
    const MIN_RADIUS = 6;
    const MAX_RADIUS = 12;
    const connectionCounts = glossaryData.map(term =>
      term.related.length
    );
    const maxConnections = Math.max(...connectionCounts, 1);

    // Create nodes for all glossary items, merging with existing positions if available
    const newNodes = glossaryData.map((term, i) => {
      const existingNode = nodes.find(n => n.id === term.id);
      const radius = MIN_RADIUS + (connectionCounts[i] / maxConnections) * (MAX_RADIUS - MIN_RADIUS);
      return existingNode ? {
        ...existingNode,
        ...term,
        radius
      } : {
        ...term,
        x: width / 2 + (Math.random() - 0.5) * 400,
        y: height / 2 + (Math.random() - 0.5) * 400,
        vx: 0,
        vy: 0,
        radius
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
            ...(node.related || [])
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

  // Keep canvas bitmap in sync with its rendered size (runs once; reacts to any parent-size change)
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const updateCanvasSize = () => {
      const rect = canvas.getBoundingClientRect();
      if (rect.width === 0 || rect.height === 0) return;
      const dpr = window.devicePixelRatio || 1;
      canvas.width = rect.width * dpr;
      canvas.height = rect.height * dpr;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      }
    };

    updateCanvasSize();
    const resizeObserver = new ResizeObserver(updateCanvasSize);
    resizeObserver.observe(canvas);

    return () => resizeObserver.disconnect();
  }, []);

  // Drawing
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || nodes.length === 0) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const getCanvasSize = () => {
      const rect = canvas.getBoundingClientRect();
      return { width: rect.width, height: rect.height };
    };

    let drawAnimationId: number;
    const draw = () => {
      timeRef.current = performance.now();
      const { width, height } = getCanvasSize();

      // Draw canvas background
      ctx.fillStyle = rgba(colorTokensRef.current.paper);
      ctx.fillRect(0, 0, width, height);

      ctx.save();
      ctx.translate(pan.x, pan.y);
      ctx.scale(zoom, zoom);

      // Draw dot grid background for spatial reference
      const dotSpacing = 40;
      const dotColor = rgba(colorTokensRef.current.ink, 0.06);
      const visibleLeft = -pan.x / zoom;
      const visibleTop = -pan.y / zoom;
      const visibleRight = visibleLeft + width / zoom;
      const visibleBottom = visibleTop + height / zoom;
      const startX = Math.floor(visibleLeft / dotSpacing) * dotSpacing;
      const startY = Math.floor(visibleTop / dotSpacing) * dotSpacing;

      ctx.fillStyle = dotColor;
      for (let x = startX; x <= visibleRight; x += dotSpacing) {
        for (let y = startY; y <= visibleBottom; y += dotSpacing) {
          ctx.fillRect(x - 0.5, y - 0.5, 1, 1);
        }
      }

      const filteredNodes = nodes.filter(node => {
        if (!node.prefLabel || !node.collection) return false;
        const matchesSearch = searchQuery === '' ||
          node.prefLabel.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesTags = selectedTags.length === 0 ||
          selectedTags.every((tag: string) => node.collection.includes(tag));
        return matchesSearch && matchesTags;
      });

      // Draw links (both manual and auto-detected)
      ctx.lineWidth = 1.5;
      filteredNodes.forEach(node => {
        // Combine manual and auto links
        const allLinks = [
          ...(node.related || [])
        ];

        allLinks.forEach((linkId: string) => {
          const linked = nodes.find(n => n.id === linkId);
          if (linked && filteredNodes.includes(linked)) {
            ctx.strokeStyle = rgba(colorTokensRef.current.ink, 0.25);
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
          ...(node.related || [])
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

            // Draw animated dashed line (marching ants)
            ctx.setLineDash([4, 4]);
            ctx.lineDashOffset = -(timeRef.current * 0.015);
            ctx.strokeStyle = rgba(colorTokensRef.current.ink, 0.12);
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(node.x, node.y);
            ctx.lineTo(endX, endY);
            ctx.stroke();
            ctx.setLineDash([]);
            ctx.lineDashOffset = 0;
          });
        }
      });

      // Highlight selected node connections
      if (selectedNode) {
        const selected = nodes.find(n => n.id === selectedNode.id);
        if (selected) {
          // Combine manual and auto links for highlighting
          const allLinks = [
            ...(selected.related || [])
          ];

          // Draw discovered connections
          ctx.strokeStyle = rgba(colorTokensRef.current.signal, 0.7);
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

              // Draw animated dashed line for selected node (marching ants)
              ctx.setLineDash([5, 5]);
              ctx.lineDashOffset = -(timeRef.current * 0.02);
              ctx.strokeStyle = rgba(colorTokensRef.current.signal, 0.35);
              ctx.lineWidth = 2;
              ctx.beginPath();
              ctx.moveTo(selected.x, selected.y);
              ctx.lineTo(endX, endY);
              ctx.stroke();
              ctx.setLineDash([]);
              ctx.lineDashOffset = 0;
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
          (selectedNode.related && selectedNode.related.includes(node.id))
        );

        // Draw node as pie chart if it has multiple tags
        const nodeTags = node.collection || [];
        const hasMultipleTags = nodeTags.length > 1;

        // Hover pulse: gentle breathing effect on hovered nodes
        const hoverPulse = isHovered ? 1 + 0.08 * Math.sin(timeRef.current * 0.006) : 1;
        const drawRadius = node.radius * hoverPulse;

        // Set glow effect for selected, connected, or hovered nodes
        if (isSelected) {
          ctx.shadowColor = rgba(colorTokensRef.current.signal);
          ctx.shadowBlur = 20;
        } else if (isConnected) {
          ctx.shadowColor = rgba(colorTokensRef.current.signal, 0.7);
          ctx.shadowBlur = 12;
        } else if (isHovered) {
          ctx.shadowColor = rgba(colorTokensRef.current.signal);
          ctx.shadowBlur = 10 + 4 * Math.sin(timeRef.current * 0.006);
        } else {
          // Subtle ambient glow for all nodes
          ctx.shadowColor = rgba(colorTokensRef.current.ink, 0.15);
          ctx.shadowBlur = 4;
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
            ctx.arc(node.x, node.y, drawRadius, startAngle, endAngle);
            ctx.closePath();
            ctx.fillStyle = color;
            ctx.fill();

            startAngle = endAngle;
          });
        } else {
          // Single-tagged nodes: solid color
          ctx.beginPath();
          ctx.arc(node.x, node.y, drawRadius, 0, Math.PI * 2);
          const color = nodeTags[0] ? (tagColors[nodeTags[0]] || '#64748b') : '#64748b';
          ctx.fillStyle = color;
          ctx.fill();
        }

        // Clear glow effect
        ctx.shadowBlur = 0;

        // Draw border (applies to all node types)
        ctx.beginPath();
        ctx.arc(node.x, node.y, drawRadius, 0, Math.PI * 2);
        ctx.strokeStyle = isSelected || isHovered ? rgba(colorTokensRef.current.signal) : rgba(colorTokensRef.current.rule);
        ctx.lineWidth = isSelected ? 3 : 1.5;
        ctx.stroke();

        // Draw labels
        // Case 1: No node selected - show all labels with transparency
        // Case 2: Node selected - show label for selected node and connected nodes
        const shouldShowLabel = !selectedNode || isSelected || isConnected || isHovered;

        if (shouldShowLabel) {
          ctx.font = isSelected ? '600 14px "Source Sans 3", system-ui, sans-serif' : '12px "Source Sans 3", system-ui, sans-serif';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'top';

          const textOpacity = !selectedNode ? 0.7 : 1.0;

          ctx.fillStyle = rgba(colorTokensRef.current.ink, textOpacity);
          ctx.fillText(node.prefLabel, node.x, node.y + drawRadius + 8);
        }
      });

      ctx.restore();
      drawAnimationId = requestAnimationFrame(draw);
    };

    draw();

    return () => {
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

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const handleWheel = (e: WheelEvent) => {
      e.preventDefault();
      const rect = canvas.getBoundingClientRect();
      const mouseX = e.clientX - rect.left;
      const mouseY = e.clientY - rect.top;

      const worldX = (mouseX - pan.x) / zoom;
      const worldY = (mouseY - pan.y) / zoom;

      const delta = e.deltaY > 0 ? 0.9 : 1.1;
      const newZoom = Math.max(0.5, Math.min(3, zoom * delta));

      setZoom(newZoom);
      setPan({
        x: mouseX - worldX * newZoom,
        y: mouseY - worldY * newZoom,
      });
    };

    canvas.addEventListener('wheel', handleWheel, { passive: false });
    return () => canvas.removeEventListener('wheel', handleWheel);
  }, [pan.x, pan.y, zoom, setZoom, setPan]);

  return (
    <div ref={containerRef} className="relative w-full h-full bg-paper">
      <canvas
        ref={canvasRef}
        className="w-full h-full cursor-grab active:cursor-grabbing"
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
      />

      {/* Selected node info panel */}
      {selectedNode && (
        <div className="fixed bottom-[72px] right-6 z-40 bg-paper-2 border border-signal/25 rounded p-5 max-w-sm max-h-[calc(100vh-12rem)] overflow-y-auto" style={{ borderTop: '2px solid color-mix(in srgb, var(--color-signal) 50%, transparent)' }}>
          <div className="flex items-start justify-between gap-3 mb-3">
            <div className="flex-1">
              <h3 className="text-xl font-display leading-tight">
                <Link href={`/term/${selectedNode.slug}`} className="text-ink hover:text-signal transition-colors">
                  {selectedNode.prefLabel}
                </Link>
              </h3>
              {selectedNode.altLabel.length > 0 && (
                <p className="text-xs text-ink-3 italic mt-1 font-light">
                  Also: {selectedNode.altLabel.join(', ')}
                </p>
              )}
            </div>
            <button
              onClick={() => setSelectedNode(null)}
              className="p-1 text-ink-3 hover:text-signal transition-colors flex-shrink-0"
            >
              <X size={18} />
            </button>
          </div>

          {/* Tags - dots instead of pills */}
          <div className="flex gap-2 mb-3 flex-wrap">
            {selectedNode.collection.map(tag => (
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
                <span className="text-xs text-ink-3">{tag}</span>
              </button>
            ))}
          </div>

          {/* Definition with inline autolinks */}
          <div className="divider-sketch">
            {renderDefinition(selectedNode)}
          </div>

          {/* Manual links */}
          {selectedNode.related.length > 0 && (
            <div className="divider-sketch">
              <p className="text-[10px] text-ink-3 mb-2 uppercase tracking-wider">
                Related
              </p>
              <div className="flex flex-wrap gap-2">
                {selectedNode.related.map(linkId => {
                  const linkedTerm = allGlossaryData.find(t => t.id === linkId);
                  if (!linkedTerm) return null;

                  const isDiscovered = discoveredTerms.has(linkedTerm.id);
                  return (
                    <button
                      key={linkId}
                      className={`text-xs transition-colors ${
                        isDiscovered
                          ? 'text-signal hover:text-signal-2 hover:underline'
                          : 'text-ink-3 hover:text-ink-2'
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
                      {linkedTerm.prefLabel}
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Graph controls — zoom, fit, fullscreen. Render only here. */}
      <div className="absolute bottom-4 right-4 z-50 flex items-center gap-1 bg-paper-2/95 border border-rule rounded px-2 py-1.5">
        <button
          onClick={handleZoomOut}
          className="p-1 text-ink-2 hover:text-signal transition-colors"
          title="Zoom out"
          aria-label="Zoom out"
        >
          <ZoomOut size={16} />
        </button>
        <span className="text-xs text-ink-3 w-10 text-center tabular-nums">
          {Math.round(zoom * 100)}%
        </span>
        <button
          onClick={handleZoomIn}
          className="p-1 text-ink-2 hover:text-signal transition-colors"
          title="Zoom in"
          aria-label="Zoom in"
        >
          <ZoomIn size={16} />
        </button>
        <span className="w-px h-4 bg-rule mx-1" />
        <button
          onClick={handleFit}
          className="p-1 text-ink-2 hover:text-signal transition-colors"
          title="Fit view"
          aria-label="Fit view"
        >
          <Maximize2 size={16} />
        </button>
        <button
          onClick={toggleFullscreen}
          className="p-1 text-ink-2 hover:text-signal transition-colors"
          title={isFullscreen ? 'Exit fullscreen' : 'Fullscreen'}
          aria-label="Toggle fullscreen"
        >
          {isFullscreen ? <Minimize size={16} /> : <Maximize size={16} />}
        </button>
      </div>
    </div>
  );
}