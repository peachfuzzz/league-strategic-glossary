'use client';

import { Fragment } from 'react';
import Link from 'next/link';
import { ChevronLeft, ChevronRight, ArrowLeft } from 'lucide-react';
import type { Concept, ConceptRef } from '@/data/vocab';
import { getTagConfig } from '@/config/tags.config';

interface TermPageContentProps {
  concept: Concept;
  related: ConceptRef[];
  backLinks: ConceptRef[];
  prevTerm: ConceptRef | null;
  nextTerm: ConceptRef | null;
}

/**
 * Definition prose, rendered as plain text.
 *
 * Backticks escape a span from linking; strip the markers and keep the text.
 * Cross-references become explicit wikilinks in a later phase - until then
 * there is nothing to linkify.
 */
function renderDefinition(concept: Concept) {
  const displayDefinition = concept.definition.replace(/`([^`]+)`/g, '$1');

  return (
    <p className="text-ink-2 text-[1.0625rem] leading-[1.65] max-w-(--measure)">
      {displayDefinition}
    </p>
  );
}

function TrailingList({ label, terms }: { label: string; terms: ConceptRef[] }) {
  if (terms.length === 0) return null;

  return (
    <p className="mt-4 text-[0.875rem] font-body">
      <span className="font-mono uppercase tracking-[0.08em] text-[0.6875rem] font-medium text-ink-3 mr-2">
        {label}
      </span>
      {terms.map((linked, i) => (
        <Fragment key={linked.id}>
          {i > 0 && <span className="text-ink-3"> · </span>}
          <Link
            href={`/term/${linked.slug}`}
            className="text-signal decoration-signal/40 hover:text-signal-2 underline decoration-1 underline-offset-2 transition-colors"
          >
            {linked.prefLabel}
          </Link>
        </Fragment>
      ))}
    </p>
  );
}

export default function TermPageContent({
  concept,
  related,
  backLinks,
  prevTerm,
  nextTerm,
}: TermPageContentProps) {
  const category = concept.collection
    .map((t) => getTagConfig(t)?.label ?? t)
    .join(' · ');

  return (
    <div className="bg-paper flex-1">
      <div className="max-w-2xl mx-auto px-6 py-8">
        {/* Back to glossary */}
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-sm text-ink-3 hover:text-signal transition-colors mb-6"
        >
          <ArrowLeft size={14} />
          Back to Glossary
        </Link>

        {/* dt may not contain heading content, so the document's h1 is
            visually hidden and the visible headword lives in the dt below. */}
        <h1 className="sr-only">{concept.prefLabel}</h1>

        <dl>
          <div>
            <dt>
              <div className="flex items-baseline justify-between gap-4">
                <span className="text-2xl font-display text-ink">{concept.prefLabel}</span>
                {category && (
                  <span className="shrink-0 text-[0.6875rem] font-mono uppercase tracking-[0.08em] font-medium text-ink-3">
                    {category}
                  </span>
                )}
              </div>
              {!concept.complete && (
                <p className="mt-1 text-[0.6875rem] font-mono uppercase tracking-[0.08em] font-medium text-ink-3">
                  Draft — this definition is unfinished
                </p>
              )}
              {concept.altLabel.length > 0 && (
                <p className="also-known-as font-body mt-1">
                  also known as: {concept.altLabel.join(', ')}
                </p>
              )}
            </dt>

            <dd className="mt-3 pl-6">
              {renderDefinition(concept)}

              <TrailingList label="See also" terms={related} />
              <TrailingList label="Referenced by" terms={backLinks} />
            </dd>
          </div>
        </dl>

        {/* Prev/Next navigation */}
        <div className="flex items-center justify-between mt-8 pt-6 border-t border-rule">
          {prevTerm ? (
            <Link
              href={`/term/${prevTerm.slug}`}
              className="flex items-center gap-1.5 text-sm text-ink-3 hover:text-signal transition-colors"
            >
              <ChevronLeft size={16} />
              {prevTerm.prefLabel}
            </Link>
          ) : (
            <span />
          )}
          {nextTerm ? (
            <Link
              href={`/term/${nextTerm.slug}`}
              className="flex items-center gap-1.5 text-sm text-ink-3 hover:text-signal transition-colors"
            >
              {nextTerm.prefLabel}
              <ChevronRight size={16} />
            </Link>
          ) : (
            <span />
          )}
        </div>
      </div>
    </div>
  );
}
