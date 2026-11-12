'use client';

import * as React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowRight, Compass } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { useProgress } from '@/components/progress/progress-provider';
import type { LearningPathId } from '@/lib/progress';

const GOALS = [
  {
    id: 'complete-mastery',
    badge: 'Recommended',
    title: 'Complete Curriculum: From Scratch to Expert (All 71 Topics)',
    desc: 'Master every single topic without exception: start with linear algebra & calculus intuition, journey through deep learning, vision, transformers, generative AI, RL, MLOps, and finish all 5 Capstones.',
    path: 'beginner' as LearningPathId,
    start: '/learn/foundations/01-what-is-a-model',
    topicsCount: 71,
    estimatedHours: 54,
  },
  {
    id: 'foundations',
    badge: 'Foundations',
    title: 'Math & Classical ML from Scratch',
    desc: 'I want visual intuition for models, vectorized NumPy, gradients, regression, trees, and neural activations.',
    path: 'beginner' as LearningPathId,
    start: '/learn/foundations/01-what-is-a-model',
    topicsCount: 25,
    estimatedHours: 15,
  },
  {
    id: 'shipping',
    badge: 'Applied Practitioner',
    title: 'Build and Ship ML / LLM Systems',
    desc: 'I already understand basic models and want Transformers, RAG, LoRA fine-tuning, vLLM serving, and production MLOps.',
    path: 'practitioner' as LearningPathId,
    start: '/learn/nlp-transformers/04-self-attention',
    topicsCount: 30,
    estimatedHours: 24,
  },
  {
    id: 'frontier',
    badge: 'Frontier Researcher',
    title: 'Frontier Architectures & Alignment Research',
    desc: 'Take me straight to analytical backpropagation, RoPE/GQA, Flow Matching DiT, RLHF/DPO/GRPO, and Sparse Autoencoders.',
    path: 'researcher' as LearningPathId,
    start: '/learn/nlp-transformers/05-transformer-architecture',
    topicsCount: 20,
    estimatedHours: 18,
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
              className={`cursor-pointer transition-all duration-200 ${
                active
                  ? 'border-accent ring-1 ring-accent bg-accent-soft/20 shadow-sm'
                  : 'hover:border-strong'
              }`}
              onClick={() => setSelectedIdx(idx)}
            >
              <CardHeader className="p-4 pb-2 sm:p-6 sm:pb-2">
                <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex min-w-0 items-start gap-3">
                    <input
                      id={radioId}
                      type="radio"
                      name="onboarding-goal"
                      checked={active}
                      onChange={() => setSelectedIdx(idx)}
                      className="mt-1 h-4 w-4 shrink-0 accent-accent"
                    />
                    <label htmlFor={radioId} className="cursor-pointer min-w-0">
                      <CardTitle className="text-sm font-semibold sm:text-base leading-snug break-words">
                        {goal.title}
                      </CardTitle>
                    </label>
                  </div>
                  <div className="pl-7 sm:pl-0 shrink-0">
                    <Badge variant={goal.badge === 'Recommended' ? 'accent' : 'neutral'}>
                      {goal.badge}
                    </Badge>
                  </div>
                </div>
                <CardDescription className="pl-7 text-xs leading-relaxed sm:text-sm">
                  {goal.desc}
                </CardDescription>
              </CardHeader>
              <CardContent className="flex flex-wrap items-center justify-between gap-2 p-4 pt-0 pl-11 text-xs text-primary-muted sm:p-6 sm:pt-0 sm:pl-12">
                <span className="font-mono text-accent">
                  Starting level: {goal.path}
                </span>
                <span className="tabular-nums">
                  {goal.topicsCount} topics · ~{goal.estimatedHours}h
                </span>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <Link href="/curriculum" className="text-sm text-primary-secondary hover:text-primary">
          Skip quiz and browse curriculum map
        </Link>
        <Button size="lg" onClick={handleStart} className="min-h-[44px] w-full sm:w-auto">
          <span>
            {selected.id === 'complete-mastery'
              ? 'Start Complete Curriculum'
              : `Start ${selected.path} path`}
          </span>
          <ArrowRight className="h-4 w-4" aria-hidden="true" />
        </Button>
      </div>
    </div>
  );
}

