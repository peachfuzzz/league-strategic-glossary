'use client';

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
    return <p className="text-white/90 leading-relaxed text-base">{displayDefinition}</p>;
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
        className="text-[#c28f2c] hover:text-[#d4a03d] underline decoration-1 underline-offset-2 transition-colors"
      >
        {match.text}
      </Link>
    );

    lastIndex = match.end;
  });

  if (lastIndex < displayDefinition.length) {
    parts.push(displayDefinition.substring(lastIndex));
  }

  return <p className="text-white/90 leading-relaxed text-base">{parts}</p>;
}

export default function TermPageContent({
  term,
  manualLinks,
  backLinks,
  prevTerm,
  nextTerm,
}: TermPageContentProps) {
  const tagConfigs = term.tags
    .map((t) => getTagConfig(t))
    .filter((c): c is NonNullable<typeof c> => c !== undefined);

  return (
    <div className="bg-[#161f32] flex-1">
      <div className="max-w-2xl mx-auto px-6 py-8">
        {/* Back to glossary */}
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-sm text-white/50 hover:text-[#c28f2c] transition-colors mb-6"
        >
          <ArrowLeft size={14} />
          Back to Glossary
        </Link>

        {/* Term header */}
        <h1 className="text-3xl font-display text-white mb-3">{term.term}</h1>

        {/* Alternates */}
        {term.alternates && term.alternates.length > 0 && (
          <p className="text-white/50 text-sm mb-4">
            Also known as: {term.alternates.join(', ')}
          </p>
        )}

        {/* Tags */}
        <div className="flex flex-wrap gap-2 mb-6">
          {tagConfigs.map((tag) => (
            <Link
              key={tag.id}
              href={`/?tag=${tag.id}`}
              className="flex items-center gap-1.5 px-2.5 py-1 rounded text-xs transition-colors hover:brightness-110"
              style={{
                backgroundColor: `${tag.color}20`,
                color: tag.color,
                border: `1px solid ${tag.color}40`,
              }}
            >
              <span
                className="w-2 h-2 rounded-full"
                style={{ backgroundColor: tag.color }}
              />
              {tag.label}
            </Link>
          ))}
        </div>

        {/* Definition */}
        <div className="mb-8">{renderDefinition(term)}</div>

        {/* Media gallery */}
        {term.media && term.media.length > 0 && (
          <div className="mb-8">
            <MediaGallery media={term.media} />
          </div>
        )}

        {/* Related terms (manual links) */}
        {manualLinks.length > 0 && (
          <div className="mb-6 pt-6 border-t border-white/10">
            <h2 className="text-sm font-medium text-white/60 uppercase tracking-wider mb-3">
              Also see
            </h2>
            <div className="flex flex-wrap gap-2">
              {manualLinks.map((linked) => (
                <Link
                  key={linked.id}
                  href={`/term/${linked.id}`}
                  className="px-3 py-1.5 text-sm rounded border border-white/20 text-white/80 hover:border-[#c28f2c] hover:text-[#c28f2c] transition-colors"
                >
                  {linked.term}
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* Back links (terms that reference this one) */}
        {backLinks.length > 0 && (
          <div className="mb-6 pt-6 border-t border-white/10">
            <h2 className="text-sm font-medium text-white/60 uppercase tracking-wider mb-3">
              Referenced by
            </h2>
            <div className="flex flex-wrap gap-2">
              {backLinks.map((bl) => (
                <Link
                  key={bl.id}
                  href={`/term/${bl.id}`}
                  className="px-3 py-1.5 text-sm rounded border border-white/20 text-white/80 hover:border-[#c28f2c] hover:text-[#c28f2c] transition-colors"
                >
                  {bl.term}
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* Prev/Next navigation */}
        <div className="flex items-center justify-between pt-6 border-t border-white/10">
          {prevTerm ? (
            <Link
              href={`/term/${prevTerm.id}`}
              className="flex items-center gap-1.5 text-sm text-white/60 hover:text-[#c28f2c] transition-colors"
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
              className="flex items-center gap-1.5 text-sm text-white/60 hover:text-[#c28f2c] transition-colors"
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
