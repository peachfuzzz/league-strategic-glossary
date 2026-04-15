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
            League of Legends demands much from players. The core MOBA design that makes League fun and engaging for thousands of hours also contributes to its incredible difficulty. At the same time, League of Legends' players demand much from each other. Over 16 years, League players have discovered, implemented, and refined many concepts that exist separately from the game. As such, the table stakes for League only continue to increase, both in its gameplay and its surrounding discussion.
          </p>
          <p>
            The League Strategic Glossary attempts to formalize the ideas around League of Legends and present them in an intuitive, digestible manner. Part reference source and part learning tool, the Glossary emphasizes the connection between ideas, automatically linking together related terms in an interactive graph visualization. Exploration is one of its main features. The graph can be traversed by selecting linked terms in the definitions, letting the reader explore one related idea at a time.
          </p>          
          <p>
            All terms and definitions are written and edited by hand. League's jargon may be widespread, but reliable definitions, particularly of more abstract concepts, tend to be elusive. The glossary takes a descriptive approach to definition, with the goal of mirroring popular usage as closely as possible. 
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
