'use client'

import React, { useState, useEffect } from 'react';
import { RotateCcw, Shuffle } from 'lucide-react';
import { glossaryData, GlossaryTerm } from '@/data/glossaryData';
import { SHUFFLE_CONFIG } from '@/config/shuffle.config';
import { useSearch } from '@/context/SearchContext';
import GraphView from './GraphView';
import ListView from './ListView';
import TagFilterDropdown from './TagFilterDropdown';

// LocalStorage keys
const STORAGE_KEYS = {
  VIEW_MODE: 'glossary_viewMode',
  DISCOVERED_TERMS: 'glossary_discoveredTerms',
  STARTING_TERM: 'glossary_startingTerm',
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

  // Filter terms based on minimum connection requirement
  const eligibleTerms = glossaryData.filter(term => {
    const totalConnections = (term.links?.length || 0) + (term.autoLinks?.length || 0);
    return totalConnections >= SHUFFLE_CONFIG.minConnections;
  });

  // Fallback to all terms if no terms meet the criteria
  const termsToChooseFrom = eligibleTerms.length > 0 ? eligibleTerms : glossaryData;

  const randomIndex = Math.floor(Math.random() * termsToChooseFrom.length);
  return termsToChooseFrom[randomIndex].id;
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

  // Discovery mode state (use defaults initially for SSR)
  const defaultTerm = getDefaultStartingTerm();
  const [viewMode, setViewMode] = useState<'explore' | 'viewAll'>('explore');
  const [startingTermId, setStartingTermId] = useState<string>(defaultTerm);
  const [discoveredTerms, setDiscoveredTerms] = useState<Set<string>>(new Set([defaultTerm]));

  // Load from storage after mount
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

    setIsSidebarOpen(loadFromStorage(STORAGE_KEYS.SIDEBAR_OPEN, false));

    setMounted(true);
  }, []);

  // Selection and interaction state
  const [selectedNode, setSelectedNode] = useState<GlossaryTerm | null>(null);
  const [hoveredNode, setHoveredNode] = useState<GlossaryTerm | null>(null);

  // Search: the input lives in Header.tsx, above this component in the tree,
  // so the live query is shared via context rather than local state.
  const { query: searchQuery } = useSearch();

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
    saveToStorage(STORAGE_KEYS.SIDEBAR_OPEN, isSidebarOpen);
  }, [isSidebarOpen]);

  // Derived data
  const allTags = [...new Set(glossaryData.flatMap(term => term.tags))].sort();

  // Base glossary data (filtered by discovery in explore mode)
  const baseGlossaryData = viewMode === 'explore'
    ? glossaryData.filter(term => discoveredTerms.has(term.id))
    : glossaryData;

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

  const toggleTag = (tag: string) => {
    setSelectedTags(prev =>
      prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]
    );
  };

  return (
    <div className="flex-1 bg-paper flex flex-col">
      {/* Glossary Toolbar — two separate controls: mode (Explore/View All)
          and presentation (List/Graph). Kept visually distinct per DESIGN.md
          §4: collapsing them into one segmented row is the bug being fixed. */}
      <div className="bg-paper-2 border-b border-rule flex-shrink-0 relative z-40">
        <div className="max-w-7xl mx-auto px-6 py-3 flex items-center gap-6 flex-wrap">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-4">
              <button
                onClick={() => setViewMode('explore')}
                className={`text-sm pb-0.5 transition-colors ${
                  viewMode === 'explore'
                    ? 'text-ink border-b-2 border-signal font-medium'
                    : 'text-ink-3 hover:text-signal'
                }`}
              >
                Explore{mounted ? ` · ${discoveryCount}/${totalCount}` : ''}
              </button>
              <button
                onClick={() => setViewMode('viewAll')}
                className={`text-sm pb-0.5 transition-colors ${
                  viewMode === 'viewAll'
                    ? 'text-ink border-b-2 border-signal font-medium'
                    : 'text-ink-3 hover:text-signal'
                }`}
              >
                View All
              </button>
            </div>

            {viewMode === 'explore' && (
              <div className="flex items-center gap-1 border-l border-rule pl-3">
                <button
                  onClick={handleResetDiscoveries}
                  className="p-1.5 text-ink-2 hover:text-signal transition-colors"
                  title="Reset discoveries (keep starting term)"
                >
                  <RotateCcw size={16} />
                </button>
                <button
                  onClick={handleRerollStartingTerm}
                  className="p-1.5 text-ink-2 hover:text-signal transition-colors"
                  title="Random starting term"
                >
                  <Shuffle size={16} />
                </button>
              </div>
            )}
          </div>

          <div className="flex items-center gap-4 border-l border-rule pl-6 ml-auto">
            <button
              onClick={() => setView('list')}
              className={`text-sm pb-0.5 transition-colors ${
                view === 'list'
                  ? 'text-ink border-b-2 border-signal font-medium'
                  : 'text-ink-3 hover:text-signal'
              }`}
            >
              List
            </button>
            <button
              onClick={() => setView('graph')}
              className={`text-sm pb-0.5 transition-colors ${
                view === 'graph'
                  ? 'text-ink border-b-2 border-signal font-medium'
                  : 'text-ink-3 hover:text-signal'
              }`}
            >
              Graph
            </button>
          </div>
        </div>
      </div>

      <div className="flex-1 flex flex-col overflow-hidden">
        <div className="flex-1 relative overflow-hidden">
          {/* Tag Filter — overlay on content */}
          <TagFilterDropdown
            isOpen={isSidebarOpen}
            onToggleOpen={() => setIsSidebarOpen(!isSidebarOpen)}
            allTags={allTags}
            selectedTags={selectedTags}
            onToggleTag={toggleTag}
            onClearTags={() => setSelectedTags([])}
            hoveredTag={hoveredTag}
            setHoveredTag={setHoveredTag}
          />
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
              setSelectedNode={setSelectedNode}
              glossaryData={glossaryData}
              onDiscoverTerm={handleDiscoverTerm}
              viewMode={viewMode}
              discoveredTerms={discoveredTerms}
            />
          )}
        </div>

        {view === 'graph' && (
          <p className="shrink-0 text-center text-xs text-ink-3 py-2 border-t border-rule bg-paper-2">
            Click and drag nodes to rearrange · scroll to zoom · drag the background to pan
          </p>
        )}
      </div>
    </div>
  );
}
