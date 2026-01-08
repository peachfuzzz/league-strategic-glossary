'use client'

import React, { useState, useEffect, useRef } from 'react';
import { Search, ZoomIn, ZoomOut, Maximize2, List, Network, Menu, Eye, BookOpen, RotateCcw, Shuffle, HelpCircle } from 'lucide-react';
import { glossaryData, GlossaryTerm, tagColors } from '@/data/glossaryData';
import GraphView from './GraphView';
import ListView from './ListView';
import SearchOverlay from './SearchOverlay';
import TagSidebar from './TagSidebar';
import HelpCard from './HelpCard';

// LocalStorage keys
const STORAGE_KEYS = {
  VIEW_MODE: 'glossary_viewMode',
  DISCOVERED_TERMS: 'glossary_discoveredTerms',
  STARTING_TERM: 'glossary_startingTerm',
  SEARCH_MODE: 'glossary_searchOnlyDiscovered',
  HAS_SEEN_HELP: 'glossary_hasSeenHelp',
  SIDEBAR_OPEN: 'glossary_sidebarOpen'
};

// Utility functions for localStorage
const loadFromStorage = <T,>(key: string, defaultValue: T): T => {
  if (typeof window === 'undefined') return defaultValue;
  try {
    const item = window.localStorage.getItem(key);
    return item ? JSON.parse(item) : defaultValue;
  } catch {
    return defaultValue;
  }
};

const saveToStorage = (key: string, value: any) => {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // Ignore storage errors
  }
};

const getRandomTerm = (): string => {
  if (glossaryData.length === 0) return '';
  const randomIndex = Math.floor(Math.random() * glossaryData.length);
  return glossaryData[randomIndex].id;
};

const getDefaultStartingTerm = (): string => {
  // Try to use 'last-hit' if it exists, otherwise use first term
  const lastHit = glossaryData.find(t => t.id === 'last-hit');
  if (lastHit) return 'last-hit';
  return glossaryData.length > 0 ? glossaryData[0].id : '';
};

