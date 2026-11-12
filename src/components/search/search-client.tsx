'use client';

import * as React from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { Search, Globe, ExternalLink, ArrowRight } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { buttonVariants } from '@/components/ui/button';
import {
  GOOGLE_SEARCH_SCOPES,
  buildGoogleSearchUrl,
  type GoogleSearchScope,
} from '@/lib/google-search';
import type { ModuleMeta, SearchableLessonSummary } from '@/lib/content';
import { cn } from '@/lib/utils';

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
  const [googleScope, setGoogleScope] = React.useState<GoogleSearchScope>('web');

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

  const googleUrl = React.useMemo(() => {
    return buildGoogleSearchUrl(query || 'machine learning transformers', googleScope, true);
  }, [query, googleScope]);

  return (
    <div className="mx-auto max-w-[1040px] space-y-6 px-4 py-10 sm:px-6">
      <div className="space-y-4 border-b border-hairline pb-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-primary">Search NeuralPath</h1>
          <p className="mt-1 text-sm text-primary-secondary">
            Search our {lessons.length} core curriculum lessons or seamlessly search across the broader ML &amp; AI web with Google.
          </p>
        </div>

        <div className="grid gap-3 pt-1 sm:grid-cols-[1fr_200px_160px]">
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

        {/* Google Web Search Companion Banner */}
        <div className="rounded-md border border-hairline bg-surface p-4 shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <Globe className="h-4 w-4 text-accent" aria-hidden="true" />
                <span className="text-xs font-semibold uppercase tracking-wider text-primary">
                  Google Web Search
                </span>
                <Badge variant="accent">Web</Badge>
              </div>
              <p className="text-xs text-primary-secondary">
                Need research papers, documentation, or code? Launch an targeted Google search for &ldquo;{query || 'machine learning'}&rdquo;.
              </p>
            </div>

            <a
              href={googleUrl}
              target="_blank"
              rel="noopener noreferrer"
              className={cn(buttonVariants({ variant: 'primary', size: 'sm' }), 'min-h-[36px]')}
            >
              <span>Search on Google</span>
              <ExternalLink className="h-3.5 w-3.5" aria-hidden="true" />
            </a>
          </div>

          <div className="mt-3 flex flex-wrap items-center gap-1.5 border-t border-hairline pt-3 text-xs">
            <span className="font-medium text-primary-secondary">Target:</span>
            {GOOGLE_SEARCH_SCOPES.map((scope) => (
              <button
                key={scope.id}
                type="button"
                onClick={() => setGoogleScope(scope.id)}
                className={cn(
                  'min-h-[28px] rounded-sm px-2.5 py-1 text-xs transition-colors',
                  googleScope === scope.id
                    ? 'bg-accent text-accent-foreground font-medium'
                    : 'bg-subtle text-primary-secondary hover:bg-hairline hover:text-primary'
                )}
              >
                {scope.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between text-xs font-mono text-primary-muted">
        <span>
          Showing {results.length} curriculum {results.length === 1 ? 'lesson' : 'lessons'}
        </span>
        {query && (
          <a
            href={googleUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1 font-sans text-accent hover:underline"
          >
            <span>Search &ldquo;{query}&rdquo; on Google</span>
            <ExternalLink className="h-3 w-3" aria-hidden="true" />
          </a>
        )}
      </div>

      {results.length === 0 ? (
        <div className="space-y-4 rounded-md border border-hairline bg-surface p-8 text-center text-sm text-primary-secondary">
          <p>No internal lessons matched &ldquo;{query}&rdquo; under this filter.</p>
          <div className="flex justify-center">
            <a
              href={googleUrl}
              target="_blank"
              rel="noopener noreferrer"
              className={cn(buttonVariants({ variant: 'primary', size: 'md' }), 'min-h-[44px]')}
            >
              <Globe className="h-4 w-4" aria-hidden="true" />
              <span>Search Google for &ldquo;{query}&rdquo;</span>
              <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </a>
          </div>
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
