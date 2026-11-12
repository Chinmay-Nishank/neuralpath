import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArrowLeft, ArrowRight, Clock, CheckSquare } from 'lucide-react';
import {
  getAdjacentLessons,
  getAllLessons,
  getGlossaryEntries,
  getLesson,
  getLessonByRouteId,
  getLessonsForModule,
  getModuleById,
  getModules,
  getRelatedLessons,
} from '@/lib/content';
import { Breadcrumbs } from '@/components/ui/breadcrumbs';
import { Badge } from '@/components/ui/badge';
import { LessonShell } from '@/components/layout/lesson-shell';
import { MdxContent } from '@/components/mdx/mdx-content';
import { GlossaryProvider } from '@/components/mdx/glossary-term';
import type { SidebarModuleGroup } from '@/components/layout/module-sidebar';

export const dynamicParams = false;

export async function generateStaticParams() {
  return getAllLessons().map((lesson) => ({
    module: lesson.module,
    slug: lesson.lessonSlug,
  }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ module: string; slug: string }>;
}): Promise<Metadata> {
  const { module: moduleId, slug } = await params;
  const lesson = getLesson(moduleId, slug);
  if (!lesson) return {};
  const moduleMeta = getModuleById(moduleId);

  const ogUrl = `/api/og?title=${encodeURIComponent(lesson.title)}&module=${encodeURIComponent(
    moduleMeta?.title ?? moduleId
  )}&level=${encodeURIComponent(lesson.level)}`;

  return {
    title: lesson.title,
    description: lesson.summary,
    openGraph: {
      title: `${lesson.title} · NeuralPath`,
      description: lesson.summary,
      type: 'article',
      images: [ogUrl],
    },
  };
}

