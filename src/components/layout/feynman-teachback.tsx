'use client';

import * as React from 'react';
import { MessageSquareQuote, Globe, ChevronDown, ChevronUp } from 'lucide-react';
import { buttonVariants } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { buildGoogleSearchUrl } from '@/lib/google-search';
import { cn } from '@/lib/utils';

const FEYNMAN_STORAGE_KEY = 'neuralpath.feynman.v1';

function loadDraft(routeId: string): string {
  if (typeof window === 'undefined') return '';
  try {
    const raw = window.localStorage.getItem(FEYNMAN_STORAGE_KEY);
    if (!raw) return '';
    const map = JSON.parse(raw) as Record<string, string>;
    return typeof map[routeId] === 'string' ? map[routeId] : '';
  } catch {
    return '';
  }
}

function saveDraft(routeId: string, text: string) {
  if (typeof window === 'undefined') return;
  try {
    const raw = window.localStorage.getItem(FEYNMAN_STORAGE_KEY);
    const map = raw ? (JSON.parse(raw) as Record<string, string>) : {};
    map[routeId] = text;
    window.localStorage.setItem(FEYNMAN_STORAGE_KEY, JSON.stringify(map));
  } catch {
    // Ignore storage limit errors cleanly
  }
}

export function FeynmanTeachBack({
  routeId,
  objectives,
}: {
  routeId: string;
  objectives: string[];
}) {
  const [open, setOpen] = React.useState(false);
  const [selectedIdx, setSelectedIdx] = React.useState(0);
  const [draft, setDraft] = React.useState('');

  React.useEffect(() => {
    setDraft(loadDraft(routeId));
  }, [routeId]);

  const targetObjective = objectives[selectedIdx] ?? objectives[0] ?? 'the core lesson mechanism';

  const handleDraftChange = (value: string) => {
    setDraft(value);
    saveDraft(routeId, value);
  };

  return (
    <section
      aria-label="Feynman Teach-Back Practice"
      className="my-6 rounded-md border border-hairline bg-surface"
    >
      <button
        type="button"
        aria-expanded={open}
        onClick={() => setOpen((prev) => !prev)}
        className="flex min-h-[48px] w-full items-center justify-between gap-3 px-4 py-3 text-left transition-colors hover:bg-subtle/60"
      >
        <div className="flex flex-wrap items-center gap-2">
          <MessageSquareQuote className="h-4 w-4 text-accent" aria-hidden="true" />
          <span className="text-sm font-semibold text-primary">
            Feynman Technique: Teach It Back in Plain English
          </span>
          {draft.trim().length > 20 && <Badge variant="success">Draft saved</Badge>}
        </div>
        {open ? (
          <ChevronUp className="h-4 w-4 text-primary-secondary" aria-hidden="true" />
        ) : (
          <ChevronDown className="h-4 w-4 text-primary-secondary" aria-hidden="true" />
        )}
      </button>

      {open && (
        <div className="space-y-4 border-t border-hairline px-4 py-4">
          <p className="text-xs leading-relaxed text-primary-secondary">
            Writing a concept without jargon immediately exposes hidden gaps in understanding. Pick
            an objective below and explain it as if teaching a fellow engineer for the first time.
          </p>

          {objectives.length > 1 && (
            <div className="flex flex-wrap gap-1.5" role="group" aria-label="Choose objective to explain">
              {objectives.map((obj, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => setSelectedIdx(idx)}
                  className={`min-h-[36px] rounded-sm border px-2.5 py-1 text-left text-xs transition-colors ${
                    selectedIdx === idx
                      ? 'border-accent bg-accent-soft font-medium text-accent'
                      : 'border-hairline bg-canvas text-primary-secondary hover:border-strong hover:text-primary'
                  }`}
                >
                  {idx + 1}. {obj}
                </button>
              ))}
            </div>
          )}

          <div className="rounded-sm border border-hairline bg-canvas p-3 text-xs text-primary">
            <span className="font-semibold text-accent">Prompt: </span>
            Explain &ldquo;{targetObjective}&rdquo; without copying formulas verbatim.
          </div>

          <div>
            <label htmlFor={`feynman-${routeId}`} className="sr-only">
              Plain-English explanation draft
            </label>
            <textarea
              id={`feynman-${routeId}`}
              rows={4}
              value={draft}
              onChange={(e) => handleDraftChange(e.target.value)}
              placeholder="Write 2–4 simple sentences explaining why this works and when it breaks..."
              className="w-full rounded-sm border border-strong bg-canvas p-3 text-sm text-primary placeholder:text-primary-secondary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
            />
          </div>

          <div className="flex flex-wrap items-center justify-between gap-2">
            <span className="text-[11px] text-primary-secondary">
              Auto-saved locally per lesson · {draft.trim().split(/\s+/).filter(Boolean).length} words
            </span>
            <a
              href={buildGoogleSearchUrl(targetObjective, 'web', true)}
              target="_blank"
              rel="noopener noreferrer"
              className={cn(buttonVariants({ variant: 'primary', size: 'md' }), 'min-h-[44px]')}
            >
              <Globe className="h-4 w-4" aria-hidden="true" />
              <span>Search Google for Deep Dive</span>
            </a>
          </div>
        </div>
      )}
    </section>
  );
}
