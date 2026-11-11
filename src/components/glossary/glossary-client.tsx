'use client';

import * as React from 'react';
import Link from 'next/link';
import { BookMarked, Search } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Math } from '@/components/mdx/math';
import type { GlossaryEntry } from '@/lib/content';

export function GlossaryClient({ entries }: { entries: GlossaryEntry[] }) {
  const [query, setQuery] = React.useState('');

  const filtered = React.useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return entries;
    return entries.filter(
      (e) =>
        e.term.toLowerCase().includes(q) ||
        e.definition.toLowerCase().includes(q) ||
        e.aliases?.some((a) => a.toLowerCase().includes(q))
    );
  }, [entries, query]);

  return (
    <div className="mx-auto max-w-[1120px] space-y-8 px-4 py-10 sm:px-6">
      <div className="flex flex-wrap items-end justify-between gap-4 border-b border-hairline pb-6">
        <div className="space-y-1.5">
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-accent">
            <BookMarked className="h-4 w-4" aria-hidden="true" />
            ML &amp; AI Terminology
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-primary">Curriculum Glossary</h1>
          <p className="text-sm text-primary-secondary">
            Concise definitions and formulas for {entries.length} foundational and frontier terms.
          </p>
        </div>

        <div className="w-full sm:w-80">
          <div className="relative">
            <Search
              className="pointer-events-none absolute left-3 top-3 h-4 w-4 text-primary-muted"
              aria-hidden="true"
            />
            <Input
              type="search"
              aria-label="Filter glossary terms"
              placeholder="Filter terms (e.g. LoRA, RoPE, SHAP)..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="pl-9"
            />
          </div>
        </div>
      </div>

      {filtered.length === 0 ? (
        <p className="text-sm text-primary-secondary">No glossary terms matched &ldquo;{query}&rdquo;.</p>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {filtered.map((entry) => (
            <article
              key={entry.term}
              className="flex flex-col justify-between rounded-md border border-hairline bg-surface p-5"
            >
              <div className="space-y-2">
                <div className="flex flex-wrap items-baseline justify-between gap-2">
                  <h2 className="text-base font-semibold text-primary">{entry.term}</h2>
                  {entry.aliases && entry.aliases.length > 0 && (
                    <span className="font-mono text-[11px] text-primary-muted">
                      {entry.aliases.slice(0, 2).join(', ')}
                    </span>
                  )}
                </div>
                <p className="text-xs leading-relaxed text-primary-secondary">
                  {entry.definition}
                </p>
                {entry.formula && (
                  <div className="rounded-sm bg-subtle px-3 py-2 text-xs">
                    <Math tex={entry.formula} />
                  </div>
                )}
              </div>
              <div className="mt-4 border-t border-hairline pt-2.5">
                <Link
                  href={entry.lessonUrl}
                  className="text-xs font-medium text-accent hover:underline"
                >
                  Learn in full lesson →
                </Link>
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}

