'use client';

import * as React from 'react';
import Link from 'next/link';
import { CheckCircle2, Circle, ChevronDown, PanelLeft } from 'lucide-react';
import { useProgress } from '@/components/progress/progress-provider';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export interface SidebarLessonItem {
  routeId: string;
  title: string;
  url: string;
  estimatedMinutes: number;
  level: string;
}

export interface SidebarModuleGroup {
  id: string;
  order: number;
  title: string;
  shortTitle: string;
  lessons: SidebarLessonItem[];
}

export function ModuleSidebar({
  modules,
  currentRouteId,
}: {
  modules: SidebarModuleGroup[];
  currentRouteId: string;
}) {
  const { state } = useProgress();
  const currentModule = modules.find((m) =>
    m.lessons.some((l) => l.routeId === currentRouteId)
  );
  const [openModules, setOpenModules] = React.useState<Set<string>>(
    () => new Set(currentModule ? [currentModule.id] : [modules[0]?.id ?? 'foundations'])
  );
  const [mobileOpen, setMobileOpen] = React.useState(false);

  const toggleModule = (id: string) => {
    setOpenModules((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const renderTree = () => (
    <div className="space-y-1.5">
      {modules.map((mod) => {
        const isOpen = openModules.has(mod.id);
        const completedInMod = mod.lessons.filter(
          (l) => Boolean(state.completedLessons[l.routeId])
        ).length;

        return (
          <div key={mod.id} className="rounded-sm border border-transparent">
            <button
              type="button"
              onClick={() => toggleModule(mod.id)}
              aria-expanded={isOpen}
              className="flex w-full items-center justify-between gap-2 rounded-sm px-2.5 py-2 text-left text-xs font-semibold text-primary hover:bg-subtle"
            >
              <span className="truncate">
                {mod.order}. {mod.shortTitle}
              </span>
              <span className="flex shrink-0 items-center gap-1.5 text-[11px] font-mono text-primary-muted">
                {completedInMod}/{mod.lessons.length}
                <ChevronDown
                  className={cn(
                    'h-3.5 w-3.5 transition-transform duration-150',
                    isOpen && 'rotate-180'
                  )}
                  aria-hidden="true"
                />
              </span>
            </button>

            {isOpen && (
              <ul className="mt-0.5 space-y-0.5 border-l border-hairline pl-2.5 ml-2.5">
                {mod.lessons.map((lesson) => {
                  const isCurrent = lesson.routeId === currentRouteId;
                  const done = Boolean(state.completedLessons[lesson.routeId]);
                  return (
                    <li key={lesson.routeId}>
                      <Link
                        href={lesson.url}
                        prefetch={false}
                        onClick={() => setMobileOpen(false)}
                        aria-current={isCurrent ? 'page' : undefined}
                        className={cn(
                          'flex items-start gap-2 rounded-sm px-2 py-1.5 text-xs transition-colors',
                          isCurrent
                            ? 'bg-accent-soft font-medium text-accent'
                            : 'text-primary-secondary hover:bg-subtle hover:text-primary'
                        )}
                      >
                        {done ? (
                          <CheckCircle2
                            className="mt-0.5 h-3.5 w-3.5 shrink-0 text-success"
                            aria-label="Completed"
                          />
                        ) : (
                          <Circle
                            className="mt-0.5 h-3.5 w-3.5 shrink-0 text-primary-muted"
                            aria-hidden="true"
                          />
                        )}
                        <span className="flex-1 leading-snug">{lesson.title}</span>
                        <span className="shrink-0 text-[10px] tabular-nums text-primary-muted">
                          {lesson.estimatedMinutes}m
                        </span>
                      </Link>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        );
      })}
    </div>
  );

  return (
    <>
      {/* Mobile drawer trigger */}
      <div className="mb-4 lg:hidden">
        <Button
          variant="outline"
          size="sm"
          onClick={() => setMobileOpen((v) => !v)}
          aria-expanded={mobileOpen}
        >
          <PanelLeft className="h-4 w-4" aria-hidden="true" />
          <span>{mobileOpen ? 'Hide Module Tree' : 'Browse Curriculum Modules'}</span>
        </Button>
        {mobileOpen && (
          <nav
            aria-label="Curriculum Modules"
            className="mt-3 max-h-[60vh] overflow-y-auto rounded-md border border-hairline bg-surface p-3 shadow-md"
          >
            {renderTree()}
          </nav>
        )}
      </div>

      {/* Desktop sticky sidebar */}
      <aside className="hidden lg:block">
        <nav
          aria-label="Curriculum Modules"
          className="sticky top-20 max-h-[calc(100vh-6rem)] overflow-y-auto pr-2"
        >
          <div className="mb-2 px-2.5 text-[11px] font-semibold uppercase tracking-wider text-primary-muted">
            Curriculum
          </div>
          {renderTree()}
        </nav>
      </aside>
    </>
  );
}

