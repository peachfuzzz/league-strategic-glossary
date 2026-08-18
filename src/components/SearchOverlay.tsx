'use client'

import React from 'react';
import Link from 'next/link';
import { ConceptView as GlossaryTerm } from '@/data/vocab';
import { getTagColorMap } from '@/config/tags.config';

const tagColors = getTagColorMap();

interface SearchOverlayProps {
  query: string;
  results: GlossaryTerm[];
  highlightedIndex: number;
  onHighlight: (index: number) => void;
  onSelect: (term: GlossaryTerm) => void;
}

// Anchored results dropdown for the always-visible header search input.
// Not a modal — it renders inline under the input and only when there's a
// query, per DESIGN.md §0's "search is a visible input, not a button that
// opens a modal."
export default function SearchOverlay({
  query,
  results,
  highlightedIndex,
  onHighlight,
  onSelect,
}: SearchOverlayProps) {
  const highlightMatch = (text: string) => {
    const trimmed = query.trim();
    if (!trimmed) return text;
    const escaped = trimmed.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const parts = text.split(new RegExp(`(${escaped})`, 'gi'));
    return parts.map((part, i) =>
      part.toLowerCase() === trimmed.toLowerCase()
        ? <mark key={i} className="bg-signal/20 text-ink">{part}</mark>
        : part
    );
  };

  return (
    <div className="absolute top-full left-0 right-0 mt-1 bg-paper-2 border border-rule rounded-xs max-h-96 overflow-y-auto z-[60]">
      {results.length === 0 ? (
        <div className="px-4 py-6 text-center text-ink-3 text-sm">
          No results found for &quot;{query}&quot;
        </div>
      ) : (
        results.map((term, index) => (
          <Link
            key={term.id}
            href={`/term/${term.id}`}
            onClick={() => onSelect(term)}
            onMouseEnter={() => onHighlight(index)}
            className={`block px-4 py-3 border-b border-rule/50 last:border-b-0 hover:bg-ink/5 transition-colors ${
              index === highlightedIndex ? 'bg-ink/5' : ''
            }`}
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1 min-w-0">
                <h3 className="font-display text-ink mb-1">
                  {highlightMatch(term.prefLabel)}
                </h3>
                <p className="text-sm text-ink-2 line-clamp-2">
                  {highlightMatch(term.summary)}
                </p>
              </div>
              <div className="flex flex-wrap gap-1.5 max-w-xs items-start">
                {term.collection.slice(0, 2).map(tag => (
                  <div key={tag} className="flex items-center gap-1">
                    <div
                      className="w-2 h-2 rounded-full flex-shrink-0"
                      style={{ backgroundColor: tagColors[tag] || '#A0A0A0' }}
                    />
                    <span className="text-xs text-ink-3">{tag}</span>
                  </div>
                ))}
                {term.collection.length > 2 && (
                  <span className="text-xs text-ink-3">
                    +{term.collection.length - 2}
                  </span>
                )}
              </div>
            </div>
          </Link>
        ))
      )}
    </div>
  );
}
