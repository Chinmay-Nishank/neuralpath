'use client';

import * as React from 'react';
import Link from 'next/link';
import { ArrowRight, Brain, CheckCircle2, Compass, Cpu, BookOpen, Sparkles } from 'lucide-react';
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
import { useReview } from '@/components/review/review-provider';
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
  const { hydrated: reviewHydrated, dueCount } = useReview();
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
      <section className="relative overflow-hidden border-b border-hairline bg-surface/60 bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(29,78,216,0.08),rgba(255,255,255,0))] dark:bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(96,165,250,0.08),rgba(11,14,20,0))]">
        <div className="mx-auto grid max-w-[1280px] items-center gap-10 px-4 py-14 sm:px-6 lg:grid-cols-[1.2fr_0.9fr] lg:py-20">
          <div className="space-y-6">
            <div className="inline-flex items-center gap-2 rounded-full border border-accent/30 bg-accent-soft px-3 py-1 text-xs font-semibold text-accent">
              <Sparkles className="h-3.5 w-3.5" aria-hidden="true" />
              <span>Interactive ML, Deep Learning &amp; AI Platform</span>
            </div>
            <h1 className="text-4xl font-extrabold tracking-tight text-primary sm:text-5xl lg:text-[3.25rem] lg:leading-[1.12]">
              From &ldquo;what is a model?&rdquo; to training and deploying transformers.
            </h1>
            <p className="max-w-xl text-base leading-relaxed text-primary-secondary sm:text-lg">
              {totalLessons} interactive lessons across 10 structured modules. Every concept pairs
              clear first-principles explanations with live 3D visualizations, in-browser Python, and
              mastery checks—zero local setup required.
            </p>
            <div className="rounded-xl border border-hairline bg-surface/90 p-4 sm:p-5 shadow-sm backdrop-blur-sm">
              <div className="flex flex-wrap items-center gap-3">
                <Link
                  href={
                    state.lastVisitedLesson
                      ? `/learn/${state.lastVisitedLesson}`
                      : '/learn/foundations/01-what-is-a-model'
                  }
                  prefetch={false}
                  className={cn(buttonVariants({ size: 'lg', variant: 'primary' }), 'min-h-[44px] shadow-sm')}
                >
                  <span>{state.lastVisitedLesson ? 'Continue learning' : 'Start learning'}</span>
                  <ArrowRight className="h-4 w-4" aria-hidden="true" />
                </Link>
                <Link
                  href="/placement"
                  prefetch={false}
                  className={cn(buttonVariants({ size: 'lg', variant: 'outline' }), 'min-h-[44px]')}
                >
                  <Compass className="h-4 w-4 text-accent" aria-hidden="true" />
                  <span>Take Diagnostic Quiz</span>
                </Link>
              </div>
              <div className="mt-3 flex min-h-[28px] flex-wrap items-center justify-between gap-2 border-t border-hairline pt-2.5 text-xs">
                <span className="text-primary-secondary">
                  {state.lastVisitedLesson
                    ? `Resume: ${state.lastVisitedLesson}`
                    : 'Interactive Python, 3D visualizations & active recall'}
                </span>
                {reviewHydrated && dueCount > 0 && (
                  <Link
                    href="/review"
                    className="inline-flex items-center gap-1.5 font-medium text-accent hover:underline"
                  >
                    <Brain className="h-3.5 w-3.5" aria-hidden="true" />
                    <span>
                      {dueCount} {dueCount === 1 ? 'card' : 'cards'} due
                    </span>
                  </Link>
                )}
              </div>
            </div>
            <div className="flex flex-wrap gap-x-6 gap-y-2 pt-2 text-xs text-primary-secondary">
              <span className="flex items-center gap-1.5">
                <CheckCircle2 className="h-3.5 w-3.5 text-success" aria-hidden="true" />
                Pyodide WebAssembly Python
              </span>
              <span className="flex items-center gap-1.5">
                <CheckCircle2 className="h-3.5 w-3.5 text-success" aria-hidden="true" />
                11+ Interactive 3D Labs
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

      {/* Stats Metric Cards Bar */}
      <section className="mx-auto max-w-[1280px] px-4 sm:px-6 -mt-10 sm:-mt-12 relative z-10">
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 sm:gap-4 rounded-xl border border-hairline/80 bg-surface/95 p-4 sm:p-5 shadow-md backdrop-blur-md">
          <div className="space-y-1">
            <div className="text-2xl sm:text-3xl font-extrabold tracking-tight text-primary tabular-nums">71</div>
            <div className="text-xs text-primary-secondary font-medium">Interactive Lessons</div>
            <div className="text-[11px] text-primary-muted">10 structured modules</div>
          </div>
          <div className="space-y-1 border-l border-hairline/60 pl-3 sm:pl-4">
            <div className="text-2xl sm:text-3xl font-extrabold tracking-tight text-accent tabular-nums">11</div>
            <div className="text-xs text-primary-secondary font-medium">3D &amp; 2D Playgrounds</div>
            <div className="text-[11px] text-primary-muted">Real-time WebGL graphics</div>
          </div>
          <div className="space-y-1 border-l border-hairline/60 pl-3 sm:pl-4">
            <div className="text-2xl sm:text-3xl font-extrabold tracking-tight text-success tabular-nums">0</div>
            <div className="text-xs text-primary-secondary font-medium">Installations Needed</div>
            <div className="text-[11px] text-primary-muted">In-browser Pyodide Python</div>
          </div>
          <div className="space-y-1 border-l border-hairline/60 pl-3 sm:pl-4">
            <div className="text-2xl sm:text-3xl font-extrabold tracking-tight text-primary tabular-nums">FSRS</div>
            <div className="text-xs text-primary-secondary font-medium">Spaced Repetition</div>
            <div className="text-[11px] text-primary-muted">Long-term active recall</div>
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
                  'flex flex-col justify-between rounded-xl transition-all duration-200 hover:-translate-y-1 hover:shadow-md',
                  active ? 'border-accent ring-1 ring-accent bg-accent-soft/10' : 'hover:border-strong'
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
            const pct = Math.round((completedInMod / mod.lessonCount) * 100);
            return (
              <Link
                key={mod.id}
                href={mod.firstLessonUrl}
                prefetch={false}
                className="group rounded-xl border border-hairline bg-surface p-5 transition-all duration-200 hover:-translate-y-1 hover:border-accent hover:shadow-md flex flex-col justify-between"
              >
                <div>
                  <div className="mb-2 flex items-center justify-between gap-2">
                    <span className="text-xs font-semibold tabular-nums text-accent">
                      Module {String(mod.order).padStart(2, '0')}
                    </span>
                    <Badge variant="neutral">{mod.level}</Badge>
                  </div>
                  <h3 className="text-base font-semibold text-primary group-hover:text-accent transition-colors">
                    {mod.title}
                  </h3>
                  <p className="mt-1.5 line-clamp-2 text-xs leading-relaxed text-primary-secondary">
                    {mod.description}
                  </p>
                </div>

                <div className="mt-4 border-t border-hairline pt-3 space-y-1.5">
                  <div className="flex items-center justify-between text-[11px] tabular-nums text-primary-muted">
                    <span className="flex items-center gap-1">
                      <BookOpen className="h-3 w-3" aria-hidden="true" />
                      {mod.lessonCount} lessons · {mod.estimatedHours}h
                    </span>
                    <span className="font-medium text-primary">
                      {completedInMod}/{mod.lessonCount} done
                    </span>
                  </div>
                  {completedInMod > 0 && (
                    <div className="h-1.5 w-full overflow-hidden rounded-full bg-subtle">
                      <div
                        className="h-full bg-accent transition-all duration-300"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  )}
                </div>
              </Link>
            );
          })}
        </div>
      </section>
    </div>
  );
}

