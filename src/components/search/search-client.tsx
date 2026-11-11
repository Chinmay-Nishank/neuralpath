'use client';

import * as React from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { Search } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import type { ModuleMeta, SearchableLessonSummary } from '@/lib/content';

export function SearchClient({
  lessons,
  modules,
}: {
  lessons: SearchableLessonSummary[];
  modules: ModuleMeta[];
}) {
  const searchParams = useSearchParams();
  const [query, setQuery] = React.useState(() => searchParams.get('q') ?? '');
  const [moduleFilter, setModuleFilter] = React.useState('all');
  const [levelFilter, setLevelFilter] = React.useState('all');

  const results = React.useMemo(() => {
    const q = query.trim().toLowerCase();
    return lessons.filter((l) => {
      if (moduleFilter !== 'all' && l.module !== moduleFilter) return false;
      if (levelFilter !== 'all' && l.level !== levelFilter) return false;
      if (!q) return true;
      return (
        l.title.toLowerCase().includes(q) ||
        l.summary.toLowerCase().includes(q) ||
        l.moduleTitle.toLowerCase().includes(q) ||
        l.tags.some((t) => t.toLowerCase().includes(q))
      );
    });
  }, [lessons, query, moduleFilter, levelFilter]);

  return (
    <div className="mx-auto max-w-[1040px] space-y-6 px-4 py-10 sm:px-6">
      <div className="space-y-2 border-b border-hairline pb-6">
        <h1 className="text-3xl font-bold tracking-tight text-primary">Search Curriculum</h1>
        <p className="text-sm text-primary-secondary">
          Filter all {lessons.length} NeuralPath lessons by keyword, module, or difficulty level.
        </p>
        <div className="grid gap-3 pt-3 sm:grid-cols-[1fr_200px_160px]">
          <div className="relative">
            <Search
              className="pointer-events-none absolute left-3 top-3 h-4 w-4 text-primary-muted"
              aria-hidden="true"
            />
            <Input
              type="search"
              aria-label="Search curriculum lessons"
              placeholder="Search topics (e.g., attention, AdamW, PCA, LoRA)..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="pl-9"
            />
          </div>
          <select
            aria-label="Filter results by module"
            value={moduleFilter}
            onChange={(e) => setModuleFilter(e.target.value)}
            className="h-10 rounded-sm border border-strong bg-surface px-3 text-sm text-primary"
          >
            <option value="all">All Modules</option>
            {modules.map((m) => (
              <option key={m.id} value={m.id}>
                {m.order}. {m.shortTitle}
              </option>
            ))}
          </select>
          <select
            aria-label="Filter results by level"
            value={levelFilter}
            onChange={(e) => setLevelFilter(e.target.value)}
            className="h-10 rounded-sm border border-strong bg-surface px-3 text-sm text-primary"
          >
            <option value="all">All Levels</option>
            <option value="beginner">Beginner</option>
            <option value="practitioner">Practitioner</option>
            <option value="researcher">Researcher</option>
          </select>
        </div>
      </div>

      <div className="text-xs font-mono text-primary-muted">
        Showing {results.length} {results.length === 1 ? 'lesson' : 'lessons'}
      </div>

      {results.length === 0 ? (
        <div className="rounded-md border border-hairline bg-surface p-8 text-center text-sm text-primary-secondary">
          No lessons matched your current filter. Clear your query or switch modules.
        </div>
      ) : (
        <div className="space-y-3">
          {results.map((lesson) => (
            <Link
              key={lesson.routeId}
              href={lesson.url}
              className="block rounded-md border border-hairline bg-surface p-4 transition-colors hover:border-accent"
            >
              <div className="flex flex-wrap items-center justify-between gap-2">
                <h2 className="text-base font-semibold text-primary">{lesson.title}</h2>
                <div className="flex items-center gap-2">
                  <Badge variant="neutral">{lesson.moduleTitle}</Badge>
                  <Badge variant="accent">{lesson.level}</Badge>
                </div>
              </div>
              <p className="mt-1 text-xs leading-relaxed text-primary-secondary">
                {lesson.summary}
              </p>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

