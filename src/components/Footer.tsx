import Link from 'next/link';

export default function Footer() {
  return (
    <footer className="bg-paper border-t border-gold-gradient flex-shrink-0">
      <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between text-xs text-ink-3">
        <div className="flex items-center gap-4">
          <Link href="/about" className="hover:text-signal transition-colors">
            About
          </Link>
          <Link href="/credits" className="hover:text-signal transition-colors">
            Credits
          </Link>
          <a
            href="https://steffnstuff.com"
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-signal transition-colors"
          >
            steffnstuff.com
          </a>
        </div>
        <span className="font-display">League Strategic Glossary</span>
      </div>
    </footer>
  );
}
