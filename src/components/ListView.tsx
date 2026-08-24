'use client'

import React from 'react';
import Link from 'next/link';
import { Search } from 'lucide-react';
import { ConceptView } from '@/data/vocab';
import { getTagConfig } from '@/config/tags.config';

interface ListViewProps {
  filteredTerms: ConceptView[];
  setSelectedNode: (node: ConceptView | null) => void;
  glossaryData: ConceptView[];
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
  /**
   * The definition's first sentence, as plain text.
   *
   * The ellipsis marks entries whose definition continues on the term page, so
   * this index is not mistaken for the whole reference work.
   */
  const renderDefinition = (term: ConceptView) => (
    <p className="text-ink-2 text-[1.0625rem] leading-[1.65] max-w-(--measure)">
      {term.summary}
      {term.truncated && <span className="text-ink-3"> …</span>}
    </p>
  );

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
              const category = term.collection
                .map(tag => getTagConfig(tag)?.label ?? tag)
                .join(' · ');

              return (
                <div key={term.id} className="py-[calc(var(--spacing-entry)/2)] first:pt-0 last:pb-0">
                  <dt>
                    <div className="flex items-baseline justify-between gap-4">
                      <Link href={`/term/${term.slug}`} className="text-2xl font-display text-ink hover:text-signal transition-colors">
                        {term.prefLabel}
                      </Link>
                      {category && (
                        <span className="shrink-0 text-[0.6875rem] font-mono uppercase tracking-[0.08em] font-medium text-ink-3">
                          {category}
                        </span>
                      )}
                    </div>
                    {!term.complete && (
                      <p className="mt-1 text-[0.6875rem] font-mono uppercase tracking-[0.08em] font-medium text-ink-3">
                        Draft
                      </p>
                    )}
                    {term.altLabel.length > 0 && (
                      <p className="also-known-as font-body mt-1">
                        also known as: {term.altLabel.join(', ')}
                      </p>
                    )}
                  </dt>

                  <dd className="mt-3 pl-6">
                    {renderDefinition(term)}

                    {term.related.length > 0 && (
                      <p className="mt-4 text-[0.875rem] font-body">
                        <span className="font-mono uppercase tracking-[0.08em] text-[0.6875rem] font-medium text-ink-3 mr-2">
                          See also
                        </span>
                        {term.related.map((linkId, i) => {
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
                                {linkedTerm.prefLabel}
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
