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
    <header className="bg-[#000000] border-b border-gold-gradient shadow-lg flex-shrink-0 relative z-50">
      <div className="max-w-7xl mx-auto px-6 py-4 flex items-center gap-6">
        <Link href="/" className="group relative text-xl font-display text-white hover:text-[#c28f2c] transition-colors">
          League Strategic Glossary
          <span className="absolute -bottom-1 left-0 w-3/4 h-[2px] bg-[#c28f2c]/40 group-hover:bg-[#c28f2c]/70 transition-colors" />
        </Link>

        <nav className="flex items-center gap-5 border-l border-white/20 pl-5">
          {NAV_LINKS.map(({ href, label }) => {
            const isActive = href === '/' ? pathname === '/' : pathname.startsWith(href);
            return (
              <Link
                key={href}
                href={href}
                className={`text-sm tracking-wide pb-0.5 ${
                  isActive
                    ? 'text-[#c28f2c] border-b-2 border-[#c28f2c] font-medium'
                    : 'text-white/70 hover:text-[#c28f2c]'
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
