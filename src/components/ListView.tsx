'use client'

import React from 'react';
import { Search } from 'lucide-react';
import { GlossaryTerm, tagColorClasses } from '@/data/glossaryData';

interface ListViewProps {
  filteredTerms: GlossaryTerm[];
  selectedNode: GlossaryTerm | null;
  setSelectedNode: (node: GlossaryTerm | null) => void;
  glossaryData: GlossaryTerm[];
  onDiscoverTerm: (termId: string) => void;
  viewMode: 'explore' | 'viewAll';
  discoveredTerms?: Set<string>;
}

export default function ListView({
  filteredTerms,
  selectedNode,
  setSelectedNode,
  glossaryData,
  onDiscoverTerm,
  viewMode,
  discoveredTerms = new Set()
}: ListViewProps) {
  // Render definition with inline autolinks
  const renderDefinitionWithLinks = (term: GlossaryTerm) => {
    if (!term.autoLinks || term.autoLinks.length === 0) {
      return <p className="text-slate-300 text-sm mb-3">{term.definition}</p>;
    }

    // Build a map of term IDs to their display names and positions in text
    const linkMap = new Map<string, { term: GlossaryTerm; pattern: RegExp }>();
    term.autoLinks.forEach(linkId => {
      const linkedTerm = glossaryData.find(t => t.id === linkId);
      if (linkedTerm) {
        // Create regex that matches the term (case-insensitive, whole word)
        const escapedTerm = linkedTerm.term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        const pattern = new RegExp(`\\b${escapedTerm}\\b`, 'gi');
        linkMap.set(linkId, { term: linkedTerm, pattern });
      }
    });

    // Find all matches and their positions
    const matches: Array<{ start: number; end: number; linkId: string; text: string }> = [];
    linkMap.forEach((value, linkId) => {
      let match;
      while ((match = value.pattern.exec(term.definition)) !== null) {
        matches.push({
          start: match.index,
          end: match.index + match[0].length,
          linkId,
          text: match[0]
        });
      }
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
  return (
    <div className="h-full overflow-y-auto p-6">
      <div className="max-w-4xl mx-auto space-y-3">
        {filteredTerms.length === 0 ? (
          <div className="text-center py-16">
            <Search size={48} className="mx-auto text-slate-600 mb-3" />
            <p className="text-slate-400">No terms match your filters</p>
          </div>
        ) : (
          filteredTerms.map(term => (
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

                      {/* Definition with inline autolinks */}
                      {renderDefinitionWithLinks(term)}

                      {/* Manual links (dashed border) */}
                      {term.links.length > 0 && (
                        <div className="flex flex-wrap gap-2 text-xs text-slate-400">
                          <span className="font-semibold">Also see:</span>
                          {term.links.map(linkId => {
                            const linkedTerm = glossaryData.find(t => t.id === linkId);
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
          ))
        )}
      </div>
    </div>
  );
}