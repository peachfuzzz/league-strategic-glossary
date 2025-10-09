'use client'

import React, { useState, useEffect, useRef } from 'react';
import { Search, ZoomIn, ZoomOut, Maximize2, List, Network, Menu } from 'lucide-react';
import { glossaryData, GlossaryTerm } from '@/data/glossaryData';
import GraphView from './GraphView';
import ListView from './ListView';
import SearchOverlay from './SearchOverlay';
import TagSidebar from './TagSidebar';

export default function GlossaryGraph() {
  // View state
  const [view, setView] = useState<'graph' | 'list'>('graph');
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  // Selection and interaction state
  const [selectedNode, setSelectedNode] = useState<GlossaryTerm | null>(null);
  const [hoveredNode, setHoveredNode] = useState<GlossaryTerm | null>(null);
  
  // Search state
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(0);
  
  // Filter state
  const [selectedTags, setSelectedTags] = useState<string[]>([]);

  // Graph-specific state
  const [nodes, setNodes] = useState<any[]>([]);
  const [draggedNode, setDraggedNode] = useState<any>(null);
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });

  // Derived data
  const allTags = [...new Set(glossaryData.flatMap(term => term.tags))].sort();

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

  // Handlers
  const toggleTag = (tag: string) => {
    setSelectedTags(prev => 
      prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]
    );
  };

  const handleSelectTerm = (term: GlossaryTerm) => {
    setSelectedNode(term);
    setIsSearchOpen(false);
    setSearchQuery('');
    setHighlightedIndex(0);
  };

  const resetView = () => {
    setZoom(1);
    setPan({ x: 0, y: 0 });
  };

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setIsSearchOpen(true);
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
  }, [isSearchOpen, highlightedIndex, filteredSearchResults]);

  // Reset highlighted index when search query changes
  useEffect(() => {
    setHighlightedIndex(0);
  }, [searchQuery]);

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
        <TagSidebar
          isOpen={isSidebarOpen}
          allTags={allTags}
          selectedTags={selectedTags}
          onToggleTag={toggleTag}
          onClearTags={() => setSelectedTags([])}
        />

        <div className="flex-1 relative overflow-hidden">
          {view === 'graph' ? (
            <GraphView
              nodes={nodes}
              setNodes={setNodes}
              selectedNode={selectedNode}
              setSelectedNode={setSelectedNode}
              hoveredNode={hoveredNode}
              setHoveredNode={setHoveredNode}
              draggedNode={draggedNode}
              setDraggedNode={setDraggedNode}
              zoom={zoom}
              pan={pan}
              setPan={setPan}
              searchQuery={searchQuery}
              selectedTags={selectedTags}
              glossaryData={glossaryData}
            />
          ) : (
            <ListView
              filteredTerms={filteredListTerms}
              selectedNode={selectedNode}
              setSelectedNode={setSelectedNode}
              glossaryData={glossaryData}
            />
          )}
        </div>
      </div>

      <SearchOverlay
        isOpen={isSearchOpen}
        onClose={() => {
          setIsSearchOpen(false);
          setSearchQuery('');
          setHighlightedIndex(0);
        }}
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        filteredResults={filteredSearchResults}
        highlightedIndex={highlightedIndex}
        onSelectTerm={handleSelectTerm}
      />
    </div>
  );
}