import React, { useState, useEffect, useRef } from 'react';
import { Search, X, ZoomIn, ZoomOut, Maximize2, List, Network, Menu } from 'lucide-react';

// Sample glossary data
const glossaryData = [
  {
    id: 'last-hit',
    term: 'Last Hit',
    definition: 'Delivering the killing blow to a minion or monster to gain gold and experience.',
    tags: ['minion', 'strategy', 'fundamentals'],
    links: ['cs', 'gold', 'minion']
  },
  {
    id: 'cs',
    term: 'CS',
    definition: 'The total number of minions and monsters a player has killed.',
    tags: ['minion', 'stat', 'fundamentals'],
    links: ['last-hit', 'gold', 'minion']
  },
  {
    id: 'gold',
    term: 'Gold',
    definition: 'The primary currency used to purchase items in the shop.',
    tags: ['economy', 'fundamentals'],
    links: ['last-hit', 'cs', 'shop', 'item']
  },
  {
    id: 'gank',
    term: 'Gank',
    definition: 'When one or more champions leave their lane to surprise attack an enemy.',
    tags: ['strategy', 'jungle', 'abstract-concept'],
    links: ['jungle', 'lane', 'ward', 'roam']
  },
  {
    id: 'ward',
    term: 'Ward',
    definition: 'An item that provides vision in a specific area.',
    tags: ['item', 'vision', 'strategy'],
    links: ['vision', 'gank', 'jungle']
  },
  {
    id: 'jungle',
    term: 'Jungle',
    definition: 'The area between lanes containing neutral monsters.',
    tags: ['role', 'map', 'fundamentals'],
    links: ['gank', 'buff', 'smite', 'ward']
  },
  {
    id: 'minion',
    term: 'Minion',
    definition: 'AI-controlled units that spawn in waves.',
    tags: ['minion', 'fundamentals'],
    links: ['last-hit', 'cs', 'lane', 'wave']
  },
  {
    id: 'lane',
    term: 'Lane',
    definition: 'One of three primary paths on the map.',
    tags: ['map', 'fundamentals'],
    links: ['minion', 'gank', 'wave', 'roam']
  },
  {
    id: 'roam',
    term: 'Roam',
    definition: 'Leaving your lane to assist teammates.',
    tags: ['strategy', 'abstract-concept'],
    links: ['gank', 'lane', 'map-awareness']
  },
  {
    id: 'vision',
    term: 'Vision',
    definition: 'Sight of areas on the map.',
    tags: ['strategy', 'fundamentals'],
    links: ['ward', 'map-awareness', 'jungle']
  },
  {
    id: 'map-awareness',
    term: 'Map Awareness',
    definition: 'Keeping track of enemy and ally positions.',
    tags: ['strategy', 'abstract-concept'],
    links: ['vision', 'ward', 'roam']
  },
  {
    id: 'buff',
    term: 'Buff',
    definition: 'Temporary enhancement or neutral monster that grants one.',
    tags: ['jungle', 'strategy'],
    links: ['jungle', 'smite']
  },
  {
    id: 'smite',
    term: 'Smite',
    definition: 'Summoner spell that deals true damage to monsters.',
    tags: ['summoner-spell', 'jungle'],
    links: ['jungle', 'buff']
  },
  {
    id: 'wave',
    term: 'Wave',
    definition: 'A group of minions that spawn together.',
    tags: ['minion', 'strategy'],
    links: ['minion', 'lane', 'last-hit']
  },
  {
    id: 'shop',
    term: 'Shop',
    definition: 'Where players purchase items with gold.',
    tags: ['economy', 'fundamentals'],
    links: ['gold', 'item']
  },
  {
    id: 'item',
    term: 'Item',
    definition: 'Equipment that enhances champion stats and abilities.',
    tags: ['item', 'fundamentals'],
    links: ['gold', 'shop']
  }
];

