'use client';

import * as React from 'react';
import { Bookmark, BookmarkCheck, Sparkles, NotebookPen, Type } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useProgress } from '@/components/progress/progress-provider';
import { cn } from '@/lib/utils';

export interface TocHeading {
  title: string;
  url: string;
  items?: TocHeading[];
}

export function TableOfContents({
  toc,
  routeId,
  onOpenTutor,
}: {
  toc: TocHeading[];
  routeId: string;
  onOpenTutor: () => void;
}) {
  const { state, toggleBookmark, saveNote, toggleFontSerif } = useProgress();
  const [activeId, setActiveId] = React.useState<string>('');
  const [notesOpen, setNotesOpen] = React.useState(false);

  const flatIds = React.useMemo(() => {
    const ids: Array<{ id: string; title: string; depth: number }> = [];
    const walk = (nodes: TocHeading[], depth: number) => {
      for (const node of nodes) {
        ids.push({ id: node.url.replace(/^#/, ''), title: node.title, depth });
        if (node.items) walk(node.items, depth + 1);
      }
    };
    walk(toc, 0);
    return ids;
  }, [toc]);

  React.useEffect(() => {
    if (flatIds.length === 0) return;
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            setActiveId(entry.target.id);
          }
        }
      },
      { rootMargin: '-80px 0px -65% 0px', threshold: 0.1 }
    );

    for (const item of flatIds) {
      const el = document.getElementById(item.id);
      if (el) observer.observe(el);
    }

    return () => observer.disconnect();
  }, [flatIds]);

  const bookmarked = state.bookmarks.includes(routeId);
  const noteText = state.notes[routeId] ?? '';

  return (
    <aside className="hidden xl:block">
      <div className="sticky top-20 max-h-[calc(100vh-6rem)] space-y-5 overflow-y-auto pl-2">
        {/* Quick Lesson Tools */}
        <div className="space-y-2 rounded-md border border-hairline bg-surface p-3">
          <Button
            size="sm"
            className="w-full justify-start"
            onClick={onOpenTutor}
          >
            <Sparkles className="h-3.5 w-3.5" aria-hidden="true" />
            <span>Ask AI Tutor</span>
          </Button>
          <div className="grid grid-cols-2 gap-1.5">
            <Button
              size="sm"
              variant="outline"
              onClick={() => toggleBookmark(routeId)}
              aria-pressed={bookmarked}
            >
              {bookmarked ? (
                <BookmarkCheck className="h-3.5 w-3.5 text-accent" aria-hidden="true" />
              ) : (
                <Bookmark className="h-3.5 w-3.5" aria-hidden="true" />
              )}
              <span>{bookmarked ? 'Saved' : 'Save'}</span>
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => setNotesOpen((v) => !v)}
              aria-expanded={notesOpen}
            >
              <NotebookPen className="h-3.5 w-3.5" aria-hidden="true" />
              <span>Notes</span>
            </Button>
          </div>
          <Button
            size="sm"
            variant="ghost"
            onClick={toggleFontSerif}
            className="w-full justify-start text-xs"
          >
            <Type className="h-3.5 w-3.5" aria-hidden="true" />
            <span>Reading face: {state.fontSerif ? 'Serif' : 'Sans'}</span>
          </Button>
        </div>

        {/* Inline Notes Scratchpad */}
        {notesOpen && (
          <div className="space-y-1.5 rounded-md border border-hairline bg-surface p-3">
            <label htmlFor="lesson-notes-textarea" className="text-xs font-semibold text-primary">
              Lesson Notes (auto-saved)
            </label>
            <textarea
              id="lesson-notes-textarea"
              rows={5}
              value={noteText}
              onChange={(e) => saveNote(routeId, e.target.value)}
              placeholder="Write key insights, formulas, or questions..."
              className="w-full rounded-sm border border-strong bg-canvas p-2 text-xs text-primary placeholder:text-primary-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
            />
          </div>
        )}

        {/* On This Page TOC */}
        {flatIds.length > 0 && (
          <nav aria-label="On this page" className="space-y-1.5">
            <div className="text-[11px] font-semibold uppercase tracking-wider text-primary-muted">
              On this page
            </div>
            <ul className="space-y-1 border-l border-hairline text-xs">
              {flatIds.map((item) => (
                <li key={item.id}>
                  <a
                    href={`#${item.id}`}
                    className={cn(
                      'block border-l-2 py-1 transition-colors',
                      item.depth > 0 ? 'pl-5' : 'pl-3',
                      activeId === item.id
                        ? 'border-accent font-medium text-accent'
                        : 'border-transparent text-primary-secondary hover:text-primary'
                    )}
                  >
                    {item.title}
                  </a>
                </li>
              ))}
            </ul>
          </nav>
        )}
      </div>
    </aside>
  );
}

