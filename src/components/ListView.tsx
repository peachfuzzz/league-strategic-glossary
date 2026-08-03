'use client'

import React from 'react';
import Link from 'next/link';
import { Search } from 'lucide-react';
import { GlossaryTerm } from '@/data/glossaryData';
import { getTagConfig } from '@/config/tags.config';
import MediaGallery from '@/components/MediaGallery';

interface ListViewProps {
  filteredTerms: GlossaryTerm[];
  setSelectedNode: (node: GlossaryTerm | null) => void;
  glossaryData: GlossaryTerm[];
  onDiscoverTerm: (termId: string) => void;
  viewMode: 'explore' | 'viewAll';
  discoveredTerms?: Set<string>;
}

export default function ListView({
  filteredTerms,
  setSelectedNode,
  glossaryData,
  onDiscoverTerm,
  viewMode,
  discoveredTerms = new Set(),
}: ListViewProps) {
  // Render definition with inline autolinks
  const renderDefinitionWithLinks = (term: GlossaryTerm) => {
    // Strip backticks from the definition for display
    const displayDefinition = term.definition.replace(/`([^`]+)`/g, '$1');

    if (!term.autoLinks || term.autoLinks.length === 0) {
      return <p className="text-ink-2 text-[1.0625rem] leading-[1.65] max-w-(--measure)">{displayDefinition}</p>;
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
                ? 'text-signal decoration-signal/40 hover:text-signal-2'
                : 'text-ink-3 hover:text-signal'
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

    return <p className="text-ink-2 text-[1.0625rem] leading-[1.65] max-w-(--measure)">{parts}</p>;
  };

  return (
    <div className="h-full overflow-y-auto p-6">
      <div className="max-w-7xl mx-auto">
        {filteredTerms.length === 0 ? (
          <div className="text-center py-16">
            <Search size={48} className="mx-auto text-ink-3 mb-3" />
            <p className="text-ink-3">No terms match your filters</p>
          </div>
        ) : (
          <dl className="divide-y divide-rule">
            {filteredTerms.map(term => {
              const category = term.tags
                .map(tag => getTagConfig(tag)?.label ?? tag)
                .join(' · ');

              return (
                <div key={term.id} className="py-[calc(var(--spacing-entry)/2)] first:pt-0 last:pb-0">
                  <dt>
                    <div className="flex items-baseline justify-between gap-4">
                      <Link href={`/term/${term.id}`} className="text-2xl font-display text-ink hover:text-signal transition-colors">
                        {term.term}
                      </Link>
                      {category && (
                        <span className="shrink-0 text-[0.6875rem] font-mono uppercase tracking-[0.08em] font-medium text-ink-3">
                          {category}
                        </span>
                      )}
                    </div>
                    {term.alternates && term.alternates.length > 0 && (
                      <p className="also-known-as font-body mt-1">
                        also known as: {term.alternates.join(', ')}
                      </p>
                    )}
                  </dt>

                  <dd className="mt-3 pl-6">
                    {renderDefinitionWithLinks(term)}

                    {term.media && term.media.length > 0 && (
                      <div className="mt-4 max-w-(--measure)">
                        <MediaGallery media={term.media} compact />
                      </div>
                    )}

                    {term.links.length > 0 && (
                      <p className="mt-4 text-[0.875rem] font-body">
                        <span className="font-mono uppercase tracking-[0.08em] text-[0.6875rem] font-medium text-ink-3 mr-2">
                          See also
                        </span>
                        {term.links.map((linkId, i) => {
                          const linkedTerm = glossaryData.find(t => t.id === linkId);
                          if (!linkedTerm) return null;

                          const isDiscovered = discoveredTerms.has(linkedTerm.id);
                          return (
                            <React.Fragment key={linkId}>
                              {i > 0 && <span className="text-ink-3"> · </span>}
                              <button
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
                                    ? 'text-signal decoration-signal/40 hover:text-signal-2'
                                    : 'text-ink-3 hover:text-signal'
                                }`}
                              >
                                {linkedTerm.term}
                              </button>
                            </React.Fragment>
                          );
                        })}
                      </p>
                    )}
                  </dd>
                </div>
              );
            })}
          </dl>
        )}
      </div>
    </div>
  );
}
