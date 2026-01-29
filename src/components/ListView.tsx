'use client'

import React from 'react';
import Link from 'next/link';
import { Search } from 'lucide-react';
import { GlossaryTerm, tagColors } from '@/data/glossaryData';
import MediaGallery from '@/components/MediaGallery';

interface ListViewProps {
  filteredTerms: GlossaryTerm[];
  selectedNode: GlossaryTerm | null;
  setSelectedNode: (node: GlossaryTerm | null) => void;
  glossaryData: GlossaryTerm[];
  onDiscoverTerm: (termId: string) => void;
  viewMode: 'explore' | 'viewAll';
  discoveredTerms?: Set<string>;
  hoveredTag: string | null;
  setHoveredTag: (tag: string | null) => void;
  onToggleTag: (tag: string) => void;
}

export default function ListView({
  filteredTerms,
  selectedNode,
  setSelectedNode,
  glossaryData,
  onDiscoverTerm,
  viewMode,
  discoveredTerms = new Set(),
  hoveredTag,
  setHoveredTag,
  onToggleTag
}: ListViewProps) {
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
      const linkedTerm = glossaryData.find(t => t.id === linkId);
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

  return (
    <div className="h-full overflow-y-auto p-6">
      <div className="max-w-7xl mx-auto space-y-3">
        {filteredTerms.length === 0 ? (
          <div className="text-center py-16">
            <Search size={48} className="mx-auto text-[rgba(255,255,255,0.3)] mb-3" />
            <p className="text-[rgba(255,255,255,0.5)]">No terms match your filters</p>
          </div>
        ) : (
          filteredTerms.map(term => (
            <div
              key={term.id}
              onClick={() => setSelectedNode(term)}
              className={`bg-[#1e2d45] border rounded shadow-paper p-4 cursor-pointer transition-all hover:border-[#c28f2c] hover:shadow-paper-lg ${
                selectedNode?.id === term.id ? 'border-[#c28f2c] ring-2 ring-[#c28f2c]/20 shadow-paper-lg' : 'border-[rgba(255,255,255,0.1)]'
              }`}
            >
              <div className="flex items-start justify-between gap-3 mb-3">
                <div className="flex-1">
                  <h3 className="text-lg font-display">
                    <Link href={`/term/${term.id}`} className="text-white hover:text-[#c28f2c] transition-colors">
                      {term.term}
                    </Link>
                  </h3>
                  {term.alternates && term.alternates.length > 0 && (
                    <p className="text-xs text-[rgba(255,255,255,0.5)] italic mt-1 font-light">
                      Also: {term.alternates.join(', ')}
                    </p>
                  )}
                </div>

                {/* Tags - dots instead of pills */}
                <div className="flex flex-wrap gap-2 justify-end">
                  {term.tags.map(tag => (
                    <button
                      key={tag}
                      className={`flex items-center gap-1.5 hover:opacity-70 transition-opacity ${
                        hoveredTag === tag ? 'opacity-70' : ''
                      }`}
                      onClick={(e) => {
                        e.stopPropagation();
                        onToggleTag(tag);
                      }}
                      onMouseEnter={() => setHoveredTag(tag)}
                      onMouseLeave={() => setHoveredTag(null)}
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
              </div>

              {/* Definition with inline autolinks */}
              <div className="divider-sketch">
                {renderDefinitionWithLinks(term)}
              </div>

              {/* Compact media */}
              {term.media && term.media.length > 0 && (
                <div className="divider-sketch">
                  <MediaGallery media={term.media} compact />
                </div>
              )}

              {/* Manual links */}
              {term.links.length > 0 && (
                <div className="divider-sketch">
                  <p className="text-[10px] text-[rgba(255,255,255,0.4)] mb-2 uppercase tracking-wider">
                    Related
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {term.links.map(linkId => {
                      const linkedTerm = glossaryData.find(t => t.id === linkId);
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
          ))
        )}
      </div>
    </div>
  );
}
