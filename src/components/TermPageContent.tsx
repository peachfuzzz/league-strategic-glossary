'use client';

import { Fragment } from 'react';
import Link from 'next/link';
import { ChevronLeft, ChevronRight, ArrowLeft } from 'lucide-react';
import { GlossaryTerm, glossaryData } from '@/data/glossaryData';
import { getTagConfig } from '@/config/tags.config';
import MediaGallery from '@/components/MediaGallery';

interface TermPageContentProps {
  term: GlossaryTerm;
  manualLinks: GlossaryTerm[];
  backLinks: GlossaryTerm[];
  prevTerm: GlossaryTerm | null;
  nextTerm: GlossaryTerm | null;
}

function renderDefinition(term: GlossaryTerm) {
  // Strip backticks from the definition for display
  const displayDefinition = term.definition.replace(/`([^`]+)`/g, '$1');

  if (!term.autoLinks || term.autoLinks.length === 0) {
    return <p className="text-ink-2 text-[1.0625rem] leading-[1.65] max-w-(--measure)">{displayDefinition}</p>;
  }

  // Build a map of term IDs to their display names and patterns
  const linkMap = new Map<string, { term: GlossaryTerm; patterns: RegExp[] }>();
  term.autoLinks.forEach((linkId) => {
    const linkedTerm = glossaryData.find((t) => t.id === linkId);
    if (linkedTerm) {
      const patterns: RegExp[] = [];
      const escapedTerm = linkedTerm.term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      patterns.push(new RegExp(`\\b${escapedTerm}\\b`, 'gi'));

      if (linkedTerm.alternates && linkedTerm.alternates.length > 0) {
        linkedTerm.alternates.forEach((alternate) => {
          const escapedAlt = alternate.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
          patterns.push(new RegExp(`\\b${escapedAlt}\\b`, 'gi'));
        });
      }

      linkMap.set(linkId, { term: linkedTerm, patterns });
    }
  });

  // Find all matches and their positions
  const matches: Array<{ start: number; end: number; linkId: string; text: string }> = [];
  linkMap.forEach((value, linkId) => {
    value.patterns.forEach((pattern) => {
      let match;
      while ((match = pattern.exec(displayDefinition)) !== null) {
        matches.push({
          start: match.index,
          end: match.index + match[0].length,
          linkId,
          text: match[0],
        });
      }
    });
  });

  matches.sort((a, b) => a.start - b.start);

  const parts: React.ReactNode[] = [];
  let lastIndex = 0;

  matches.forEach((match, i) => {
    if (match.start < lastIndex) return;

    if (match.start > lastIndex) {
      parts.push(displayDefinition.substring(lastIndex, match.start));
    }

    parts.push(
      <Link
        key={`${match.linkId}-${i}`}
        href={`/term/${match.linkId}`}
        className="text-signal decoration-signal/40 hover:text-signal-2 underline decoration-1 underline-offset-2 transition-colors"
      >
        {match.text}
      </Link>
    );

    lastIndex = match.end;
  });

  if (lastIndex < displayDefinition.length) {
    parts.push(displayDefinition.substring(lastIndex));
  }

  return <p className="text-ink-2 text-[1.0625rem] leading-[1.65] max-w-(--measure)">{parts}</p>;
}

function TrailingList({ label, terms }: { label: string; terms: GlossaryTerm[] }) {
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
            href={`/term/${linked.id}`}
            className="text-signal decoration-signal/40 hover:text-signal-2 underline decoration-1 underline-offset-2 transition-colors"
          >
            {linked.term}
          </Link>
        </Fragment>
      ))}
    </p>
  );
}

export default function TermPageContent({
  term,
  manualLinks,
  backLinks,
  prevTerm,
  nextTerm,
}: TermPageContentProps) {
  const category = term.tags
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
        <h1 className="sr-only">{term.term}</h1>

        <dl>
          <div>
            <dt>
              <div className="flex items-baseline justify-between gap-4">
                <span className="text-2xl font-display text-ink">{term.term}</span>
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
              {renderDefinition(term)}

              {term.media && term.media.length > 0 && (
                <div className="mt-6 max-w-(--measure)">
                  <MediaGallery media={term.media} />
                </div>
              )}

              <TrailingList label="See also" terms={manualLinks} />
              <TrailingList label="Referenced by" terms={backLinks} />
            </dd>
          </div>
        </dl>

        {/* Prev/Next navigation */}
        <div className="flex items-center justify-between mt-8 pt-6 border-t border-rule">
          {prevTerm ? (
            <Link
              href={`/term/${prevTerm.id}`}
              className="flex items-center gap-1.5 text-sm text-ink-3 hover:text-signal transition-colors"
            >
              <ChevronLeft size={16} />
              {prevTerm.term}
            </Link>
          ) : (
            <span />
          )}
          {nextTerm ? (
            <Link
              href={`/term/${nextTerm.id}`}
              className="flex items-center gap-1.5 text-sm text-ink-3 hover:text-signal transition-colors"
            >
              {nextTerm.term}
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
