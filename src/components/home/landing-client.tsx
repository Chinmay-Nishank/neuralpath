'use client';

import * as React from 'react';
import Link from 'next/link';
import { ArrowRight, CheckCircle2, Compass, Cpu, BookOpen, Sparkles } from 'lucide-react';
import { Button, buttonVariants } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { HeroNeuralNet } from '@/components/viz/hero-neural-net';
import dynamic from 'next/dynamic';
import { VizSkeleton } from '@/components/ui/skeleton';

const LazyViz = dynamic(() => import('@/components/mdx/viz').then((m) => m.Viz), {
  ssr: false,
  loading: () => <VizSkeleton height={460} />,
});
import { useProgress } from '@/components/progress/progress-provider';
import type { ModuleMeta } from '@/lib/content';
import type { LearningPathId } from '@/lib/progress';
import { cn } from '@/lib/utils';

export interface LandingModuleSummary extends ModuleMeta {
  lessonCount: number;
  firstLessonUrl: string;
}

export interface LandingPathStats {
  id: LearningPathId;
  title: string;
  subtitle: string;
  lessonCount: number;
  estimatedHours: number;
  startUrl: string;
}

export function LandingClient({
  modules,
  paths,
  totalLessons,
}: {
  modules: LandingModuleSummary[];
  paths: LandingPathStats[];
  totalLessons: number;
}) {
  const { state, setActivePath } = useProgress();
  const [previewViz, setPreviewViz] = React.useState<'gradient-descent' | 'attention'>(
    'gradient-descent'
  );
  const [previewVisible, setPreviewVisible] = React.useState(false);
  const previewRef = React.useRef<HTMLDivElement | null>(null);

  React.useEffect(() => {
    const el = previewRef.current;
    if (!el || previewVisible) return;
    if (typeof IntersectionObserver === 'undefined') {
      setPreviewVisible(true);
      return;
    }
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) {
          setPreviewVisible(true);
          observer.disconnect();
        }
      },
      { rootMargin: '150px' }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [previewVisible]);

  return (
    <div className="space-y-20 pb-20">
      {/* Hero */}
      <section className="border-b border-hairline bg-surface/60">
        <div className="mx-auto grid max-w-[1280px] items-center gap-10 px-4 py-14 sm:px-6 lg:grid-cols-[1.2fr_0.9fr] lg:py-20">
          <div className="space-y-6">
            <Badge variant="accent">Open-Source ML, Deep Learning &amp; AI Curriculum</Badge>
            <h1 className="text-4xl font-bold tracking-tight text-primary sm:text-5xl lg:text-[3.25rem] lg:leading-[1.12]">
              From &ldquo;what is a model?&rdquo; to training and deploying transformers.
            </h1>
            <p className="max-w-xl text-base leading-relaxed text-primary-secondary sm:text-lg">
              {totalLessons} interactive lessons across 10 structured modules. Every concept pairs
              clear first-principles explanations with live visualizations, in-browser Python, and
              mastery checks—zero local setup required.
            </p>
            <div className="flex flex-wrap items-center gap-3 pt-1">
              <Link
                href={
                  state.lastVisitedLesson
                    ? `/learn/${state.lastVisitedLesson}`
                    : '/learn/foundations/01-what-is-a-model'
                }
                prefetch={false}
                className={buttonVariants({ size: 'lg', variant: 'primary' })}
              >
                <span>{state.lastVisitedLesson ? 'Continue learning' : 'Start learning'}</span>
                <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </Link>
              <Link
                href="/onboarding"
                prefetch={false}
                className={buttonVariants({ size: 'lg', variant: 'outline' })}
              >
                <Compass className="h-4 w-4 text-accent" aria-hidden="true" />
                <span>Take the skill quiz</span>
              </Link>
            </div>
            <div className="flex flex-wrap gap-x-6 gap-y-2 pt-2 text-xs text-primary-secondary">
              <span className="flex items-center gap-1.5">
                <CheckCircle2 className="h-3.5 w-3.5 text-success" aria-hidden="true" />
                Pyodide WebAssembly Python
              </span>
              <span className="flex items-center gap-1.5">
                <CheckCircle2 className="h-3.5 w-3.5 text-success" aria-hidden="true" />
                11+ Interactive Labs
              </span>
              <span className="flex items-center gap-1.5">
                <CheckCircle2 className="h-3.5 w-3.5 text-success" aria-hidden="true" />
                Local-First Progress &amp; Notes
              </span>
            </div>
          </div>

          <div className="flex justify-center lg:justify-end">
            <HeroNeuralNet />
          </div>
        </div>
      </section>

      {/* Learning Path Selector */}
      <section className="cv-auto mx-auto max-w-[1280px] px-4 sm:px-6">
        <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
          <div className="space-y-1.5">
            <h2 className="text-2xl font-bold tracking-tight text-primary">
              Choose your learning path
            </h2>
            <p className="text-sm text-primary-secondary">
              Switch paths anytime. Prerequisites and recommended lessons adapt automatically.
            </p>
          </div>
          <Link href="/curriculum" className="text-sm font-medium text-accent hover:underline">
            Explore full prerequisite graph →
          </Link>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          {paths.map((p) => {
            const active = state.activePath === p.id;
            return (
              <Card
                key={p.id}
                className={cn(
                  'flex flex-col justify-between transition-colors',
                  active && 'border-accent ring-1 ring-accent'
                )}
              >
                <CardHeader>
                  <div className="flex items-center justify-between gap-2">
                    <CardTitle>{p.title}</CardTitle>
                    {active && <Badge variant="accent">Active</Badge>}
                  </div>
                  <CardDescription>{p.subtitle}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center gap-4 font-mono text-xs text-primary-secondary">
                    <span>{p.lessonCount} lessons</span>
                    <span>·</span>
                    <span>~{p.estimatedHours} hours</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      size="sm"
                      variant={active ? 'secondary' : 'outline'}
                      onClick={() => setActivePath(p.id)}
                    >
                      {active ? 'Selected Path' : 'Select Path'}
                    </Button>
                    <Link href={p.startUrl} className="text-xs font-medium text-accent hover:underline">
                      Start here
                    </Link>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </section>

      {/* See a Lesson in Action */}
      <section className="cv-auto mx-auto max-w-[1280px] px-4 sm:px-6">
        <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
          <div className="space-y-1.5">
            <h2 className="text-2xl font-bold tracking-tight text-primary">
              See a lesson in action
            </h2>
            <p className="text-sm text-primary-secondary">
              Every core algorithm has an interactive workbench directly inside the prose.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant={previewViz === 'gradient-descent' ? 'primary' : 'outline'}
              onClick={() => {
                setPreviewVisible(true);
                setPreviewViz('gradient-descent');
              }}
            >
              <Cpu className="h-3.5 w-3.5" aria-hidden="true" />
              Gradient Descent Lab
            </Button>
            <Button
              size="sm"
              variant={previewViz === 'attention' ? 'primary' : 'outline'}
              onClick={() => {
                setPreviewVisible(true);
                setPreviewViz('attention');
              }}
            >
              <Sparkles className="h-3.5 w-3.5" aria-hidden="true" />
              Self-Attention Lab
            </Button>
          </div>
        </div>

        <div ref={previewRef} className="min-h-[460px]">
          {previewVisible ? <LazyViz type={previewViz} /> : <VizSkeleton height={460} />}
        </div>
      </section>

      {/* 10-Module Curriculum Roadmap */}
      <section className="cv-auto mx-auto max-w-[1280px] px-4 sm:px-6">
        <div className="mb-8 space-y-1.5">
          <h2 className="text-2xl font-bold tracking-tight text-primary">
            10-Module Curriculum Roadmap
          </h2>
          <p className="text-sm text-primary-secondary">
            From mathematical foundations and classical ML to Transformers, Flow Matching, RLHF,
            MLOps, and 5 guided capstones.
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {modules.map((mod) => {
            const completedInMod = Object.keys(state.completedLessons).filter((id) =>
              id.startsWith(`${mod.id}/`)
            ).length;
            return (
              <Link
                key={mod.id}
                href={mod.firstLessonUrl}
                prefetch={false}
                className="group rounded-md border border-hairline bg-surface p-5 transition-colors hover:border-accent"
              >
                <div className="mb-2 flex items-center justify-between gap-2">
                  <span className="text-xs font-semibold tabular-nums text-accent">
                    Module {String(mod.order).padStart(2, '0')}
                  </span>
                  <Badge variant="neutral">{mod.level}</Badge>
                </div>
                <h3 className="text-base font-semibold text-primary group-hover:text-accent">
                  {mod.title}
                </h3>
                <p className="mt-1.5 line-clamp-2 text-xs leading-relaxed text-primary-secondary">
                  {mod.description}
                </p>
                <div className="mt-4 flex items-center justify-between border-t border-hairline pt-3 text-[11px] tabular-nums text-primary-muted">
                  <span className="flex items-center gap-1">
                    <BookOpen className="h-3 w-3" aria-hidden="true" />
                    {mod.lessonCount} lessons · {mod.estimatedHours}h
                  </span>
                  <span>
                    {completedInMod}/{mod.lessonCount} done
                  </span>
                </div>
              </Link>
            );
          })}
        </div>
      </section>
    </div>
  );
}

