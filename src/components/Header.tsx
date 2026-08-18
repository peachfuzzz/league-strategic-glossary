'use client'

import React, { useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { conceptViews as glossaryData } from '@/data/vocab';
import { useSearch } from '@/context/SearchContext';
import SearchOverlay from '@/components/SearchOverlay';

const NAV_LINKS = [
  { href: '/', label: 'Glossary' },
  { href: '/about', label: 'About' },
  { href: '/credits', label: 'Credits' },
];

export default function Header() {
  const pathname = usePathname();
  const router = useRouter();
  const { query, setQuery } = useSearch();

  const showSearch = pathname === '/' || pathname.startsWith('/term/');

  const [isOpen, setIsOpen] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return [];
    return glossaryData.filter(term =>
      term.prefLabel.toLowerCase().includes(q) ||
      term.summary.toLowerCase().includes(q) ||
      term.collection.some(tag => tag.toLowerCase().includes(q)) ||
      term.altLabel.some(alt => alt.toLowerCase().includes(q))
    );
  }, [query]);

  useEffect(() => {
    setHighlightedIndex(0);
  }, [query]);

  // Keep the ⌘K shortcut; the badge advertising it is gone.
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        if (!inputRef.current) return;
        e.preventDefault();
        inputRef.current.focus();
        inputRef.current.select();
      }
      if (e.key === 'Escape') {
        setIsOpen(false);
        inputRef.current?.blur();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Click outside closes the dropdown.
  useEffect(() => {
    if (!isOpen) return;
    const handleClick = (e: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    window.addEventListener('mousedown', handleClick);
    return () => window.removeEventListener('mousedown', handleClick);
  }, [isOpen]);

  const handleSelect = () => {
    setIsOpen(false);
    inputRef.current?.blur();
  };

  const handleInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!isOpen || results.length === 0) return;
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setHighlightedIndex(prev => (prev < results.length - 1 ? prev + 1 : 0));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setHighlightedIndex(prev => (prev > 0 ? prev - 1 : results.length - 1));
    } else if (e.key === 'Enter' && results[highlightedIndex]) {
      e.preventDefault();
      const term = results[highlightedIndex];
      handleSelect();
      router.push(`/term/${term.slug}`);
    }
  };

  return (
    <header className="bg-paper border-b border-rule flex-shrink-0 relative z-50">
      <div className="max-w-7xl mx-auto px-6 py-4 flex items-center gap-6 flex-wrap">
        <Link href="/" className="group relative text-xl font-display text-ink hover:text-signal transition-colors shrink-0">
          League Strategic Glossary
          <span className="absolute -bottom-1 left-0 w-3/4 h-[2px] bg-signal/40 group-hover:bg-signal/70 transition-colors" />
        </Link>

        <nav className="flex items-center gap-5 border-l border-rule pl-5 shrink-0">
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

        {showSearch && (
          <div ref={wrapperRef} className="relative flex-1 min-w-[220px] max-w-xl ml-auto">
            <div className="flex items-center bg-paper-2 border border-rule rounded-xs px-3 py-2.5">
              <input
                ref={inputRef}
                type="text"
                value={query}
                onChange={e => {
                  setQuery(e.target.value);
                  setIsOpen(true);
                }}
                onFocus={() => setIsOpen(true)}
                onKeyDown={handleInputKeyDown}
                placeholder="Search terms"
                className="w-full bg-transparent text-ink placeholder-ink-3 outline-none"
              />
            </div>

            {isOpen && query.trim() !== '' && (
              <SearchOverlay
                query={query}
                results={results}
                highlightedIndex={highlightedIndex}
                onHighlight={setHighlightedIndex}
                onSelect={handleSelect}
              />
            )}
          </div>
        )}
      </div>
    </header>
  );
}
