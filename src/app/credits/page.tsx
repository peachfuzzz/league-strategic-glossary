import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Credits - League Strategic Glossary',
  description: 'Contributors to the League Strategic Glossary.',
};

export default function CreditsPage() {
  return (
    <div className="bg-[#161f32] flex-1">
      <div className="max-w-2xl mx-auto px-6 py-12">
        <h1 className="text-3xl font-display text-white mb-8">Credits</h1>

        <div className="space-y-8">
          <section>
            <h2 className="text-lg font-display text-white mb-4">Contributors</h2>
            <ul className="space-y-3">
              <li className="text-white/80">
                <a
                  href="https://steffnstuff.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[#c28f2c] hover:text-[#d4a03d] transition-colors underline underline-offset-2"
                >
                  steffnstuff
                </a>
                {' '}&mdash; Project creator and maintainer
              </li>
            </ul>
          </section>

          <section className="pt-4 border-t border-white/10">
            <h2 className="text-lg font-display text-white mb-4">Inspiration</h2>
            <p className="text-white/80 leading-relaxed">
              This project draws heavy inspiration from{' '}
              <a
                href="https://glossary.infil.net/"
                target="_blank"
                rel="noopener noreferrer"
                className="text-[#c28f2c] hover:text-[#d4a03d] transition-colors underline underline-offset-2"
              >
                Infil&apos;s Fighting Game Glossary
              </a>
              , a comprehensive reference for fighting game terminology.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
