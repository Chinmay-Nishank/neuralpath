'use client';

import * as React from 'react';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import { BookMarked, ArrowUpRight } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';

const LazyMath = dynamic(() => import('@/components/mdx/math').then((m) => m.Math), {
  ssr: false,
});

export interface GlossaryItem {
  term: string;
  aliases?: string[];
  definition: string;
  formula?: string;
  lessonUrl: string;
}

const GlossaryContext = React.createContext<GlossaryItem[]>([]);

export function GlossaryProvider({
  entries,
  children,
}: {
  entries: GlossaryItem[];
  children: React.ReactNode;
}) {
  return <GlossaryContext.Provider value={entries}>{children}</GlossaryContext.Provider>;
}

export function useGlossaryLookup(term: string): GlossaryItem | undefined {
  const entries = React.useContext(GlossaryContext);
  const lower = term.trim().toLowerCase();
  return React.useMemo(
    () =>
      entries.find(
        (item) =>
          item.term.toLowerCase() === lower ||
          item.aliases?.some((alias) => alias.toLowerCase() === lower)
      ),
    [entries, lower]
  );
}

export function GlossaryTerm({
  term,
  children,
}: {
  term: string;
  children?: React.ReactNode;
}) {
  const entry = useGlossaryLookup(term);
  const [open, setOpen] = React.useState(false);

  if (!entry) {
    return <span className="font-medium text-primary">{children ?? term}</span>;
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          onMouseEnter={() => setOpen(true)}
          onMouseLeave={() => setOpen(false)}
          className="inline cursor-help border-b border-dashed border-accent/70 font-medium text-primary transition-colors hover:text-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
        >
          {children ?? term}
        </button>
      </PopoverTrigger>
      <PopoverContent
        onMouseEnter={() => setOpen(true)}
        onMouseLeave={() => setOpen(false)}
        className="w-80 space-y-2.5 p-4"
      >
        <div className="flex items-center justify-between gap-2">
          <span className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-accent">
            <BookMarked className="h-3.5 w-3.5" aria-hidden="true" />
            {entry.term}
          </span>
        </div>
        <p className="text-xs leading-relaxed text-primary-secondary">{entry.definition}</p>
        {entry.formula && open && (
          <div className="rounded bg-subtle px-2.5 py-1.5 text-center text-xs">
            <LazyMath tex={entry.formula} />
          </div>
        )}
        <Link
          href={entry.lessonUrl}
          className="inline-flex items-center gap-1 text-xs font-medium text-accent hover:underline"
        >
          Read full lesson
          <ArrowUpRight className="h-3 w-3" aria-hidden="true" />
        </Link>
      </PopoverContent>
    </Popover>
  );
}

