'use client';

import * as React from 'react';
import Link from 'next/link';
import { ArrowRight, Brain, CheckCircle2, Lock, Unlock, ZoomIn, ZoomOut, RotateCcw } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button, buttonVariants } from '@/components/ui/button';
import { useProgress } from '@/components/progress/progress-provider';
import { useReview } from '@/components/review/review-provider';
import type { ModuleMeta } from '@/lib/content';
import { cn } from '@/lib/utils';
import { PathwaySelector } from './pathway-selector';
import { getPathwayById } from '@/lib/pathways';

export interface GraphLessonNode {
  routeId: string;
  title: string;
  module: string;
  moduleOrder: number;
  order: number;
  level: 'beginner' | 'practitioner' | 'researcher';
  paths: Array<'beginner' | 'practitioner' | 'researcher'>;
  estimatedMinutes: number;
  prerequisites: string[];
  summary: string;
  url: string;
}

export function CurriculumMap({
  modules,
  lessons,
}: {
  modules: ModuleMeta[];
  lessons: GraphLessonNode[];
}) {
  const { state, hydrated } = useProgress();
  const { hydrated: reviewHydrated, dueCount, dueByLesson } = useReview();
  const [selectedPathwayId, setSelectedPathwayId] = React.useState<string>('all');
  const [levelFilter, setLevelFilter] = React.useState<'all' | 'beginner' | 'practitioner' | 'researcher'>('all');
  const [moduleFilter, setModuleFilter] = React.useState<string>('all');
  const [zoom, setZoom] = React.useState(1);

  const activePathway = React.useMemo(() => {
    return selectedPathwayId !== 'all' ? getPathwayById(selectedPathwayId) : undefined;
  }, [selectedPathwayId]);

  const resumeLesson = React.useMemo(() => {
    if (state.lastVisitedLesson) {
      const visited = lessons.find((l) => l.routeId === state.lastVisitedLesson);
      if (visited) return visited;
    }
    return lessons.find((l) => !state.completedLessons[l.routeId]) ?? lessons[0];
  }, [lessons, state.lastVisitedLesson, state.completedLessons]);

  const filteredLessons = React.useMemo(() => {
    return lessons.filter((l) => {
      if (activePathway && !activePathway.modules.includes(l.module)) return false;
      if (levelFilter !== 'all' && l.level !== levelFilter) return false;
      if (moduleFilter !== 'all' && l.module !== moduleFilter) return false;
      return true;
    });
  }, [lessons, activePathway, levelFilter, moduleFilter]);

  const getStatus = (lesson: GraphLessonNode): 'completed' | 'available' | 'locked' => {
    if (state.completedLessons[lesson.routeId]) return 'completed';
    const allPrereqsDone = lesson.prerequisites.every((p) => Boolean(state.completedLessons[p]));
    return lesson.prerequisites.length === 0 || allPrereqsDone ? 'available' : 'locked';
  };

  // Compute coordinates for SVG prerequisite graph (10 module columns)
  const nodePositions = React.useMemo(() => {
    const map = new Map<string, { x: number; y: number; lesson: GraphLessonNode }>();
    const byMod = new Map<number, GraphLessonNode[]>();
    for (const l of lessons) {
      const list = byMod.get(l.moduleOrder) ?? [];
      list.push(l);
      byMod.set(l.moduleOrder, list);
    }
    for (const [mOrder, list] of byMod.entries()) {
      list.forEach((l, idx) => {
        map.set(l.routeId, {
          x: 70 + (mOrder - 1) * 165,
          y: 48 + idx * 66,
          lesson: l,
        });
      });
    }
    return map;
  }, [lessons]);

  return (
    <div className="space-y-8">
      {resumeLesson && (
        <section
          aria-label="Continue learning"
          className="flex flex-wrap items-center justify-between gap-4 rounded-md border border-hairline bg-surface p-4 shadow-sm sm:p-5"
        >
          <div className="space-y-1">
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="accent">Continue Learning</Badge>
              {hydrated && reviewHydrated && dueCount > 0 && (
                <Link
                  href="/review"
                  className="inline-flex items-center gap-1 rounded-full bg-accent-soft px-2.5 py-0.5 text-xs font-medium text-accent hover:underline"
                >
                  <Brain className="h-3 w-3" aria-hidden="true" />
                  <span>
                    {dueCount} {dueCount === 1 ? 'card' : 'cards'} due
                  </span>
                </Link>
              )}
            </div>
            <h2 className="text-base font-semibold text-primary sm:text-lg">
              {resumeLesson.title}
            </h2>
            <p className="text-xs text-primary-secondary">{resumeLesson.summary}</p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {hydrated && reviewHydrated && dueCount > 0 && (
              <Link
                href="/review"
                className={cn(buttonVariants({ variant: 'outline', size: 'md' }), 'min-h-[44px]')}
              >
                <Brain className="h-4 w-4 text-accent" aria-hidden="true" />
                <span>Review ({dueCount})</span>
              </Link>
            )}
            <Link
              href={resumeLesson.url}
              className={cn(buttonVariants({ variant: 'primary', size: 'md' }), 'min-h-[44px]')}
            >
              <span>Resume Lesson</span>
              <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </Link>
          </div>
        </section>
      )}

      {/* Interactive Pathway Selector */}
      <PathwaySelector
        selectedPathwayId={selectedPathwayId}
        onSelectPathway={setSelectedPathwayId}
        lessons={lessons}
      />

      <div className="flex flex-wrap items-center justify-end gap-2">
          <select
            aria-label="Filter by difficulty level"
            value={levelFilter}
            onChange={(e) => setLevelFilter(e.target.value as typeof levelFilter)}
            className="h-9 rounded-sm border border-strong bg-surface px-3 text-xs text-primary"
          >
            <option value="all">All Levels</option>
            <option value="beginner">Beginner</option>
            <option value="practitioner">Practitioner</option>
            <option value="researcher">Researcher</option>
          </select>

          <select
            aria-label="Filter by module"
            value={moduleFilter}
            onChange={(e) => setModuleFilter(e.target.value)}
            className="h-9 rounded-sm border border-strong bg-surface px-3 text-xs text-primary"
          >
            <option value="all">All 10 Modules</option>
            {modules.map((m) => (
              <option key={m.id} value={m.id}>
                {m.order}. {m.title}
              </option>
            ))}
          </select>
        </div>

      {/* Zoomable Prerequisite Graph */}
      <section aria-label="Interactive Prerequisite Graph" className="rounded-md border border-hairline bg-surface shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-hairline bg-subtle/60 px-4 py-2.5">
          <div className="flex items-center gap-3 text-xs text-primary-secondary">
            <span className="font-semibold text-primary">Prerequisite Graph</span>
            <span className="flex items-center gap-1"><CheckCircle2 className="h-3.5 w-3.5 text-success" /> Completed</span>
            <span className="flex items-center gap-1"><Unlock className="h-3.5 w-3.5 text-accent" /> Available</span>
            <span className="flex items-center gap-1"><Lock className="h-3.5 w-3.5 text-primary-muted" /> Prereqs pending</span>
          </div>
          <div className="flex items-center gap-1">
            <Button size="sm" variant="outline" onClick={() => setZoom((z) => Math.max(0.6, Number((z - 0.15).toFixed(2))))} aria-label="Zoom out graph">
              <ZoomOut className="h-3.5 w-3.5" aria-hidden="true" />
            </Button>
            <span className="w-12 text-center text-xs tabular-nums">{Math.round(zoom * 100)}%</span>
            <Button size="sm" variant="outline" onClick={() => setZoom((z) => Math.min(1.4, Number((z + 0.15).toFixed(2))))} aria-label="Zoom in graph">
              <ZoomIn className="h-3.5 w-3.5" aria-hidden="true" />
            </Button>
            <Button size="sm" variant="ghost" onClick={() => setZoom(1)} aria-label="Reset graph zoom">
              <RotateCcw className="h-3.5 w-3.5" aria-hidden="true" />
            </Button>
          </div>
        </div>

        <div className="max-h-[460px] overflow-auto bg-canvas p-4">
          <svg
            width={Math.round(1700 * zoom)}
            height={Math.round(700 * zoom)}
            viewBox="0 0 1700 700"
            aria-label="Lesson prerequisite dependency graph across 10 modules"
          >
            {/* Module Column Headers */}
            {modules.map((m) => (
              <text
                key={m.id}
                x={70 + (m.order - 1) * 165}
                y={20}
                textAnchor="middle"
                className="fill-primary-secondary text-[11px] font-semibold"
              >
                {m.order}. {m.shortTitle}
              </text>
            ))}

            {/* Dependency Edges */}
            {lessons.map((l) =>
              l.prerequisites.map((preId) => {
                const from = nodePositions.get(preId);
                const to = nodePositions.get(l.routeId);
                if (!from || !to) return null;
                return (
                  <path
                    key={`${preId}->${l.routeId}`}
                    d={`M ${from.x + 64} ${from.y} C ${from.x + 95} ${from.y}, ${to.x - 95} ${to.y}, ${to.x - 64} ${to.y}`}
                    fill="none"
                    stroke="var(--border-strong)"
                    strokeWidth="1.4"
                    opacity="0.7"
                  />
                );
              })
            )}

            {/* Lesson Nodes */}
            {Array.from(nodePositions.values()).map(({ x, y, lesson }) => {
              const status = getStatus(lesson);
              const strokeColor =
                status === 'completed'
                  ? 'var(--status-success)'
                  : status === 'available'
                  ? 'var(--accent)'
                  : 'var(--border-strong)';
              return (
                <g key={lesson.routeId} transform={`translate(${x}, ${y})`}>
                  <a href={lesson.url} aria-label={`${lesson.title} (${lesson.estimatedMinutes} min, ${status})`}>
                    <rect
                      x="-64"
                      y="-20"
                      width="128"
                      height="40"
                      rx="6"
                      fill="var(--bg-surface)"
                      stroke={strokeColor}
                      strokeWidth={status === 'completed' ? 2 : 1.5}
                    />
                    <text
                      x="0"
                      y="-2"
                      textAnchor="middle"
                      className="fill-primary text-[10px] font-medium"
                    >
                      {lesson.title.length > 20 ? `${lesson.title.slice(0, 19)}…` : lesson.title}
                    </text>
                    <text
                      x="0"
                      y="12"
                      textAnchor="middle"
                      className="fill-primary-muted text-[9px] tabular-nums"
                    >
                      {lesson.estimatedMinutes}m · {status}
                    </text>
                  </a>
                </g>
              );
            })}
          </svg>
        </div>
      </section>

      {/* Module & Lesson List */}
      <div className="space-y-8">
        {modules
          .filter((m) => moduleFilter === 'all' || m.id === moduleFilter)
          .map((mod, idx) => {
            const modLessons = filteredLessons.filter((l) => l.module === mod.id);
            if (modLessons.length === 0) return null;
            return (
              <section key={mod.id} className={cn('space-y-3', idx >= 2 && 'cv-auto')}>
                <div className="flex flex-wrap items-baseline justify-between gap-2">
                  <h2 className="text-xl font-bold text-primary">
                    Module {mod.order}: {mod.title}
                  </h2>
                  <span className="text-xs tabular-nums text-primary-muted">
                    {modLessons.length} lessons · ~{mod.estimatedHours}h
                  </span>
                </div>
                <p className="text-sm text-primary-secondary">{mod.description}</p>
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  {modLessons.map((lesson) => {
                    const status = getStatus(lesson);
                    return (
                      <Link
                        key={lesson.routeId}
                        href={lesson.url}
                        prefetch={false}
                        className={cn(
                          'flex flex-col justify-between rounded-xl border bg-surface p-4 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-sm hover:border-accent',
                          status === 'completed' ? 'border-success/40' : 'border-hairline'
                        )}
                      >
                        <div>
                          <div className="mb-2 flex items-center justify-between gap-2">
                            <span className="text-xs tabular-nums text-primary-muted">
                              Lesson {mod.order}.{lesson.order}
                            </span>
                            <div className="flex items-center gap-1.5">
                              {reviewHydrated && (dueByLesson[lesson.routeId] ?? 0) > 0 && (
                                <Badge variant="accent">
                                  {dueByLesson[lesson.routeId]} due
                                </Badge>
                              )}
                              <Badge variant="neutral">{lesson.level}</Badge>
                              {status === 'completed' && (
                                <CheckCircle2 className="h-4 w-4 text-success" aria-label="Completed" />
                              )}
                            </div>
                          </div>
                          <h3 className="text-sm font-semibold text-primary">{lesson.title}</h3>
                          <p className="mt-1 line-clamp-2 text-xs text-primary-secondary">
                            {lesson.summary}
                          </p>
                        </div>
                        <div className="mt-3 flex items-center justify-between border-t border-hairline pt-2.5 text-[11px] tabular-nums text-primary-muted">
                          <span>{lesson.estimatedMinutes} min</span>
                          <span>{lesson.prerequisites.length} prereqs</span>
                        </div>
                      </Link>
                    );
                  })}
                </div>
              </section>
            );
          })}
      </div>
    </div>
  );
}

