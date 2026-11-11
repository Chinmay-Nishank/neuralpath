'use client';

import * as React from 'react';
import dynamic from 'next/dynamic';
import { ModuleSidebar, type SidebarModuleGroup } from './module-sidebar';
import { TableOfContents, type TocHeading } from './table-of-contents';
import { LessonFooterActions } from './lesson-feedback';
import { ReadingProgressBar } from './reading-progress-bar';
import { useProgress } from '@/components/progress/progress-provider';
import { cn } from '@/lib/utils';

const AiTutorDrawer = dynamic(
  () => import('./ai-tutor-drawer').then((m) => m.AiTutorDrawer),
  { ssr: false }
);

export function LessonShell({
  modules,
  routeId,
  slugPath,
  lessonTitle,
  lessonSummary,
  lessonLevel,
  lessonObjectives,
  lessonVizTypes,
  toc,
  headerSlot,
  children,
  afterProseSlot,
}: {
  modules: SidebarModuleGroup[];
  routeId: string;
  slugPath: string;
  lessonTitle: string;
  lessonSummary: string;
  lessonLevel?: string;
  lessonObjectives?: string[];
  lessonVizTypes?: string[];
  toc: TocHeading[];
  headerSlot: React.ReactNode;
  children: React.ReactNode;
  afterProseSlot: React.ReactNode;
}) {
  const { state } = useProgress();
  const [tutorOpen, setTutorOpen] = React.useState(false);
  const lessonSections = React.useMemo(
    () => toc.map((item) => item.title),
    [toc]
  );

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
            <LessonFooterActions
              routeId={routeId}
              slugPath={slugPath}
              onOpenTutor={() => setTutorOpen(true)}
            />
            {afterProseSlot}
          </div>
        </article>

        <TableOfContents
          toc={toc}
          routeId={routeId}
          onOpenTutor={() => setTutorOpen(true)}
        />
      </div>

      {tutorOpen && (
        <AiTutorDrawer
          open={tutorOpen}
          onClose={() => setTutorOpen(false)}
          lessonTitle={lessonTitle}
          lessonSummary={lessonSummary}
          lessonRouteId={routeId}
          lessonLevel={lessonLevel}
          lessonObjectives={lessonObjectives}
          lessonSections={lessonSections}
          lessonVizTypes={lessonVizTypes}
        />
      )}
    </>
  );
}

