'use client'

import React, { useRef } from 'react';
import { Search, X } from 'lucide-react';
import { GlossaryTerm, tagColors } from '@/data/glossaryData';

interface SearchOverlayProps {
  isOpen: boolean;
  onClose: () => void;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  filteredResults: GlossaryTerm[];
  highlightedIndex: number;
  onSelectTerm: (term: GlossaryTerm) => void;
  view: 'graph' | 'list';
  viewMode: 'explore' | 'viewAll';
  searchOnlyDiscovered: boolean;
  onToggleSearchMode: () => void;
}

export default function SearchOverlay({
  isOpen,
  onClose,
  searchQuery,
  setSearchQuery,
  filteredResults,
  highlightedIndex,
  onSelectTerm,
  view,
  viewMode,
  searchOnlyDiscovered,
  onToggleSearchMode
}: SearchOverlayProps) {
  const searchInputRef = useRef<HTMLInputElement>(null);

  const highlightMatch = (text: string, query: string) => {
    if (!query.trim() || view === 'list') return text;
    const parts = text.split(new RegExp(`(${query})`, 'gi'));
    return parts.map((part, i) =>
      part.toLowerCase() === query.toLowerCase()
        ? <mark key={i} className="bg-[#F0A896] text-[#2C2C2C]">{part}</mark>
        : part
    );
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-start justify-center pt-20 px-4"
      onClick={onClose}
    >
      <div
        className="bg-[#1e2d45] rounded border border-[rgba(255,255,255,0.2)] shadow-paper-lg w-full max-w-2xl"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center gap-3 px-4 py-3 border-b border-[rgba(255,255,255,0.1)]">
          <Search size={20} className="text-[rgba(255,255,255,0.5)]" />
          <input
            ref={searchInputRef}
            type="text"
            placeholder="Search terms, definitions, or tags..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="flex-1 bg-transparent text-white placeholder-[rgba(255,255,255,0.4)] outline-none"
            autoFocus
          />
          {searchQuery && (
            <button
              onClick={() => {
                setSearchQuery('');
                searchInputRef.current?.focus();
              }}
              className="text-[rgba(255,255,255,0.5)] hover:text-[#c28f2c]"
            >
              <X size={18} />
            </button>
          )}
        </div>

        {/* Search mode toggle (only in explore mode) */}
        {viewMode === 'explore' && (
          <div className="px-4 py-2 border-b border-[rgba(255,255,255,0.1)] bg-[rgba(0,0,0,0.2)]">
            <label className="flex items-center gap-2 text-sm text-[rgba(255,255,255,0.7)] cursor-pointer">
              <input
                type="checkbox"
                checked={searchOnlyDiscovered}
                onChange={onToggleSearchMode}
                className="w-4 h-4 rounded border-[rgba(255,255,255,0.2)] text-[#c28f2c] focus:ring-[#c28f2c]"
              />
              <span>Search only discovered terms</span>
            </label>
          </div>
        )}

        <div className="max-h-96 overflow-y-auto">
          {searchQuery.trim() === '' ? (
            <div className="px-4 py-8 text-center text-[rgba(255,255,255,0.4)]">
              Start typing to search...
            </div>
          ) : filteredResults.length === 0 ? (
            <div className="px-4 py-8 text-center text-[rgba(255,255,255,0.4)]">
              No results found for "{searchQuery}"
            </div>
          ) : (
            filteredResults.map((term, index) => (
              <button
                key={term.id}
                onClick={() => onSelectTerm(term)}
                className={`w-full text-left px-4 py-3 border-b border-[rgba(255,255,255,0.05)] hover:bg-[rgba(255,255,255,0.05)] transition-colors ${
                  index === highlightedIndex ? 'bg-[rgba(255,255,255,0.05)]' : ''
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <h3 className="font-display text-white mb-1">
                      {highlightMatch(term.term, searchQuery)}
                    </h3>
                    <p className="text-sm text-[rgba(255,255,255,0.6)] line-clamp-2">
                      {highlightMatch(term.definition, searchQuery)}
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-1.5 max-w-xs items-start">
                    {term.tags.slice(0, 2).map(tag => (
                      <div key={tag} className="flex items-center gap-1">
                        <div
                          className="w-2 h-2 rounded-full flex-shrink-0"
                          style={{ backgroundColor: tagColors[tag] || '#A0A0A0' }}
                        />
                        <span className="text-xs text-[rgba(255,255,255,0.6)]">{tag}</span>
                      </div>
                    ))}
                    {term.tags.length > 2 && (
                      <span className="text-xs text-[rgba(255,255,255,0.4)]">
                        +{term.tags.length - 2}
                      </span>
                    )}
                  </div>
                </div>
              </button>
            ))
          )}
        </div>

        {filteredResults.length > 0 && (
          <div className="px-4 py-2 border-t border-[rgba(255,255,255,0.1)] flex items-center gap-4 text-xs text-[rgba(255,255,255,0.5)]">
            <span className="flex items-center gap-1">
              <kbd className="px-1.5 py-0.5 bg-[rgba(255,255,255,0.1)] rounded border border-[rgba(255,255,255,0.2)]">↑↓</kbd>
              Navigate
            </span>
            <span className="flex items-center gap-1">
              <kbd className="px-1.5 py-0.5 bg-[rgba(255,255,255,0.1)] rounded border border-[rgba(255,255,255,0.2)]">↵</kbd>
              Select
            </span>
            <span className="flex items-center gap-1">
              <kbd className="px-1.5 py-0.5 bg-[rgba(255,255,255,0.1)] rounded border border-[rgba(255,255,255,0.2)]">esc</kbd>
              Close
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