export default function GlossaryGraph() {
  // Hydration-safe mounting state
  const [mounted, setMounted] = useState(false);

  // View state
  const [view, setView] = useState<'graph' | 'list'>('graph');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  // Help card state
  const [isHelpOpen, setIsHelpOpen] = useState(false);

  // Discovery mode state (use defaults initially for SSR)
  const defaultTerm = getDefaultStartingTerm();
  const [viewMode, setViewMode] = useState<'explore' | 'viewAll'>('explore');
  const [startingTermId, setStartingTermId] = useState<string>(defaultTerm);
  const [discoveredTerms, setDiscoveredTerms] = useState<Set<string>>(new Set([defaultTerm]));
  const [searchOnlyDiscovered, setSearchOnlyDiscovered] = useState(false);

  // Load from storage after mount and show help if first visit
  useEffect(() => {
    setViewMode(loadFromStorage(STORAGE_KEYS.VIEW_MODE, 'explore'));

    // Load starting term, but validate it exists
    const savedStartingTerm = loadFromStorage(STORAGE_KEYS.STARTING_TERM, defaultTerm);
    const validStartingTerm = glossaryData.find(t => t.id === savedStartingTerm) ? savedStartingTerm : defaultTerm;
    setStartingTermId(validStartingTerm);

    // Load discovered terms, but filter out any that no longer exist
    const savedTerms = loadFromStorage<string[]>(STORAGE_KEYS.DISCOVERED_TERMS, [defaultTerm]);
    const validTerms = savedTerms.filter(id => glossaryData.find(t => t.id === id));
    setDiscoveredTerms(new Set(validTerms.length > 0 ? validTerms : [validStartingTerm]));

    setSearchOnlyDiscovered(loadFromStorage(STORAGE_KEYS.SEARCH_MODE, false));
    setIsSidebarOpen(loadFromStorage(STORAGE_KEYS.SIDEBAR_OPEN, false));

    // Show help on first visit
    const hasSeenHelp = loadFromStorage(STORAGE_KEYS.HAS_SEEN_HELP, false);
    if (!hasSeenHelp) {
      setIsHelpOpen(true);
    }

    setMounted(true);
  }, []);

  // Selection and interaction state
  const [selectedNode, setSelectedNode] = useState<GlossaryTerm | null>(null);
  const [hoveredNode, setHoveredNode] = useState<GlossaryTerm | null>(null);

  // Search state
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(0);

  // Filter state
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [hoveredTag, setHoveredTag] = useState<string | null>(null);

  // Graph-specific state
  const [nodes, setNodes] = useState<any[]>([]);
  const [draggedNode, setDraggedNode] = useState<any>(null);
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });

  // Persist state to localStorage
  useEffect(() => {
    saveToStorage(STORAGE_KEYS.VIEW_MODE, viewMode);
  }, [viewMode]);

  useEffect(() => {
    saveToStorage(STORAGE_KEYS.DISCOVERED_TERMS, Array.from(discoveredTerms));
  }, [discoveredTerms]);

  useEffect(() => {
    saveToStorage(STORAGE_KEYS.STARTING_TERM, startingTermId);
  }, [startingTermId]);

  useEffect(() => {
    saveToStorage(STORAGE_KEYS.SEARCH_MODE, searchOnlyDiscovered);
  }, [searchOnlyDiscovered]);

  useEffect(() => {
    saveToStorage(STORAGE_KEYS.SIDEBAR_OPEN, isSidebarOpen);
  }, [isSidebarOpen]);

  // Derived data
  const allTags = [...new Set(glossaryData.flatMap(term => term.tags))].sort();

  // Base glossary data (filtered by discovery in explore mode)
  const baseGlossaryData = viewMode === 'explore'
    ? glossaryData.filter(term => discoveredTerms.has(term.id))
    : glossaryData;

  // Search results (respects searchOnlyDiscovered toggle in explore mode)
  const searchPool = viewMode === 'explore' && searchOnlyDiscovered
    ? baseGlossaryData
    : glossaryData;

  const filteredSearchResults = searchQuery.trim() === ''
    ? []
    : searchPool.filter(term =>
        term.term.toLowerCase().includes(searchQuery.toLowerCase()) ||
        term.definition.toLowerCase().includes(searchQuery.toLowerCase()) ||
        term.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (term.alternates && term.alternates.some(alt => alt.toLowerCase().includes(searchQuery.toLowerCase())))
      );

  const filteredListTerms = baseGlossaryData
    .filter(term => {
      const matchesSearch = searchQuery === '' ||
        term.term.toLowerCase().includes(searchQuery.toLowerCase()) ||
        term.definition.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (term.alternates && term.alternates.some(alt => alt.toLowerCase().includes(searchQuery.toLowerCase())));
      const matchesTags = selectedTags.length === 0 ||
        selectedTags.every(tag => term.tags.includes(tag));
      return matchesSearch && matchesTags;
    })
    .sort((a, b) => a.term.localeCompare(b.term));

  // Discovery stats
  const discoveryCount = discoveredTerms.size;
  const totalCount = glossaryData.length;

  // Handlers
  const handleDiscoverTerm = (termId: string) => {
    if (viewMode === 'explore') {
      setDiscoveredTerms(prev => new Set([...prev, termId]));
      // Auto-select the newly discovered term
      const term = glossaryData.find(t => t.id === termId);
      if (term) setSelectedNode(term);
    }
  };

  const handleResetDiscoveries = () => {
    setDiscoveredTerms(new Set([startingTermId]));
    setSelectedNode(null);
    setNodes([]);
  };

  const handleRerollStartingTerm = () => {
    const newStartingTerm = getRandomTerm();
    setStartingTermId(newStartingTerm);
    setDiscoveredTerms(new Set([newStartingTerm]));
    setSelectedNode(null);
    setNodes([]);
  };

  const toggleViewMode = () => {
    setViewMode(prev => prev === 'explore' ? 'viewAll' : 'explore');
  };

  const handleCloseHelp = () => {
    setIsHelpOpen(false);
    saveToStorage(STORAGE_KEYS.HAS_SEEN_HELP, true);
  };

  const toggleTag = (tag: string) => {
    setSelectedTags(prev =>
      prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]
    );
    // Show the sidebar when a tag is clicked
    // if (!isSidebarOpen) {
    //   setIsSidebarOpen(true);
    // }
  };

  const handleSelectTerm = (term: GlossaryTerm) => {
    // In explore mode, discover term when selected via search
    if (viewMode === 'explore' && !discoveredTerms.has(term.id)) {
      handleDiscoverTerm(term.id);
    } else {
      setSelectedNode(term);
    }
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
      <header className="bg-slate-800 border-b border-slate-700 px-4 py-3 flex items-center gap-3 flex-shrink-0 flex-wrap">
        <button
          onClick={() => setIsSidebarOpen(!isSidebarOpen)}
          className="p-2 text-slate-400 hover:text-white transition-colors"
          title={isSidebarOpen ? 'Hide filter bar' : 'Show filter bar'}
        >
          <Menu size={20} />
        </button>

        <h1 className="text-xl font-bold text-white">LoL Glossary</h1>

        {/* View Mode Toggle */}
        <button
          onClick={toggleViewMode}
          className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
            viewMode === 'explore'
              ? 'bg-blue-600 text-white hover:bg-blue-700'
              : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
          }`}
          title={viewMode === 'explore' ? 'Switch to View All' : 'Switch to Explore Mode'}
        >
          {viewMode === 'explore' ? (
            <>
              <Eye size={16} />
              <span className="hidden sm:inline">
                Explore: {mounted ? `${discoveryCount}/${totalCount}` : '...'}
              </span>
              <span className="sm:hidden">
                {mounted ? `${discoveryCount}/${totalCount}` : '...'}
              </span>
            </>
          ) : (
            <>
              <BookOpen size={16} />
              <span className="hidden sm:inline">View All</span>
            </>
          )}
        </button>

        {/* Discovery Controls (only in explore mode) */}
        {viewMode === 'explore' && (
          <>
            <button
              onClick={handleResetDiscoveries}
              className="p-2 bg-slate-700 hover:bg-slate-600 text-slate-300 rounded-lg transition-colors"
              title="Reset discoveries (keep starting term)"
            >
              <RotateCcw size={16} />
            </button>
            <button
              onClick={handleRerollStartingTerm}
              className="p-2 bg-slate-700 hover:bg-slate-600 text-slate-300 rounded-lg transition-colors"
              title="Reroll starting term"
            >
              <Shuffle size={16} />
            </button>
          </>
        )}

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

        <button
          onClick={() => setIsHelpOpen(true)}
          className="p-2 bg-slate-700 hover:bg-slate-600 text-slate-300 rounded-lg transition-colors"
          title="Help"
        >
          <HelpCircle size={18} />
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
          hoveredTag={hoveredTag}
        />

        {/* Active Filters Bar - shows when sidebar is collapsed and filters are active */}
        {!isSidebarOpen && selectedTags.length > 0 && (
          <div className="w-4 bg-slate-800 border-r border-slate-700 flex flex-col gap-1.5 py-2 items-center flex-shrink-0">
            {selectedTags.map(tag => (
              <div
                key={tag}
                className="w-2.5 h-2.5 rounded-full"
                style={{ backgroundColor: tagColors[tag] || '#64748b' }}
                title={tag}
              />
            ))}
          </div>
        )}

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
              setZoom={setZoom}
              pan={pan}
              setPan={setPan}
              searchQuery={searchQuery}
              selectedTags={selectedTags}
              glossaryData={baseGlossaryData}
              allGlossaryData={glossaryData}
              viewMode={viewMode}
              onDiscoverTerm={handleDiscoverTerm}
              discoveredTerms={discoveredTerms}
              hoveredTag={hoveredTag}
              setHoveredTag={setHoveredTag}
              onToggleTag={toggleTag}
            />
          ) : (
            <ListView
              filteredTerms={filteredListTerms}
              selectedNode={selectedNode}
              setSelectedNode={setSelectedNode}
              glossaryData={glossaryData}
              onDiscoverTerm={handleDiscoverTerm}
              viewMode={viewMode}
              discoveredTerms={discoveredTerms}
              hoveredTag={hoveredTag}
              setHoveredTag={setHoveredTag}
              onToggleTag={toggleTag}
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
        view={view}
        viewMode={viewMode}
        searchOnlyDiscovered={searchOnlyDiscovered}
        onToggleSearchMode={() => setSearchOnlyDiscovered(!searchOnlyDiscovered)}
      />

      <HelpCard
        isOpen={isHelpOpen}
        onClose={handleCloseHelp}
      />
    </div>
  );
}