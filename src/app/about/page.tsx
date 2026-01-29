import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'About - League Strategic Glossary',
  description: 'About the League Strategic Glossary project.',
};

export default function AboutPage() {
  return (
    <div className="bg-[#161f32] flex-1">
      <div className="max-w-2xl mx-auto px-6 py-12">
        <h1 className="text-3xl font-display text-white mb-8">About</h1>

        <div className="prose prose-invert max-w-none space-y-6 text-white/80 leading-relaxed">
          <p>
            The League Strategic Glossary is a reference tool for League of Legends
            strategic concepts. It aims to formalize the vocabulary that players use
            to discuss the game at a deeper level — from fundamental mechanics to
            high-level macro strategy.
          </p>

          <p>
            The glossary is built around exploration. Rather than presenting a flat
            list of definitions, terms are connected to each other through links and
            shared concepts. The Explore mode lets you start from a single term and
            discover the web of related ideas, while View All gives you the full
            picture at once.
          </p>

          <p>
            Whether you&apos;re a new player trying to decode what your teammates are
            saying, or a serious student of the game looking for a structured
            reference, this glossary is for you.
          </p>

          <p className="text-white/50 text-sm pt-4 border-t border-white/10">
            This project is maintained by{' '}
            <a
              href="https://steffnstuff.com"
              target="_blank"
              rel="noopener noreferrer"
              className="text-[#c28f2c] hover:text-[#d4a03d] transition-colors underline underline-offset-2"
            >
              steffnstuff
            </a>
            .
          </p>
        </div>
      </div>
    </div>
  );
}
