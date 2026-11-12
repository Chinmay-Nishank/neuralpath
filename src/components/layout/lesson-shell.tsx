'use client';

import * as React from 'react';
import { ModuleSidebar, type SidebarModuleGroup } from './module-sidebar';
import { TableOfContents, type TocHeading } from './table-of-contents';
import { LessonFooterActions } from './lesson-feedback';
import { FeynmanTeachBack } from './feynman-teachback';
import { StudyTimer } from './study-timer';
import { ReadingProgressBar } from './reading-progress-bar';
import { useProgress } from '@/components/progress/progress-provider';
import { cn } from '@/lib/utils';

export function LessonShell({
  modules,
  routeId,
  slugPath,
  lessonTitle,
  lessonObjectives,
  toc,
  headerSlot,
  children,
  afterProseSlot,
  nextLesson,
}: {
  modules: SidebarModuleGroup[];
  routeId: string;
  slugPath: string;
  lessonTitle: string;
  lessonSummary?: string;
  lessonLevel?: string;
  lessonObjectives?: string[];
  lessonVizTypes?: string[];
  toc: TocHeading[];
  headerSlot: React.ReactNode;
  children: React.ReactNode;
  afterProseSlot: React.ReactNode;
  nextLesson?: { title: string; url: string } | null;
}) {
  const { state } = useProgress();

  return (
    <>
      <ReadingProgressBar />
      <div className="mx-auto max-w-[1440px] px-4 py-6 sm:px-6 lg:grid lg:grid-cols-[260px_minmax(0,1fr)] lg:gap-8 xl:grid-cols-[260px_minmax(0,1fr)_240px]">
        <ModuleSidebar modules={modules} currentRouteId={routeId} />

        <article data-pagefind-body className="min-w-0">
          <div className="mx-auto max-w-[760px]">
            {headerSlot}
            <div
              className={cn(
                'lesson-prose prose prose-slate dark:prose-invert max-w-none',
                state.fontSerif && 'font-reading-serif'
              )}
            >
              {children}
            </div>
            <div data-pagefind-ignore="all" className="mt-8 space-y-4">
              <StudyTimer />
              <FeynmanTeachBack
                routeId={routeId}
                objectives={lessonObjectives ?? []}
              />
            </div>
            <LessonFooterActions
              routeId={routeId}
              slugPath={slugPath}
              lessonTitle={lessonTitle}
              nextLesson={nextLesson}
            />
            {afterProseSlot}
          </div>
        </article>

        <TableOfContents
          toc={toc}
          routeId={routeId}
          lessonTitle={lessonTitle}
        />
      </div>
    </>
  );
}
