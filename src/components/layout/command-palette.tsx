'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { Search, BookOpen, Globe, ArrowRight, ExternalLink } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Kbd } from '@/components/ui/kbd';
import { Badge } from '@/components/ui/badge';
import { buildGoogleSearchUrl } from '@/lib/google-search';
import type { SearchableLessonSummary } from '@/lib/content';

interface PagefindModule {
  init: () => Promise<void>;
  search: (query: string) => Promise<{
    results: Array<{
      id: string;
      data: () => Promise<{ url: string; meta?: { title?: string }; excerpt?: string }>;
    }>;
  }>;
}

export interface CommandPaletteProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  lessons?: SearchableLessonSummary[];
}

export function CommandPalette({ open, onOpenChange, lessons: initialLessons }: CommandPaletteProps) {
  const router = useRouter();
  const [lessons, setLessons] = React.useState<SearchableLessonSummary[]>(initialLessons ?? []);
  const [query, setQuery] = React.useState('');
  const [activeIndex, setActiveIndex] = React.useState(0);
  const [pagefindResults, setPagefindResults] = React.useState<
    Array<{ url: string; title: string; excerpt: string }>
  >([]);
  const pagefindRef = React.useRef<PagefindModule | null>(null);

  React.useEffect(() => {
    if (!open || lessons.length > 0) return;
    let active = true;
    fetch('/data/search-index.json')
      .then((res) => (res.ok ? res.json() : []))
      .then((data: SearchableLessonSummary[]) => {
        if (active && Array.isArray(data)) {
          setLessons(data);
        }
      })
      .catch(() => {
        // Offline or unreachable
      });
    return () => {
      active = false;
    };
  }, [open, lessons.length]);

  React.useEffect(() => {
    if (!open || pagefindRef.current) return;
    let active = true;
    async function loadPagefind() {
      try {
        const pfUrl = '/_pagefind/pagefind.js';
        const mod = (await import(/* webpackIgnore: true */ pfUrl)) as PagefindModule;
        await mod.init();
        if (active) pagefindRef.current = mod;
      } catch {
        // Fall back seamlessly to metadata search in dev mode
      }
    }
    void loadPagefind();
    return () => {
      active = false;
    };
  }, [open]);

  React.useEffect(() => {
    let cancelled = false;
    async function runPagefind() {
      const pf = pagefindRef.current;
      if (!pf || !query.trim()) {
        setPagefindResults([]);
        return;
      }
      try {
        const res = await pf.search(query.trim());
        const items = await Promise.all(
          res.results.slice(0, 6).map(async (r) => {
            const d = await r.data();
            return {
              url: d.url,
              title: d.meta?.title ?? d.url,
              excerpt: (d.excerpt ?? '').replace(/<[^>]+>/g, ''),
            };
          })
        );
        if (!cancelled) setPagefindResults(items);
      } catch {
        if (!cancelled) setPagefindResults([]);
      }
    }
    void runPagefind();
    return () => {
      cancelled = true;
    };
  }, [query]);

  const localMatches = React.useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return lessons.slice(0, 8);
    return lessons
      .filter(
        (l) =>
          l.title.toLowerCase().includes(q) ||
          l.summary.toLowerCase().includes(q) ||
          l.moduleTitle.toLowerCase().includes(q) ||
          l.tags.some((t) => t.toLowerCase().includes(q))
      )
      .slice(0, 8);
  }, [lessons, query]);

  const combinedResults = React.useMemo(() => {
    const seen = new Set<string>();
    const items: Array<{ url: string; title: string; subtitle: string; badge?: string; isExternal?: boolean }> = [];

    for (const l of localMatches) {
      if (seen.has(l.url)) continue;
      seen.add(l.url);
      items.push({
        url: l.url,
        title: l.title,
        subtitle: `${l.moduleTitle} · ${l.estimatedMinutes} min`,
        badge: l.level,
      });
    }

    for (const p of pagefindResults) {
      const normalizedUrl = p.url.replace(/\.html$/, '');
      if (seen.has(normalizedUrl)) continue;
      seen.add(normalizedUrl);
      items.push({
        url: normalizedUrl,
        title: p.title,
        subtitle: p.excerpt,
        badge: 'Full-text',
      });
    }

    // Always append Google Web Search action when user types a query
    if (query.trim()) {
      items.push({
        url: buildGoogleSearchUrl(query.trim(), 'web', true),
        title: `Search Google for "${query.trim()}"`,
        subtitle: 'Search ML & AI articles, docs, and research papers on Google',
        badge: 'Google',
        isExternal: true,
      });
    }

    return items;
  }, [localMatches, pagefindResults, query]);

  React.useEffect(() => {
    setActiveIndex(0);
  }, [query, open]);

  const handleSelect = (item: { url: string; isExternal?: boolean }) => {
    onOpenChange(false);
    setQuery('');
    if (item.isExternal) {
      window.open(item.url, '_blank', 'noopener,noreferrer');
    } else {
      router.push(item.url);
    }
  };

  const onInputKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActiveIndex((i) => Math.min(combinedResults.length - 1, i + 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActiveIndex((i) => Math.max(0, i - 1));
    } else if (e.key === 'Enter') {
      const target = combinedResults[activeIndex];
      if (target) {
        e.preventDefault();
        handleSelect(target);
      } else if (query.trim()) {
        e.preventDefault();
        window.open(buildGoogleSearchUrl(query.trim(), 'web', true), '_blank', 'noopener,noreferrer');
        onOpenChange(false);
      }
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="p-0 overflow-hidden max-w-2xl" hideCloseButton>
        <DialogHeader className="sr-only">
          <DialogTitle>Search NeuralPath curriculum &amp; Google</DialogTitle>
        </DialogHeader>
        <div className="flex items-center gap-3 border-b border-hairline px-4 py-3">
          <Search className="h-4 w-4 shrink-0 text-primary-muted" aria-hidden="true" />
          <input
            type="search"
            autoFocus
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={onInputKeyDown}
            placeholder="Search lessons, algorithms, or press Enter to search Google..."
            aria-label="Search lessons and concepts"
            className="w-full bg-transparent text-sm text-primary placeholder:text-primary-muted focus:outline-none"
          />
          <Kbd>Esc</Kbd>
        </div>

        <div className="max-h-[380px] overflow-y-auto p-2">
          {combinedResults.length === 0 ? (
            <div className="py-10 text-center text-sm text-primary-secondary">
              <p>No lessons matched &ldquo;{query}&rdquo;.</p>
              {query && (
                <button
                  type="button"
                  onClick={() => {
                    window.open(buildGoogleSearchUrl(query.trim(), 'web', true), '_blank', 'noopener,noreferrer');
                    onOpenChange(false);
                  }}
                  className="mt-3 inline-flex items-center gap-1.5 font-medium text-accent hover:underline"
                >
                  <Globe className="h-4 w-4" />
                  <span>Search Google for &ldquo;{query}&rdquo; →</span>
                </button>
              )}
            </div>
          ) : (
            <ul role="listbox" aria-label="Search results" className="space-y-1">
              {combinedResults.map((item, idx) => (
                <li
                  key={item.url}
                  role="option"
                  aria-selected={idx === activeIndex}
                  onClick={() => handleSelect(item)}
                >
                  <button
                    type="button"
                    onClick={() => handleSelect(item)}
                    onMouseEnter={() => setActiveIndex(idx)}
                    className={`flex w-full items-center justify-between gap-3 rounded-sm px-3 py-2.5 text-left transition-colors ${
                      idx === activeIndex
                        ? 'bg-subtle text-primary'
                        : 'text-primary-secondary hover:bg-subtle/60'
                    }`}
                  >
                    <div className="flex min-w-0 items-start gap-2.5">
                      {item.isExternal ? (
                        <Globe className="mt-0.5 h-4 w-4 shrink-0 text-accent" aria-hidden="true" />
                      ) : (
                        <BookOpen className="mt-0.5 h-4 w-4 shrink-0 text-accent" aria-hidden="true" />
                      )}
                      <div className="min-w-0">
                        <div className="truncate text-sm font-medium text-primary">{item.title}</div>
                        <div className="truncate text-xs text-primary-muted">{item.subtitle}</div>
                      </div>
                    </div>
                    <div className="flex shrink-0 items-center gap-2">
                      {item.badge && (
                        <Badge variant={item.isExternal ? 'accent' : 'neutral'}>
                          {item.badge}
                        </Badge>
                      )}
                      {item.isExternal ? (
                        <ExternalLink className="h-3.5 w-3.5 text-primary-muted" aria-hidden="true" />
                      ) : (
                        <ArrowRight className="h-3.5 w-3.5 text-primary-muted" aria-hidden="true" />
                      )}
                    </div>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="flex items-center justify-between border-t border-hairline bg-subtle/60 px-4 py-2 text-xs text-primary-muted">
          <span className="flex items-center gap-1.5">
            <Globe className="h-3.5 w-3.5 text-accent" aria-hidden="true" />
            Curriculum + Google Search
          </span>
          <button
            type="button"
            onClick={() => {
              onOpenChange(false);
              router.push(`/search?q=${encodeURIComponent(query)}`);
            }}
            className="font-medium text-accent hover:underline"
          >
            Open search page
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
