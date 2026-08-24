import { Fragment } from 'react';
import Link from 'next/link';
import ReactMarkdown from 'react-markdown';
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

/** Shared so inline prose links and the trailing lists cannot drift apart. */
const LINK_CLASS =
  'text-signal decoration-signal/40 hover:text-signal-2 underline decoration-1 underline-offset-2 transition-colors';

/**
 * What a definition may contain. An entry is a paragraph of prose, sometimes
 * with a list - never a heading, image, table, or blockquote. Anything outside
 * this list is dropped from the tree along with its children rather than
 * rendered, so a stray `##` in a note cannot put an h1 inside an entry.
 *
 * This must be `allowedElements`, not a `components` override returning null:
 * a component override still parses the node and can surface its children.
 */
const ALLOWED_ELEMENTS = ['p', 'ul', 'ol', 'li', 'em', 'strong', 'a', 'code'];

/**
 * Definition prose, rendered as Markdown.
 *
 * `definition` arrives already resolved - the build rewrote every wikilink
 * into a Markdown link - so this only has to render and style it.
 */
function renderDefinition(concept: Concept) {
  return (
    <div className="text-ink-2 text-[1.0625rem] leading-[1.65] max-w-(--measure) space-y-4">
      <ReactMarkdown
        allowedElements={ALLOWED_ELEMENTS}
        components={{
          a: ({ href, children }) => {
            const target = href ?? '';
            return target.startsWith('/') ? (
              <Link href={target} className={LINK_CLASS}>
                {children}
              </Link>
            ) : (
              <a
                href={target}
                rel="noopener noreferrer"
                target="_blank"
                className={LINK_CLASS}
              >
                {children}
              </a>
            );
          },
          ul: ({ children }) => (
            <ul className="list-disc pl-5 space-y-1.5">{children}</ul>
          ),
          ol: ({ children }) => (
            <ol className="list-decimal pl-5 space-y-1.5">{children}</ol>
          ),
        }}
      >
        {concept.definition}
      </ReactMarkdown>
    </div>
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
          <Link href={`/term/${linked.slug}`} className={LINK_CLASS}>
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
