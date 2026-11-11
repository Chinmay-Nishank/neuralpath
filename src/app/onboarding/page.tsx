'use client';

import * as React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowRight, Compass } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { useProgress } from '@/components/progress/progress-provider';
import type { LearningPathId } from '@/lib/progress';

const GOALS = [
  {
    id: 'foundations',
    title: 'Learn ML & AI from scratch',
    desc: 'I can write basic Python and want clear visual intuition for math, classical ML, and neural networks.',
    path: 'beginner' as LearningPathId,
    start: '/learn/foundations/01-what-is-a-model',
  },
  {
    id: 'shipping',
    title: 'Build and ship ML / LLM systems',
    desc: 'I already understand basic models and want Transformers, RAG, LoRA fine-tuning, and production MLOps.',
    path: 'practitioner' as LearningPathId,
    start: '/learn/nlp-transformers/04-self-attention',
  },
  {
    id: 'frontier',
    title: 'Master frontier architectures & research',
    desc: 'Take me straight to backprop derivations, RoPE/GQA, Flow Matching, GRPO, quantization, and SAEs.',
    path: 'researcher' as LearningPathId,
    start: '/learn/nlp-transformers/05-transformer-architecture',
  },
];

export default function OnboardingPage() {
  const router = useRouter();
  const { completeOnboarding } = useProgress();
  const [selectedIdx, setSelectedIdx] = React.useState(0);

  const selected = GOALS[selectedIdx] ?? GOALS[0]!;

  const handleStart = () => {
    completeOnboarding(selected.path);
    router.push(selected.start);
  };

  return (
    <div className="mx-auto max-w-3xl px-4 py-14 sm:px-6">
      <div className="mb-8 space-y-2">
        <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-accent">
          <Compass className="h-4 w-4" aria-hidden="true" />
          30-Second Skill Quiz
        </div>
        <h1 className="text-3xl font-bold tracking-tight text-primary">
          Where should we start your NeuralPath?
        </h1>
        <p className="text-sm text-primary-secondary">
          Pick the goal that best describes you. No account required—everything saves locally and you
          can switch paths anytime.
        </p>
      </div>

      <div className="space-y-3" role="radiogroup" aria-label="Choose your learning goal">
        {GOALS.map((goal, idx) => {
          const active = idx === selectedIdx;
          const radioId = `goal-${goal.id}`;
          return (
            <Card
              key={goal.id}
              className={`cursor-pointer transition-colors ${
                active ? 'border-accent ring-1 ring-accent bg-accent-soft/20' : 'hover:border-strong'
              }`}
              onClick={() => setSelectedIdx(idx)}
            >
              <CardHeader className="pb-2">
                <div className="flex items-center gap-3">
                  <input
                    id={radioId}
                    type="radio"
                    name="onboarding-goal"
                    checked={active}
                    onChange={() => setSelectedIdx(idx)}
                    className="h-4 w-4 accent-accent"
                  />
                  <label htmlFor={radioId} className="cursor-pointer">
                    <CardTitle>{goal.title}</CardTitle>
                  </label>
                </div>
                <CardDescription className="pl-7">{goal.desc}</CardDescription>
              </CardHeader>
              <CardContent className="pl-12 pt-0 font-mono text-xs text-accent">
                Recommended path: {goal.path}
              </CardContent>
            </Card>
          );
        })}
      </div>

      <div className="mt-8 flex flex-wrap items-center justify-between gap-3">
        <Link href="/curriculum" className="text-sm text-primary-secondary hover:text-primary">
          Skip quiz and browse curriculum map
        </Link>
        <Button size="lg" onClick={handleStart}>
          <span>Start {selected.path} path</span>
          <ArrowRight className="h-4 w-4" aria-hidden="true" />
        </Button>
      </div>
    </div>
  );
}

