'use client';

import * as React from 'react';
import Link from 'next/link';
import katex from 'katex';
import {
  Code2,
  BookOpen,
  Lightbulb,
  Cpu,
  CheckCircle2,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { buttonVariants } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import {
  SCRATCH_ALGORITHMS,
} from '@/lib/algorithms-lab';
import { CodeRunner } from '@/components/mdx/code-runner';
import { cn } from '@/lib/utils';

export function AlgorithmsLabClient() {
  const [selectedId, setSelectedId] = React.useState<string>(SCRATCH_ALGORITHMS[0]!.id);
  const [categoryFilter, setCategoryFilter] = React.useState<string>('All');

  const selectedAlg =
    SCRATCH_ALGORITHMS.find((a) => a.id === selectedId) ?? SCRATCH_ALGORITHMS[0]!;

  const categories = ['All', 'Foundations', 'Classical ML', 'Deep Learning', 'Transformers'];

  const filteredAlgorithms = React.useMemo(() => {
    if (categoryFilter === 'All') return SCRATCH_ALGORITHMS;
    return SCRATCH_ALGORITHMS.filter((a) => a.category === categoryFilter);
  }, [categoryFilter]);

  const mathHtml = React.useMemo(() => {
    try {
      return katex.renderToString(selectedAlg.mathFormula, {
        displayMode: true,
        throwOnError: false,
      });
    } catch {
      return selectedAlg.mathFormula;
    }
  }, [selectedAlg.mathFormula]);

  return (
    <div className="mx-auto max-w-7xl space-y-8 px-4 py-10 sm:px-6">
      {/* Page Header */}
      <div className="space-y-3">
        <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-accent">
          <Cpu className="h-4 w-4" aria-hidden="true" />
          First-Principles Engineering
        </div>
        <h1 className="text-3xl font-bold tracking-tight text-primary sm:text-4xl">
          From-Scratch Machine Learning Lab
        </h1>
        <p className="max-w-3xl text-sm text-primary-secondary sm:text-base">
          Understand machine learning from the mathematical inside-out. Every algorithm below is
          implemented in pure Python &amp; NumPy with <strong>zero black-box libraries</strong>—from
          vectorized gradient descent to reverse-mode autograd and Scaled Dot-Product Attention.
        </p>
      </div>

      {/* Category Pills */}
      <div className="flex flex-wrap items-center gap-2 border-b border-hairline pb-3">
        {categories.map((cat) => (
          <button
            key={cat}
            type="button"
            onClick={() => {
              setCategoryFilter(cat);
              const firstInCat =
                cat === 'All'
                  ? SCRATCH_ALGORITHMS[0]!
                  : SCRATCH_ALGORITHMS.find((a) => a.category === cat) ?? SCRATCH_ALGORITHMS[0]!;
              setSelectedId(firstInCat.id);
            }}
            className={`rounded-sm px-3 py-1.5 text-xs font-medium transition-colors ${
              categoryFilter === cat
                ? 'bg-subtle text-primary shadow-xs font-semibold'
                : 'text-primary-secondary hover:bg-subtle/50 hover:text-primary'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Main Two-Column Layout */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        {/* Left Algorithm List */}
        <div className="space-y-2 lg:col-span-4">
          <span className="text-xs font-semibold uppercase tracking-wider text-primary-secondary block mb-1">
            Algorithms ({filteredAlgorithms.length})
          </span>
          {filteredAlgorithms.map((alg) => {
            const isSelected = alg.id === selectedId;
            return (
              <button
                key={alg.id}
                type="button"
                onClick={() => setSelectedId(alg.id)}
                className={`w-full text-left rounded-md border p-3.5 transition-colors ${
                  isSelected
                    ? 'border-accent bg-accent-soft/20 text-primary shadow-xs'
                    : 'border-hairline bg-surface hover:border-strong text-primary'
                }`}
              >
                <div className="flex items-center justify-between gap-1 mb-1">
                  <Badge variant={isSelected ? 'accent' : 'neutral'} className="text-[10px] px-1.5 py-0">
                    {alg.levelLabel}
                  </Badge>
                  <span className="text-[11px] font-mono text-primary-secondary">
                    {alg.category}
                  </span>
                </div>
                <div className="text-sm font-semibold tracking-tight">
                  {alg.title}
                </div>
                <div className="text-xs text-primary-secondary line-clamp-2 mt-1">
                  {alg.summary}
                </div>
              </button>
            );
          })}
        </div>

        {/* Right Detail & Code Runner */}
        <div className="space-y-6 lg:col-span-8">
          {/* Header Card */}
          <Card className="border-hairline shadow-sm">
            <CardHeader className="space-y-3 pb-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex flex-wrap items-center gap-2">
                  <Badge variant="accent">{selectedAlg.levelLabel}</Badge>
                  <Badge variant="neutral">{selectedAlg.category}</Badge>
                </div>
                <Link
                  href={selectedAlg.lessonUrl}
                  className={cn(buttonVariants({ variant: 'outline', size: 'sm' }))}
                >
                  <BookOpen className="h-3.5 w-3.5 mr-1" aria-hidden="true" />
                  <span>Read Full Lesson</span>
                </Link>
              </div>

              <CardTitle className="text-xl font-bold tracking-tight text-primary">
                {selectedAlg.title}
              </CardTitle>
              <CardDescription className="text-sm text-primary-secondary">
                {selectedAlg.summary}
              </CardDescription>
            </CardHeader>

            <CardContent className="space-y-4 pt-0">
              {/* LaTeX Formula Block */}
              <div className="rounded-md border border-hairline bg-surface p-4 text-center overflow-x-auto">
                <span className="text-[11px] font-semibold uppercase tracking-wider text-primary-secondary block mb-2">
                  Core Mathematical Formula
                </span>
                <div
                  className="text-primary"
                  dangerouslySetInnerHTML={{ __html: mathHtml }}
                />
              </div>

              {/* Step-by-Step Breakdown */}
              <div className="space-y-2">
                <span className="text-xs font-semibold uppercase tracking-wider text-primary-secondary block">
                  How it works step-by-step:
                </span>
                <ul className="space-y-1.5 text-xs text-primary">
                  {selectedAlg.explanation.map((item, idx) => (
                    <li key={idx} className="flex items-start gap-2">
                      <CheckCircle2 className="h-3.5 w-3.5 text-accent shrink-0 mt-0.5" aria-hidden="true" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </CardContent>
          </Card>

          {/* Interactive Monaco & Pyodide CodeRunner */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-primary-secondary flex items-center gap-1.5">
                <Code2 className="h-4 w-4 text-accent" aria-hidden="true" />
                Live In-Browser Python Sandbox
              </span>
              <span className="text-xs text-primary-secondary font-mono">
                Pure NumPy / Python 3.12 (Pyodide Worker)
              </span>
            </div>

            <CodeRunner
              key={selectedAlg.id}
              title={`${selectedAlg.title} (From Scratch)`}
              code={selectedAlg.code}
              runnable={true}
              language="python"
            />
          </div>

          {/* Hands-On Challenge Prompt */}
          <Card className="border-accent/40 bg-accent-soft/10">
            <CardHeader className="pb-2">
              <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-accent">
                <Lightbulb className="h-4 w-4" aria-hidden="true" />
                Hands-On Challenge
              </div>
              <CardTitle className="text-sm font-semibold text-primary">
                Try modifying the parameters above:
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0 text-xs text-primary-secondary">
              {selectedAlg.exercisePrompt}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
