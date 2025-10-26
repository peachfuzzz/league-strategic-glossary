'use client'

import React, { useRef } from 'react';
import { Search, X } from 'lucide-react';
import { GlossaryTerm, tagColorClasses } from '@/data/glossaryData';

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
        ? <mark key={i} className="bg-yellow-200 text-gray-900">{part}</mark>
        : part
    );
  };

  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-start justify-center pt-20 px-4"
      onClick={onClose}
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

                    {/* Search mode toggle (only in explore mode) */}
                    {viewMode === 'explore' && (
                      <div className="px-4 py-2 border-b border-slate-700 bg-slate-800/50">
                        <label className="flex items-center gap-2 text-sm text-slate-300 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={searchOnlyDiscovered}
                            onChange={onToggleSearchMode}
                            className="w-4 h-4 rounded border-slate-600 bg-slate-700 text-blue-600 focus:ring-blue-500 focus:ring-offset-slate-800"
                          />
                          <span>Search only discovered terms</span>
                        </label>
                      </div>
                    )}
        
                    <div className="max-h-96 overflow-y-auto">
                      {searchQuery.trim() === '' ? (
                        <div className="px-4 py-8 text-center text-slate-400">
                          Start typing to search...
                        </div>
                      ) : filteredResults.length === 0 ? (
                        <div className="px-4 py-8 text-center text-slate-400">
                          No results found for "{searchQuery}"
                        </div>
                      ) : (
                        filteredResults.map((term, index) => (
                          <button
                            key={term.id}
                            onClick={() => onSelectTerm(term)}
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
        
                    {filteredResults.length > 0 && (
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
  );
}