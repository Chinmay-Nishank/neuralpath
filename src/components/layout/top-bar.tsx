'use client';

import * as React from 'react';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useTheme } from 'next-themes';
import { Search, Sun, Moon, Menu, X, Compass } from 'lucide-react';
import { Button, IconButton } from '@/components/ui/button';
import { Kbd } from '@/components/ui/kbd';
import { useProgress } from '@/components/progress/progress-provider';
import type { LearningPathId } from '@/lib/progress';
import { cn } from '@/lib/utils';

const CommandPalette = dynamic(
  () => import('./command-palette').then((m) => m.CommandPalette),
  { ssr: false }
);

const NAV_LINKS = [
  { href: '/curriculum', label: 'Curriculum' },
  { href: '/playgrounds', label: 'Playgrounds' },
  { href: '/glossary', label: 'Glossary' },
  { href: '/cheatsheets', label: 'Cheatsheets' },
  { href: '/dashboard', label: 'Dashboard' },
];

export function TopBar({ totalLessons }: { totalLessons: number }) {
  const pathname = usePathname();
  const { resolvedTheme, setTheme } = useTheme();
  const { state, setActivePath, streakDays } = useProgress();
  const [searchOpen, setSearchOpen] = React.useState(false);
  const [searchMounted, setSearchMounted] = React.useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = React.useState(false);
  const [mounted, setMounted] = React.useState(false);
  const [hiddenOnScroll, setHiddenOnScroll] = React.useState(false);
  const lastScrollY = React.useRef(0);

  const openSearch = React.useCallback(() => {
    setSearchMounted(true);
    setSearchOpen(true);
  }, []);

  React.useEffect(() => {
    setMounted(true);
    const onKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setSearchMounted(true);
        setSearchOpen((prev) => !prev);
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, []);

  React.useEffect(() => {
    const onScroll = () => {
      const y = window.scrollY;
      if (y > 96 && y > lastScrollY.current + 8) {
        setHiddenOnScroll(true);
      } else if (y < lastScrollY.current - 6 || y <= 48) {
        setHiddenOnScroll(false);
      }
      lastScrollY.current = y;
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const completedCount = Object.keys(state.completedLessons).length;

  return (
    <>
      <header
        className={cn(
          'sticky top-0 z-40 border-b border-hairline bg-canvas/95 backdrop-blur transition-transform duration-200 ease-neural',
          hiddenOnScroll && '-translate-y-full'
        )}
      >
        <div className="mx-auto flex h-14 max-w-[1440px] items-center justify-between gap-3 px-4 sm:px-6">
          {/* Logo & Primary Nav */}
          <div className="flex items-center gap-6">
            <Link
              href="/"
              className="flex items-center gap-2 font-semibold tracking-tight text-primary"
            >
              <svg width="24" height="24" viewBox="0 0 64 64" fill="none" aria-hidden="true">
                <rect width="64" height="64" rx="14" fill="var(--accent)" />
                <circle cx="18" cy="20" r="4.5" fill="#FFFFFF" />
                <circle cx="18" cy="44" r="4.5" fill="#FFFFFF" />
                <circle cx="34" cy="14" r="4.5" fill="#BFDBFE" />
                <circle cx="34" cy="32" r="4.5" fill="#FFFFFF" />
                <circle cx="34" cy="50" r="4.5" fill="#BFDBFE" />
                <circle cx="48" cy="32" r="5" fill="#FBBF24" />
                <path
                  d="M22 21L30 15M22 22L30 31M22 43L30 33M22 45L30 49M38 16L44 29M38 32H43M38 48L44 35"
                  stroke="#E0F2FE"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                />
              </svg>
              <span className="text-base">NeuralPath</span>
            </Link>

            <nav aria-label="Main Navigation" className="hidden items-center gap-1 lg:flex">
              {NAV_LINKS.map((link) => {
                const active = pathname === link.href || pathname.startsWith(`${link.href}/`);
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    className={cn(
                      'rounded-sm px-2.5 py-1.5 text-sm transition-colors',
                      active
                        ? 'bg-subtle font-medium text-primary'
                        : 'text-primary-secondary hover:bg-subtle/60 hover:text-primary'
                    )}
                  >
                    {link.label}
                  </Link>
                );
              })}
            </nav>
          </div>

          {/* Right Utilities */}
          <div className="flex items-center gap-2">
            {/* Search button */}
            <Button
              variant="outline"
              size="sm"
              onClick={openSearch}
              aria-label="Search curriculum"
              className="hidden sm:inline-flex gap-2 text-primary-secondary"
            >
              <Search className="h-3.5 w-3.5" aria-hidden="true" />
              <span className="text-xs">Search</span>
              <Kbd>Ctrl+K</Kbd>
            </Button>
            <IconButton
              variant="ghost"
              size="icon-sm"
              label="Search curriculum"
              onClick={openSearch}
              className="sm:hidden"
            >
              <Search className="h-4 w-4" aria-hidden="true" />
            </IconButton>

            {/* Path switcher */}
            <div className="hidden items-center gap-1 lg:flex">
              <Compass className="h-3.5 w-3.5 text-primary-muted" aria-hidden="true" />
              <select
                aria-label="Active learning path"
                value={state.activePath}
                onChange={(e) => setActivePath(e.target.value as LearningPathId)}
                className="h-8 rounded-sm border border-hairline bg-surface px-2 text-xs font-medium text-primary"
              >
                <option value="beginner">Beginner Path</option>
                <option value="practitioner">Practitioner Path</option>
                <option value="researcher">Researcher Path</option>
              </select>
            </div>

            {/* Quiet progress indicator */}
            <Link
              href="/dashboard"
              className="hidden items-center gap-1.5 rounded-full border border-hairline bg-surface px-2.5 py-1 text-xs font-medium tabular-nums text-primary-secondary hover:border-strong hover:text-primary xl:inline-flex"
              title="Completed lessons and active streak"
            >
              <span>{completedCount}/{totalLessons}</span>
              {streakDays > 0 && <span className="text-accent">· {streakDays}d</span>}
            </Link>

            {/* Theme toggle */}
            <IconButton
              variant="ghost"
              size="icon-sm"
              label="Toggle color theme"
              onClick={() => setTheme(resolvedTheme === 'dark' ? 'light' : 'dark')}
            >
              {mounted && resolvedTheme === 'dark' ? (
                <Sun className="h-4 w-4" aria-hidden="true" />
              ) : (
                <Moon className="h-4 w-4" aria-hidden="true" />
              )}
            </IconButton>

            {/* Mobile/tablet menu toggle */}
            <IconButton
              variant="ghost"
              size="icon-sm"
              label={mobileMenuOpen ? 'Close navigation menu' : 'Open navigation menu'}
              onClick={() => setMobileMenuOpen((v) => !v)}
              className="lg:hidden"
            >
              {mobileMenuOpen ? (
                <X className="h-4 w-4" aria-hidden="true" />
              ) : (
                <Menu className="h-4 w-4" aria-hidden="true" />
              )}
            </IconButton>
          </div>
        </div>

        {/* Mobile/tablet navigation drawer */}
        {mobileMenuOpen && (
          <nav
            aria-label="Mobile Navigation"
            className="border-t border-hairline bg-surface px-4 py-3 lg:hidden"
          >
            <div className="flex flex-col gap-1">
              {NAV_LINKS.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className="rounded-sm px-3 py-2 text-sm font-medium text-primary hover:bg-subtle"
                >
                  {link.label}
                </Link>
              ))}
              <div className="mt-2 border-t border-hairline pt-2">
                <label className="mb-1 block text-xs text-primary-muted" htmlFor="mobile-path-select">
                  Learning Path
                </label>
                <select
                  id="mobile-path-select"
                  value={state.activePath}
                  onChange={(e) => setActivePath(e.target.value as LearningPathId)}
                  className="h-9 w-full rounded-sm border border-strong bg-canvas px-2 text-xs text-primary"
                >
                  <option value="beginner">Beginner Path</option>
                  <option value="practitioner">Practitioner Path</option>
                  <option value="researcher">Researcher Path</option>
                </select>
              </div>
            </div>
          </nav>
        )}
      </header>

      {searchMounted && (
        <CommandPalette open={searchOpen} onOpenChange={setSearchOpen} />
      )}
    </>
  );
}

