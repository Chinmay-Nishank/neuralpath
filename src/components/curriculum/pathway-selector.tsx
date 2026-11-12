'use client';

import * as React from 'react';
import Link from 'next/link';
import { ArrowRight, CheckCircle2, Compass, BookOpen, Clock } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { buttonVariants } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { LEARNING_PATHWAYS, calculatePathwayProgress } from '@/lib/pathways';
import { useProgress } from '@/components/progress/progress-provider';
import { cn } from '@/lib/utils';
import type { GraphLessonNode } from './curriculum-map';

interface PathwaySelectorProps {
  selectedPathwayId: string;
  onSelectPathway: (id: string) => void;
  lessons: GraphLessonNode[];
}

export function PathwaySelector({
  selectedPathwayId,
  onSelectPathway,
  lessons,
}: PathwaySelectorProps) {
  const { state } = useProgress();

  const activePathway = LEARNING_PATHWAYS.find((p) => p.id === selectedPathwayId);

  return (
    <div className="space-y-4">
      {/* Pathway Tabs */}
      <div className="flex flex-wrap items-center gap-1.5 border-b border-hairline pb-3">
        <button
          type="button"
          onClick={() => onSelectPathway('all')}
          className={`rounded-sm px-3 py-1.5 text-xs font-medium transition-colors ${
            selectedPathwayId === 'all'
              ? 'bg-subtle text-primary shadow-xs'
              : 'text-primary-secondary hover:bg-subtle/50 hover:text-primary'
          }`}
        >
          All Modules ({lessons.length} Lessons)
        </button>
        {LEARNING_PATHWAYS.map((path) => {
          const isSelected = path.id === selectedPathwayId;
          return (
            <button
              key={path.id}
              type="button"
              onClick={() => onSelectPathway(path.id)}
              className={`rounded-sm px-3 py-1.5 text-xs font-medium transition-colors ${
                isSelected
                  ? 'bg-subtle text-primary shadow-xs font-semibold'
                  : 'text-primary-secondary hover:bg-subtle/50 hover:text-primary'
              }`}
            >
              {path.shortTitle}
            </button>
          );
        })}
      </div>

      {/* Selected Pathway Hero Card */}
      {activePathway && (
        <Card className="border-accent/40 bg-accent-soft/10">
          <CardHeader className="pb-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex flex-wrap items-center gap-2">
                <Badge variant="accent">{activePathway.levelLabel}</Badge>
                <span className="inline-flex items-center gap-1 text-xs text-primary-secondary">
                  <Clock className="h-3.5 w-3.5" aria-hidden="true" />
                  ~{activePathway.estimatedHours} hours total
                </span>
                <span className="inline-flex items-center gap-1 text-xs text-primary-secondary">
                  <BookOpen className="h-3.5 w-3.5" aria-hidden="true" />
                  {activePathway.modules.length} key modules
                </span>
              </div>
              <Link
                href="/placement"
                className="inline-flex items-center gap-1 text-xs text-accent hover:underline"
              >
                <Compass className="h-3.5 w-3.5" aria-hidden="true" />
                <span>Take 2-min Skill Diagnostic</span>
              </Link>
            </div>
            <CardTitle className="text-xl font-bold tracking-tight text-primary mt-2">
              {activePathway.title}
            </CardTitle>
            <CardDescription className="text-sm text-primary-secondary">
              {activePathway.tagline}
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-4 pt-0">
            {/* Progress Bar */}
            {(() => {
              const progress = calculatePathwayProgress(
                activePathway,
                state.completedLessons,
                lessons
              );
              const nextLesson = progress.nextLessonRouteId
                ? lessons.find((l) => l.routeId === progress.nextLessonRouteId)
                : null;
              const targetUrl = nextLesson ? nextLesson.url : activePathway.startUrl;

              return (
                <div className="space-y-3 rounded-md border border-hairline bg-surface p-3 sm:p-4">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-medium text-primary">
                      Track Progress: {progress.completed} of {progress.total} lessons complete
                    </span>
                    <span className="font-mono text-accent font-semibold">
                      {progress.percent}%
                    </span>
                  </div>
                  <div className="h-2 w-full overflow-hidden rounded-full bg-subtle">
                    <div
                      className="h-full bg-accent transition-all duration-300"
                      style={{ width: `${progress.percent}%` }}
                    />
                  </div>

                  <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
                    <div className="text-xs text-primary-secondary">
                      {nextLesson ? (
                        <span>
                          Next up: <strong className="text-primary">{nextLesson.title}</strong>
                        </span>
                      ) : (
                        <span className="text-accent font-medium">All lessons completed! Great job!</span>
                      )}
                    </div>
                    <Link
                      href={targetUrl}
                      className={cn(buttonVariants({ size: 'sm', variant: 'primary' }))}
                    >
                      <span>{progress.completed === 0 ? 'Start This Pathway' : 'Continue Track'}</span>
                      <ArrowRight className="h-3.5 w-3.5 ml-1" aria-hidden="true" />
                    </Link>
                  </div>
                </div>
              );
            })()}

            {/* Core Outcomes */}
            <div className="space-y-1.5">
              <span className="text-xs font-semibold uppercase tracking-wider text-primary-secondary">
                What you will master:
              </span>
              <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-primary">
                {activePathway.outcomes.map((outcome, idx) => (
                  <li key={idx} className="flex items-start gap-2">
                    <CheckCircle2 className="h-3.5 w-3.5 text-accent shrink-0 mt-0.5" aria-hidden="true" />
                    <span>{outcome}</span>
                  </li>
                ))}
              </ul>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