const tagColors = {
  'minion': '#a855f7',
  'strategy': '#3b82f6',
  'fundamentals': '#10b981',
  'stat': '#eab308',
  'economy': '#f59e0b',
  'jungle': '#059669',
  'abstract-concept': '#ec4899',
  'item': '#f97316',
  'vision': '#6366f1',
  'role': '#06b6d4',
  'map': '#14b8a6',
  'summoner-spell': '#d946ef'
};

const tagColorClasses = {
  'minion': 'bg-purple-600',
  'strategy': 'bg-blue-600',
  'fundamentals': 'bg-green-600',
  'stat': 'bg-yellow-600',
  'economy': 'bg-amber-600',
  'jungle': 'bg-emerald-600',
  'abstract-concept': 'bg-pink-600',
  'item': 'bg-orange-600',
  'vision': 'bg-indigo-600',
  'role': 'bg-cyan-600',
  'map': 'bg-teal-600',
  'summoner-spell': 'bg-fuchsia-600'
};

export default function CombinedGlossary() {
  const [view, setView] = useState('graph'); // 'graph' or 'list'
  const [selectedNode, setSelectedNode] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTags, setSelectedTags] = useState([]);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [highlightedIndex, setHighlightedIndex] = useState(0);
  const searchInputRef = useRef(null);

  // Graph-specific state
  const canvasRef = useRef(null);
  const [nodes, setNodes] = useState([]);
  const [hoveredNode, setHoveredNode] = useState(null);
  const [draggedNode, setDraggedNode] = useState(null);
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const animationRef = useRef(null);
  const isPanning = useRef(false);
  const lastPanPos = useRef({ x: 0, y: 0 });

  // Initialize nodes for graph
  useEffect(() => {
    if (view !== 'graph') return;
    
    const canvas = canvasRef.current;
    if (!canvas || nodes.length > 0) return;

    const rect = canvas.getBoundingClientRect();
    const width = rect.width;
    const height = rect.height;

    const initialNodes = glossaryData.map(() => ({
      x: width / 2 + (Math.random() - 0.5) * 400,
      y: height / 2 + (Math.random() - 0.5) * 400,
      vx: 0,
      vy: 0,
      radius: 8
    }));

    setNodes(initialNodes);
  }, [view, nodes.length]);

  // Physics simulation
  useEffect(() => {
    if (view !== 'graph' || nodes.length === 0) return;

    // ADJUST THESE VALUES TO CONTROL GRAPH BEHAVIOR:
    const DAMPING = 0.85;              // Lower = slower movement (0.8-0.95)
    const CENTER_FORCE = 0.0003;       // Strength of pull to center
    const REPULSION = 2000;            // How much nodes push apart
    const LINK_DISTANCE = 150;         // Ideal distance between connected nodes
    const LINK_STRENGTH = 0.008;       // How strongly links pull nodes together

    const simulate = () => {
      setNodes(prevNodes => {
        const newNodes = prevNodes.map((node, i) => ({ 
          ...node,
          ...glossaryData[i]
        }));
        
        for (let i = 0; i < newNodes.length; i++) {
          const node = newNodes[i];
          
          if (draggedNode && draggedNode.id === node.id) continue;

          const canvas = canvasRef.current;
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

          if (node.links && Array.isArray(node.links)) {
            node.links.forEach(linkId => {
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
          }

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
  }, [view, nodes.length, draggedNode]);

  // Drawing
  useEffect(() => {
    if (view !== 'graph') return;
    
    const canvas = canvasRef.current;
    if (!canvas || nodes.length === 0) return;

    // Set canvas size to match display size
    const updateCanvasSize = () => {
      const rect = canvas.getBoundingClientRect();
      const dpr = window.devicePixelRatio || 1;
      canvas.width = rect.width * dpr;
      canvas.height = rect.height * dpr;
      const ctx = canvas.getContext('2d');
      ctx.scale(dpr, dpr);
    };

    updateCanvasSize();
    window.addEventListener('resize', updateCanvasSize);

    const ctx = canvas.getContext('2d');
    const getCanvasSize = () => {
      const rect = canvas.getBoundingClientRect();
      return { width: rect.width, height: rect.height };
    };

    let animationId;
    const draw = () => {
      const { width, height } = getCanvasSize();
      const dpr = window.devicePixelRatio || 1;
      ctx.clearRect(0, 0, width, height);
      
      ctx.save();
      ctx.translate(pan.x, pan.y);
      ctx.scale(zoom, zoom);

      const filteredNodes = nodes.filter(node => {
        if (!node.term || !node.tags) return false;
        const matchesSearch = searchQuery === '' || 
          node.term.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesTags = selectedTags.length === 0 || 
          selectedTags.some(tag => node.tags.includes(tag));
        return matchesSearch && matchesTags;
      });

      ctx.strokeStyle = 'rgba(148, 163, 184, 0.2)';
      ctx.lineWidth = 1.5;
      filteredNodes.forEach(node => {
        if (node.links && Array.isArray(node.links)) {
          node.links.forEach(linkId => {
            const linked = nodes.find(n => n.id === linkId);
            if (linked && filteredNodes.includes(linked)) {
              ctx.beginPath();
              ctx.moveTo(node.x, node.y);
              ctx.lineTo(linked.x, linked.y);
              ctx.stroke();
            }
          });
        }
      });

      if (selectedNode) {
        ctx.strokeStyle = 'rgba(59, 130, 246, 0.6)';
        ctx.lineWidth = 2.5;
        const selected = nodes.find(n => n.id === selectedNode.id);
        if (selected && selected.links && Array.isArray(selected.links)) {
          selected.links.forEach(linkId => {
            const linked = nodes.find(n => n.id === linkId);
            if (linked) {
              ctx.beginPath();
              ctx.moveTo(selected.x, selected.y);
              ctx.lineTo(linked.x, linked.y);
              ctx.stroke();
            }
          });
        }
      }

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
      animationId = requestAnimationFrame(draw);
    };

    draw();

    return () => {
      window.removeEventListener('resize', updateCanvasSize);
      if (animationId) {
        cancelAnimationFrame(animationId);
      }
    };
  }, [view, nodes, selectedNode, hoveredNode, zoom, pan, searchQuery, selectedTags]);

  // Graph mouse interactions
  const handleMouseDown = (e) => {
    if (view !== 'graph') return;
    
    const canvas = canvasRef.current;
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

  const handleMouseMove = (e) => {
    if (view !== 'graph') return;
    
    const canvas = canvasRef.current;
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
      setPan(prev => ({ x: prev.x + dx, y: prev.y + dy }));
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

  const handleWheel = (e) => {
    if (view !== 'graph') return;
    e.preventDefault();
    const delta = e.deltaY > 0 ? 0.9 : 1.1;
    setZoom(prev => Math.max(0.5, Math.min(3, prev * delta)));
  };

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setIsSearchOpen(true);
        setTimeout(() => searchInputRef.current?.focus(), 100);
      }

      if (e.key === 'Escape' && isSearchOpen) {
        setIsSearchOpen(false);
        setSearchQuery('');
        setHighlightedIndex(0);
      }

      if (isSearchOpen && filteredSearchResults.length > 0) {
        if (e.key === 'ArrowDown') {
          e.preventDefault();
          setHighlightedIndex(prev => 
            prev < filteredSearchResults.length - 1 ? prev + 1 : 0
          );
        } else if (e.key === 'ArrowUp') {
          e.preventDefault();
          setHighlightedIndex(prev => 
            prev > 0 ? prev - 1 : filteredSearchResults.length - 1
          );
        } else if (e.key === 'Enter' && filteredSearchResults[highlightedIndex]) {
          e.preventDefault();
          handleSelectTerm(filteredSearchResults[highlightedIndex]);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isSearchOpen, highlightedIndex]);

  const allTags = [...new Set(glossaryData.flatMap(term => term.tags))].sort();

  const toggleTag = (tag) => {
    setSelectedTags(prev => 
      prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]
    );
  };

  const resetView = () => {
    setZoom(1);
    setPan({ x: 0, y: 0 });
  };

  const handleSelectTerm = (term) => {
    setSelectedNode(term);
    setIsSearchOpen(false);
    setHighlightedIndex(0);
  };

  const filteredSearchResults = searchQuery.trim() === '' 
    ? [] 
    : glossaryData.filter(term => 
        term.term.toLowerCase().includes(searchQuery.toLowerCase()) ||
        term.definition.toLowerCase().includes(searchQuery.toLowerCase()) ||
        term.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()))
      );

  const filteredListTerms = glossaryData
    .filter(term => {
      const matchesSearch = searchQuery === '' || 
        term.term.toLowerCase().includes(searchQuery.toLowerCase()) ||
        term.definition.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesTags = selectedTags.length === 0 || 
        selectedTags.some(tag => term.tags.includes(tag));
      return matchesSearch && matchesTags;
    })
    .sort((a, b) => a.term.localeCompare(b.term));

  const highlightMatch = (text, query) => {
    if (!query.trim() || view === 'list') return text;
    const parts = text.split(new RegExp(`(${query})`, 'gi'));
    return parts.map((part, i) => 
      part.toLowerCase() === query.toLowerCase() 
        ? <mark key={i} className="bg-yellow-200 text-gray-900">{part}</mark>
        : part
    );
  };

  return (
    <div className="h-screen bg-slate-900 flex flex-col">
      {/* Header */}
      <header className="bg-slate-800 border-b border-slate-700 px-4 py-3 flex items-center gap-4 flex-shrink-0">
        <button
          onClick={() => setIsSidebarOpen(!isSidebarOpen)}
          className="lg:hidden p-2 text-slate-400 hover:text-white transition-colors"
        >
          <Menu size={20} />
        </button>

        <h1 className="text-xl font-bold text-white">LoL Glossary</h1>
        
        <div className="flex items-center gap-2 bg-slate-700 rounded-lg p-1">
          <button
            onClick={() => setView('list')}
            className={`px-3 py-1.5 rounded text-sm font-medium transition-colors ${
              view === 'list' 
                ? 'bg-slate-600 text-white' 
                : 'text-slate-300 hover:text-white'
            }`}
          >
            <List size={16} className="inline mr-1" />
            List
          </button>
          <button
            onClick={() => setView('graph')}
            className={`px-3 py-1.5 rounded text-sm font-medium transition-colors ${
              view === 'graph' 
                ? 'bg-slate-600 text-white' 
                : 'text-slate-300 hover:text-white'
            }`}
          >
            <Network size={16} className="inline mr-1" />
            Graph
          </button>
        </div>

        <button
          onClick={() => setIsSearchOpen(true)}
          className="flex items-center gap-2 px-4 py-2 bg-slate-700 hover:bg-slate-600 text-slate-300 rounded-lg transition-colors ml-auto"
        >
          <Search size={18} />
          <span className="hidden sm:inline">Search</span>
          <kbd className="hidden md:inline-block px-2 py-0.5 text-xs bg-slate-600 rounded border border-slate-500">
            ⌘K
          </kbd>
        </button>

        {view === 'graph' && (
          <div className="flex items-center gap-2">
            <button
              onClick={() => setZoom(prev => Math.min(3, prev * 1.2))}
              className="p-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition-colors"
              title="Zoom In"
            >
              <ZoomIn size={18} />
            </button>
            <button
              onClick={() => setZoom(prev => Math.max(0.5, prev * 0.8))}
              className="p-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition-colors"
              title="Zoom Out"
            >
              <ZoomOut size={18} />
            </button>
            <button
              onClick={resetView}
              className="p-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition-colors"
              title="Reset View"
            >
              <Maximize2 size={18} />
            </button>
          </div>
        )}
      </header>

      <div className="flex-1 flex overflow-hidden">
        {/* Sidebar */}
        <aside className={`${isSidebarOpen ? 'w-64' : 'w-0'} bg-slate-800 border-r border-slate-700 overflow-hidden transition-all duration-300 flex-shrink-0`}>
          <div className="p-4 h-full overflow-y-auto">
            <h2 className="text-sm font-semibold text-slate-400 mb-3">Filter by Tags</h2>
            <div className="space-y-2">
              {allTags.map(tag => (
                <button
                  key={tag}
                  onClick={() => toggleTag(tag)}
                  className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${
                    selectedTags.includes(tag)
                      ? 'bg-blue-600 text-white'
                      : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <div 
                      className="w-3 h-3 rounded-full flex-shrink-0" 
                      style={{ backgroundColor: tagColors[tag] || '#64748b' }}
                    />
                    <span className="truncate">{tag}</span>
                  </div>
                </button>
              ))}
            </div>

            {selectedTags.length > 0 && (
              <button
                onClick={() => setSelectedTags([])}
                className="w-full mt-4 px-3 py-2 bg-slate-700 hover:bg-slate-600 text-slate-300 rounded-lg text-sm transition-colors"
              >
                Clear Filters
              </button>
            )}
          </div>
        </aside>

        {/* Main Content */}
        <div className="flex-1 relative overflow-hidden">
          {view === 'graph' ? (
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

              {selectedNode && (
                <div className="absolute bottom-4 right-4 bg-slate-800 border border-slate-700 rounded-lg p-4 max-w-sm shadow-xl">
                  <div className="flex items-start justify-between mb-2">
                    <h3 className="text-lg font-bold text-white">{selectedNode.term}</h3>
                    <button
                      onClick={() => setSelectedNode(null)}
                      className="text-slate-400 hover:text-white transition-colors"
                    >
                      <X size={18} />
                    </button>
                  </div>
                  <p className="text-slate-300 text-sm mb-3">{selectedNode.definition}</p>
                  <div className="flex flex-wrap gap-1 mb-3">
                    {selectedNode.tags.map(tag => (
                      <span
                        key={tag}
                        className={`px-2 py-1 text-xs rounded-full text-white ${tagColorClasses[tag] || 'bg-gray-600'}`}
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                  {selectedNode.links.length > 0 && (
                    <div>
                      <h4 className="text-xs font-semibold text-slate-400 mb-1">
                        Connected to {selectedNode.links.length} terms
                      </h4>
                    </div>
                  )}
                </div>
              )}

              <div className="absolute top-4 left-4 bg-slate-800/90 border border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-300">
                <div>Click & drag nodes • Scroll to zoom • Drag background to pan</div>
              </div>
            </>
          ) : (
            <div className="h-full overflow-y-auto p-6">
              <div className="max-w-4xl mx-auto space-y-3">
                {filteredListTerms.length === 0 ? (
                  <div className="text-center py-16">
                    <Search size={48} className="mx-auto text-slate-600 mb-3" />
                    <p className="text-slate-400">No terms match your filters</p>
                  </div>
                ) : (
                  filteredListTerms.map(term => (
                    <div
                      key={term.id}
                      onClick={() => setSelectedNode(term)}
                      className={`bg-slate-800 border rounded-lg p-4 cursor-pointer transition-all hover:border-blue-500 ${
                        selectedNode?.id === term.id ? 'border-blue-500 ring-2 ring-blue-500/20' : 'border-slate-700'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-3 mb-2">
                        <h3 className="text-lg font-bold text-white">{term.term}</h3>
                        <div className="flex flex-wrap gap-1 justify-end">
                          {term.tags.map(tag => (
                            <span
                              key={tag}
                              className={`px-2 py-0.5 text-xs rounded-full text-white ${tagColorClasses[tag] || 'bg-gray-600'}`}
                            >
                              {tag}
                            </span>
                          ))}
                        </div>
                      </div>
                      <p className="text-slate-300 text-sm mb-2">{term.definition}</p>
                      {term.links.length > 0 && (
                        <div className="flex flex-wrap gap-2 text-xs text-slate-400">
                          <span className="font-semibold">Related:</span>
                          {term.links.map(linkId => {
                            const linkedTerm = glossaryData.find(t => t.id === linkId);
                            return linkedTerm ? (
                              <span
                                key={linkId}
                                className="px-2 py-0.5 bg-slate-700 rounded hover:bg-slate-600 transition-colors"
                              >
                                {linkedTerm.term}
                              </span>
                            ) : null;
                          })}
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Search Overlay */}
      {isSearchOpen && (
        <div 
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-start justify-center pt-20 px-4"
          onClick={() => {
            setIsSearchOpen(false);
            setHighlightedIndex(0);
          }}
        >
          <div 
            className="bg-slate-800 rounded-lg border border-slate-700 shadow-2xl w-full max-w-2xl"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center gap-3 px-4 py-3 border-b border-slate-700">
              <Search size={20} className="text-slate-400" />
              <input
                ref={searchInputRef}
                type="text"
                placeholder="Search terms, definitions, or tags..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="flex-1 bg-transparent text-white placeholder-slate-400 outline-none"
                autoFocus
              />
              {searchQuery && (
                <button
                  onClick={() => {
                    setSearchQuery('');
                    searchInputRef.current?.focus();
                  }}
                  className="text-slate-400 hover:text-white"
                >
                  <X size={18} />
                </button>
              )}
            </div>

            <div className="max-h-96 overflow-y-auto">
              {searchQuery.trim() === '' ? (
                <div className="px-4 py-8 text-center text-slate-400">
                  Start typing to search...
                </div>
              ) : filteredSearchResults.length === 0 ? (
                <div className="px-4 py-8 text-center text-slate-400">
                  No results found for "{searchQuery}"
                </div>
              ) : (
                filteredSearchResults.map((term, index) => (
                  <button
                    key={term.id}
                    onClick={() => handleSelectTerm(term)}
                    className={`w-full text-left px-4 py-3 border-b border-slate-700 hover:bg-slate-700/50 transition-colors ${
                      index === highlightedIndex ? 'bg-slate-700/50' : ''
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-white mb-1">
                          {highlightMatch(term.term, searchQuery)}
                        </h3>
                        <p className="text-sm text-slate-300 line-clamp-2">
                          {highlightMatch(term.definition, searchQuery)}
                        </p>
                      </div>
                      <div className="flex flex-wrap gap-1 max-w-xs">
                        {term.tags.slice(0, 2).map(tag => (
                          <span
                            key={tag}
                            className={`px-2 py-0.5 text-xs rounded-full text-white flex-shrink-0 ${tagColorClasses[tag] || 'bg-gray-600'}`}
                          >
                            {tag}
                          </span>
                        ))}
                        {term.tags.length > 2 && (
                          <span className="px-2 py-0.5 text-xs text-slate-400">
                            +{term.tags.length - 2}
                          </span>
                        )}
                      </div>
                    </div>
                  </button>
                ))
              )}
            </div>

            {filteredSearchResults.length > 0 && (
              <div className="px-4 py-2 border-t border-slate-700 flex items-center gap-4 text-xs text-slate-400">
                <span className="flex items-center gap-1">
                  <kbd className="px-1.5 py-0.5 bg-slate-700 rounded border border-slate-600">↑↓</kbd>
                  Navigate
                </span>
                <span className="flex items-center gap-1">
                  <kbd className="px-1.5 py-0.5 bg-slate-700 rounded border border-slate-600">↵</kbd>
                  Select
                </span>
                <span className="flex items-center gap-1">
                  <kbd className="px-1.5 py-0.5 bg-slate-700 rounded border border-slate-600">esc</kbd>
                  Close
                </span>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}