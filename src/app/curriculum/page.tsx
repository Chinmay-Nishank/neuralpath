import type { Metadata } from 'next';
import { getAllLessons, getModules } from '@/lib/content';
import { CurriculumMap, type GraphLessonNode } from '@/components/curriculum/curriculum-map';

export const metadata: Metadata = {
  title: 'Curriculum Map',
  description:
    'Browse all 10 modules and prerequisite graph across Foundations, Classical ML, Deep Learning, Vision, Transformers, Generative AI, RL, MLOps, Safety, and Capstones.',
};

export default function CurriculumPage() {
  const modules = getModules();
  const lessons: GraphLessonNode[] = getAllLessons().map((l) => ({
    routeId: l.routeId,
    title: l.title,
    module: l.module,
    moduleOrder: l.moduleOrder,
    order: l.order,
    level: l.level,
    paths: l.paths,
    estimatedMinutes: l.estimatedMinutes,
    prerequisites: l.prerequisites,
    summary: l.summary,
    url: l.url,
  }));

  return (
    <div className="mx-auto max-w-[1360px] space-y-6 px-4 py-10 sm:px-6">
      <div className="border-b border-hairline pb-6">
        <h1 className="text-3xl font-bold tracking-tight text-primary">
          Curriculum &amp; Prerequisite Map
        </h1>
        <p className="mt-1 text-sm text-primary-secondary">
          Explore all {lessons.length} lessons across {modules.length} modules. Prerequisites unlock
          progressively, though you can jump to any lesson freely.
        </p>
      </div>
      <CurriculumMap modules={modules} lessons={lessons} />
    </div>
  );
}

