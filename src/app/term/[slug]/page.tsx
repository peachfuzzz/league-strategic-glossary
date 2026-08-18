import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { vocabIndex } from '@/data/vocab';
import { getConceptBySlug } from '@/data/vocab.server';
import { getTagConfig } from '@/config/tags.config';
import TermPageContent from '@/components/TermPageContent';

interface TermPageProps {
  params: Promise<{ slug: string }>;
}

export async function generateStaticParams() {
  return vocabIndex.map((entry) => ({ slug: entry.slug }));
}

export async function generateMetadata({ params }: TermPageProps): Promise<Metadata> {
  const { slug } = await params;
  const concept = getConceptBySlug(slug);

  if (!concept) {
    return { title: 'Term Not Found' };
  }

  // Strip backticks and truncate definition for description
  const cleanDefinition = concept.definition.replace(/`([^`]+)`/g, '$1');
  const description =
    cleanDefinition.length > 160
      ? cleanDefinition.substring(0, 157) + '...'
      : cleanDefinition;

  const tagLabels = concept.collection
    .map((t) => getTagConfig(t)?.label)
    .filter(Boolean)
    .join(', ');

  return {
    title: `${concept.prefLabel} - League Strategic Glossary`,
    description,
    openGraph: {
      title: concept.prefLabel,
      description,
      url: `https://glossary.steffnstuff.com/term/${concept.slug}`,
      siteName: 'League Strategic Glossary',
      type: 'article',
      tags: tagLabels ? [tagLabels] : undefined,
    },
    twitter: {
      card: 'summary',
      title: concept.prefLabel,
      description,
    },
  };
}

export default async function TermPage({ params }: TermPageProps) {
  const { slug } = await params;
  const concept = getConceptBySlug(slug);

  if (!concept) {
    notFound();
  }

  // Related concepts, resolved via the refs the build already embedded.
  const related = concept.related
    .map((id) => concept.refs[id])
    .filter((r): r is NonNullable<typeof r> => r !== undefined);

  // Alphabetical neighbours across active concepts only.
  const currentIndex = vocabIndex.findIndex((e) => e.id === concept.id);
  const prevEntry = currentIndex > 0 ? vocabIndex[currentIndex - 1] : null;
  const nextEntry =
    currentIndex >= 0 && currentIndex < vocabIndex.length - 1
      ? vocabIndex[currentIndex + 1]
      : null;

  const toRef = (e: typeof prevEntry) =>
    e ? { id: e.id, prefLabel: e.prefLabel, slug: e.slug } : null;

  return (
    <TermPageContent
      concept={concept}
      related={related}
      backLinks={concept.backlinks}
      prevTerm={toRef(prevEntry)}
      nextTerm={toRef(nextEntry)}
    />
  );
}