export default async function LessonPage({
  params,
}: {
  params: Promise<{ module: string; slug: string }>;
}) {
  const { module: moduleId, slug } = await params;
  const lesson = getLesson(moduleId, slug);
  if (!lesson) notFound();

  const modules = getModules();
  const moduleMeta = getModuleById(moduleId);
  const sidebarModules: SidebarModuleGroup[] = modules.map((m) => ({
    id: m.id,
    order: m.order,
    title: m.title,
    shortTitle: m.shortTitle,
    lessons: getLessonsForModule(m.id).map((l) => ({
      routeId: l.routeId,
      title: l.title,
      url: l.url,
      estimatedMinutes: l.estimatedMinutes,
      level: l.level,
    })),
  }));

  const { prev, next } = getAdjacentLessons(lesson);
  const related = getRelatedLessons(lesson, 3);
  const prereqLessons = lesson.prerequisites
    .map((id) => getLessonByRouteId(id))
    .filter((x): x is NonNullable<typeof x> => Boolean(x));

  const articleJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: lesson.title,
    description: lesson.summary,
    dateModified: lesson.updatedAt,
    educationalLevel: lesson.level,
    timeRequired: `PT${lesson.estimatedMinutes}M`,
    author: { '@type': 'Organization', name: 'NeuralPath' },
  };

  const headerSlot = (
    <header className="mb-8 space-y-4 border-b border-hairline pb-6">
      <Breadcrumbs
        items={[
          { label: 'Curriculum', href: '/curriculum' },
          { label: moduleMeta?.shortTitle ?? lesson.module, href: `/curriculum?module=${lesson.module}` },
          { label: lesson.title },
        ]}
      />

      <div className="flex flex-wrap items-center gap-2">
        <Badge variant="accent">
          Module {lesson.moduleOrder}.{lesson.order}
        </Badge>
        <Badge variant="neutral">{lesson.level}</Badge>
        <span className="inline-flex items-center gap-1 font-mono text-xs text-primary-secondary">
          <Clock className="h-3.5 w-3.5" aria-hidden="true" />
          {lesson.estimatedMinutes} min
        </span>
      </div>

      <h1 className="text-3xl font-bold tracking-tight text-primary sm:text-4xl">
        {lesson.title}
      </h1>

      <p className="text-base leading-relaxed text-primary-secondary">{lesson.summary}</p>

      {prereqLessons.length > 0 && (
        <div className="flex flex-wrap items-center gap-2 text-xs text-primary-secondary">
          <span className="font-semibold text-primary">Prerequisites:</span>
          {prereqLessons.map((p) => (
            <Link
              key={p.routeId}
              href={p.url}
              className="rounded-sm border border-hairline bg-subtle px-2 py-0.5 hover:border-accent hover:text-accent"
            >
              {p.title}
            </Link>
          ))}
        </div>
      )}

      <div className="rounded-md border border-hairline bg-surface p-4">
        <div className="mb-2 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-primary">
          <CheckSquare className="h-3.5 w-3.5 text-accent" aria-hidden="true" />
          Learning Objectives
        </div>
        <ul className="grid gap-1.5 text-xs text-primary-secondary sm:grid-cols-2">
          {lesson.objectives.map((obj, idx) => (
            <li key={idx} className="flex items-start gap-2">
              <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-accent" aria-hidden="true" />
              <span>{obj}</span>
            </li>
          ))}
        </ul>
      </div>
    </header>
  );

  const afterProseSlot = (
    <div className="space-y-8 border-t border-hairline pt-6">
      <nav aria-label="Lesson Navigation" className="grid gap-3 sm:grid-cols-2">
        {prev ? (
          <Link
            href={prev.url}
            className="flex flex-col gap-1 rounded-md border border-hairline bg-surface p-4 transition-colors hover:border-accent"
          >
            <span className="flex items-center gap-1 text-xs text-primary-muted">
              <ArrowLeft className="h-3.5 w-3.5" aria-hidden="true" />
              Previous Lesson
            </span>
            <span className="text-sm font-semibold text-primary">{prev.title}</span>
          </Link>
        ) : (
          <div />
        )}

        {next ? (
          <Link
            href={next.url}
            className="flex flex-col items-end gap-1 rounded-md border border-hairline bg-surface p-4 text-right transition-colors hover:border-accent"
          >
            <span className="flex items-center gap-1 text-xs text-primary-muted">
              Next Lesson
              <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
            </span>
            <span className="text-sm font-semibold text-primary">{next.title}</span>
          </Link>
        ) : (
          <div />
        )}
      </nav>

      {related.length > 0 && (
        <section aria-label="Related Lessons" className="space-y-3">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-primary-secondary">
            Related Lessons
          </h2>
          <div className="grid gap-3 sm:grid-cols-3">
            {related.map((item) => (
              <Link
                key={item.routeId}
                href={item.url}
                className="rounded-md border border-hairline bg-surface p-3.5 transition-colors hover:border-accent"
              >
                <div className="text-xs font-semibold text-primary">{item.title}</div>
                <div className="mt-1 font-mono text-[11px] text-primary-muted">
                  {item.estimatedMinutes} min · {item.level}
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}
    </div>
  );

  const bodyLower = lesson.body.toLowerCase();
  const lessonGlossaryEntries = getGlossaryEntries().filter((entry) => {
    if (bodyLower.includes(entry.term.toLowerCase())) return true;
    return entry.aliases?.some((a) => bodyLower.includes(a.toLowerCase())) ?? false;
  });

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(articleJsonLd) }}
      />
      <GlossaryProvider entries={lessonGlossaryEntries}>
        <LessonShell
          modules={sidebarModules}
          routeId={lesson.routeId}
          slugPath={lesson.slug}
          lessonTitle={lesson.title}
          lessonSummary={lesson.summary}
          lessonLevel={lesson.level}
          lessonObjectives={lesson.objectives}
          lessonVizTypes={lesson.vizTypes}
          toc={lesson.toc}
          headerSlot={headerSlot}
          afterProseSlot={afterProseSlot}
          nextLesson={next ? { title: next.title, url: next.url } : null}
        >
          <MdxContent code={lesson.body} />
        </LessonShell>
      </GlossaryProvider>
    </>
  );
}

