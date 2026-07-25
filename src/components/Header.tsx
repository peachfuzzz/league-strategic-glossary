'use client'

import Link from 'next/link';
import { usePathname } from 'next/navigation';

const NAV_LINKS = [
  { href: '/', label: 'Glossary' },
  { href: '/about', label: 'About' },
  { href: '/credits', label: 'Credits' },
];

export default function Header({ children }: { children?: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <header className="bg-paper border-b border-gold-gradient shadow-lg flex-shrink-0 relative z-50">
      <div className="max-w-7xl mx-auto px-6 py-4 flex items-center gap-6">
        <Link href="/" className="group relative text-xl font-display text-ink hover:text-signal transition-colors">
          League Strategic Glossary
          <span className="absolute -bottom-1 left-0 w-3/4 h-[2px] bg-signal/40 group-hover:bg-signal/70 transition-colors" />
        </Link>

        <nav className="flex items-center gap-5 border-l border-rule pl-5">
          {NAV_LINKS.map(({ href, label }) => {
            const isActive = href === '/' ? pathname === '/' : pathname.startsWith(href);
            return (
              <Link
                key={href}
                href={href}
                className={`text-sm tracking-wide pb-0.5 ${
                  isActive
                    ? 'text-signal border-b-2 border-signal font-medium'
                    : 'text-ink-2 hover:text-signal'
                }`}
              >
                {label}
              </Link>
            );
          })}
        </nav>

        {children && (
          <div className="flex items-center gap-2 ml-auto">
            {children}
          </div>
        )}
      </div>
    </header>
  );
}
