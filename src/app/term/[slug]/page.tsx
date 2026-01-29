import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { glossaryData } from '@/data/glossaryData';
import { getTagConfig } from '@/config/tags.config';
import TermPageContent from '@/components/TermPageContent';

interface TermPageProps {
  params: Promise<{ slug: string }>;
}

export async function generateStaticParams() {
  return glossaryData.map((term) => ({
    slug: term.id,
  }));
}

export async function generateMetadata({ params }: TermPageProps): Promise<Metadata> {
  const { slug } = await params;
  const term = glossaryData.find((t) => t.id === slug);

  if (!term) {
    return { title: 'Term Not Found' };
  }

  // Strip backticks and truncate definition for description
  const cleanDefinition = term.definition.replace(/`([^`]+)`/g, '$1');
  const description =
    cleanDefinition.length > 160
      ? cleanDefinition.substring(0, 157) + '...'
      : cleanDefinition;

  const tagLabels = term.tags
    .map((t) => getTagConfig(t)?.label)
    .filter(Boolean)
    .join(', ');

  return {
    title: `${term.term} - League Strategic Glossary`,
    description,
    openGraph: {
      title: term.term,
      description,
      url: `https://glossary.steffnstuff.com/term/${term.id}`,
      siteName: 'League Strategic Glossary',
      type: 'article',
      tags: tagLabels ? [tagLabels] : undefined,
    },
    twitter: {
      card: 'summary',
      title: term.term,
      description,
    },
  };
}

export default async function TermPage({ params }: TermPageProps) {
  const { slug } = await params;
  const term = glossaryData.find((t) => t.id === slug);

  if (!term) {
    notFound();
  }

  // Resolve manual links
  const manualLinks = term.links
    .map((id) => glossaryData.find((t) => t.id === id))
    .filter((t): t is NonNullable<typeof t> => t !== undefined);

  // Find terms that link back to this term
  const backLinks = glossaryData.filter(
    (t) =>
      t.id !== term.id &&
      (t.links.includes(term.id) || (t.autoLinks || []).includes(term.id))
  );

  // Alphabetical neighbors for prev/next navigation
  const sorted = [...glossaryData].sort((a, b) =>
    a.term.localeCompare(b.term)
  );
  const currentIndex = sorted.findIndex((t) => t.id === term.id);
  const prevTerm = currentIndex > 0 ? sorted[currentIndex - 1] : null;
  const nextTerm =
    currentIndex < sorted.length - 1 ? sorted[currentIndex + 1] : null;

  return (
    <TermPageContent
      term={term}
      manualLinks={manualLinks}
      backLinks={backLinks}
      prevTerm={prevTerm}
      nextTerm={nextTerm}
    />
  );
}
