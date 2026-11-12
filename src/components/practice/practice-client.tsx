'use client';

import * as React from 'react';
import Link from 'next/link';
import {
  Shuffle,
  CheckCircle2,
  XCircle,
  ArrowRight,
  RotateCcw,
  Sparkles,
  Brain,
  BookOpen,
} from 'lucide-react';
import {
  buildInterleavedSession,
  type PracticeQuestionItem,
} from '@/lib/practice-session';
import { useProgress } from '@/components/progress/progress-provider';
import { useReview } from '@/components/review/review-provider';
import { StudyTimer } from '@/components/layout/study-timer';
import { Badge } from '@/components/ui/badge';
import { Button, buttonVariants } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { cn } from '@/lib/utils';

type ScopeMode = 'all' | 'completed';
type LevelFilter = 'all' | 'beginner' | 'practitioner' | 'researcher';

function normalizeAnswer(val: string): string {
  return val.trim().replace(/\s+/g, ' ').toLowerCase();
}

function gradeItem(item: PracticeQuestionItem, userVal: string | number | undefined): boolean {
  const q = item.question;
  if (userVal === undefined) return false;
  if (q.type === 'mcq') return Number(userVal) === Number(q.answer);
  const norm = normalizeAnswer(String(userVal));
  if (!norm) return false;
  if (norm === normalizeAnswer(String(q.answer))) return true;
  return (q.acceptableAnswers ?? []).some((acc) => normalizeAnswer(acc) === norm);
}

export function PracticeClient({ bank }: { bank: PracticeQuestionItem[] }) {
  const { state } = useProgress();
  const { dueCount } = useReview();
  const [scope, setScope] = React.useState<ScopeMode>('all');
  const [levelFilter, setLevelFilter] = React.useState<LevelFilter>('all');
  const [sessionLength, setSessionLength] = React.useState(6);
  const [seed, setSeed] = React.useState(1);

  const [sessionItems, setSessionItems] = React.useState<PracticeQuestionItem[]>([]);
  const [cursor, setCursor] = React.useState(0);
  const [answers, setAnswers] = React.useState<Record<string, string | number>>({});
  const [checked, setChecked] = React.useState<Record<string, boolean>>({});
  const [finished, setFinished] = React.useState(false);

  const filteredPool = React.useMemo(() => {
    return bank.filter((item) => {
      if (scope === 'completed' && !state.completedLessons[item.lessonSlug]) return false;
      if (levelFilter !== 'all' && item.level !== levelFilter) return false;
      return true;
    });
  }, [bank, scope, levelFilter, state.completedLessons]);

  const startSession = React.useCallback(
    (nextSeed: number) => {
      const next = buildInterleavedSession(filteredPool, sessionLength, nextSeed);
      setSessionItems(next);
      setCursor(0);
      setAnswers({});
      setChecked({});
      setFinished(false);
    },
    [filteredPool, sessionLength]
  );

  React.useEffect(() => {
    startSession(seed);
  }, [startSession, seed]);

  const currentItem = sessionItems[cursor];
  const isChecked = currentItem ? Boolean(checked[currentItem.uid]) : false;
  const userAnswer = currentItem ? answers[currentItem.uid] : undefined;
  const isCorrect = currentItem && isChecked ? gradeItem(currentItem, userAnswer) : false;

  const totalScore = React.useMemo(() => {
    return sessionItems.filter((it) => checked[it.uid] && gradeItem(it, answers[it.uid])).length;
  }, [sessionItems, checked, answers]);

  const missedItems = React.useMemo(() => {
    return sessionItems.filter((it) => checked[it.uid] && !gradeItem(it, answers[it.uid]));
  }, [sessionItems, checked, answers]);

  const handleCheck = () => {
    if (!currentItem) return;
    setChecked((prev) => ({ ...prev, [currentItem.uid]: true }));
  };

  const handleNext = () => {
    if (cursor + 1 >= sessionItems.length) {
      setFinished(true);
    } else {
      setCursor((c) => c + 1);
    }
  };

  return (
    <div className="mx-auto max-w-[900px] space-y-6 px-4 py-8 sm:px-6 sm:py-10">
      <div className="flex flex-wrap items-end justify-between gap-4 border-b border-hairline pb-5">
        <div className="space-y-1.5">
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-accent">
            <Shuffle className="h-4 w-4" aria-hidden="true" />
            Interleaved Mixed Practice
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-primary">
            Cross-Topic Practice Arena
          </h1>
          <p className="max-w-2xl text-sm text-primary-secondary">
            Research shows interleaving questions across distinct ML topics strengthens concept
            discrimination far more than practicing one topic in isolation.
          </p>
        </div>

        <StudyTimer />
      </div>

      {/* Session controls */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap gap-2" role="group" aria-label="Practice question pool">
          <Button
            type="button"
            size="md"
            variant={scope === 'all' ? 'primary' : 'outline'}
            aria-pressed={scope === 'all'}
            onClick={() => setScope('all')}
            className="min-h-[44px]"
          >
            All Modules ({bank.length} Qs)
          </Button>
          <Button
            type="button"
            size="md"
            variant={scope === 'completed' ? 'primary' : 'outline'}
            aria-pressed={scope === 'completed'}
            onClick={() => setScope('completed')}
            className="min-h-[44px]"
          >
            Completed Lessons Only
          </Button>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Select
            placeholder="Difficulty level"
            value={levelFilter}
            onValueChange={(v) => setLevelFilter(v as LevelFilter)}
            options={[
              { value: 'all', label: 'All Levels' },
              { value: 'beginner', label: 'Beginner' },
              { value: 'practitioner', label: 'Practitioner' },
              { value: 'researcher', label: 'Researcher' },
            ]}
          />
          <Select
            placeholder="Session size"
            value={String(sessionLength)}
            onValueChange={(v) => setSessionLength(Number(v))}
            options={[
              { value: '5', label: '5 questions' },
              { value: '6', label: '6 questions' },
              { value: '10', label: '10 questions' },
            ]}
          />
          <Button
            type="button"
            variant="outline"
            onClick={() => setSeed((s) => s + 1)}
            className="min-h-[44px]"
            aria-label="Shuffle new interleaved set"
          >
            <RotateCcw className="h-4 w-4" aria-hidden="true" />
            <span>New Mix</span>
          </Button>
        </div>
      </div>

      {/* Main Content */}
      {sessionItems.length === 0 ? (
        <Card className="p-8 text-center">
          <BookOpen className="mx-auto h-10 w-10 text-accent" aria-hidden="true" />
          <h2 className="mt-3 text-lg font-semibold text-primary">
            No matching questions in this filter
          </h2>
          <p className="mt-1.5 text-sm text-primary-secondary">
            {scope === 'completed'
              ? 'Complete a lesson first or switch to All Modules to practice across all 10 tracks.'
              : 'Try broadening the difficulty level filter.'}
          </p>
          <div className="mt-5 flex justify-center gap-2">
            <Button
              type="button"
              variant="primary"
              onClick={() => {
                setScope('all');
                setLevelFilter('all');
              }}
              className="min-h-[44px]"
            >
              Use All Curriculum Topics
            </Button>
          </div>
        </Card>
      ) : finished ? (
        <Card className="space-y-6 p-6 sm:p-8">
          <div className="flex items-start gap-3">
            <CheckCircle2 className="mt-0.5 h-6 w-6 shrink-0 text-success" aria-hidden="true" />
            <div>
              <h2 className="text-2xl font-bold text-primary">Mixed practice complete</h2>
              <p className="mt-1 text-sm text-primary-secondary">
                Score:{' '}
                <span className="font-mono font-semibold text-primary">
                  {totalScore} / {sessionItems.length}
                </span>{' '}
                ({Math.round((totalScore / sessionItems.length) * 100)}%) across interleaved
                modules.
              </p>
            </div>
          </div>

          {missedItems.length > 0 && (
            <div className="space-y-2.5 rounded-md border border-hairline bg-canvas p-4">
              <div className="text-xs font-semibold uppercase tracking-wider text-primary-secondary">
                Lessons to revisit ({missedItems.length})
              </div>
              <div className="space-y-2">
                {missedItems.map((m) => (
                  <div
                    key={m.uid}
                    className="flex flex-wrap items-center justify-between gap-2 rounded-sm border border-hairline bg-surface px-3 py-2 text-xs"
                  >
                    <div>
                      <span className="font-medium text-primary">{m.lessonTitle}</span>
                      <span className="ml-2 text-primary-secondary">({m.moduleTitle})</span>
                    </div>
                    <Link href={m.lessonUrl} className="font-medium text-accent hover:underline">
                      Open lesson →
                    </Link>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="flex flex-wrap items-center justify-between gap-3 border-t border-hairline pt-4">
            <Button
              type="button"
              variant="primary"
              onClick={() => setSeed((s) => s + 1)}
              className="min-h-[44px]"
            >
              <Shuffle className="h-4 w-4" aria-hidden="true" />
              <span>Practice Another Mixed Set</span>
            </Button>
            {dueCount > 0 && (
              <Link
                href="/review"
                className={cn(buttonVariants({ variant: 'outline', size: 'md' }), 'min-h-[44px]')}
              >
                <Brain className="h-4 w-4 text-accent" aria-hidden="true" />
                <span>Review {dueCount} Due Flashcards</span>
              </Link>
            )}
          </div>
        </Card>
      ) : currentItem ? (
        <Card className="space-y-5 p-6 sm:p-8">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-hairline pb-3">
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="accent">{currentItem.moduleTitle}</Badge>
              <Badge variant="neutral">{currentItem.level}</Badge>
            </div>
            <span className="font-mono text-xs text-primary-secondary">
              Question {cursor + 1} of {sessionItems.length}
            </span>
          </div>

          <div className="space-y-3">
            <p className="text-base font-semibold leading-relaxed text-primary">
              {currentItem.question.prompt}
            </p>
            {currentItem.question.codeSnippet && (
              <pre className="overflow-x-auto rounded-sm border border-hairline bg-[#0F172A] px-3.5 py-2.5 font-mono text-xs text-slate-100">
                <code>{currentItem.question.codeSnippet}</code>
              </pre>
            )}
          </div>

          {currentItem.question.type === 'mcq' && currentItem.question.options ? (
            <div className="space-y-2">
              {currentItem.question.options.map((opt, idx) => {
                const chosen = Number(userAnswer) === idx;
                const rightOpt = Number(currentItem.question.answer) === idx;
                return (
                  <label
                    key={idx}
                    className={cn(
                      'flex min-h-[44px] cursor-pointer items-center gap-2.5 rounded-sm border px-3.5 py-2.5 text-sm transition-colors',
                      !isChecked && chosen && 'border-accent bg-accent-soft/50',
                      !isChecked && !chosen && 'border-hairline bg-canvas hover:border-strong',
                      isChecked && rightOpt && 'border-success bg-success-soft/50',
                      isChecked && chosen && !rightOpt && 'border-danger bg-danger-soft/50'
                    )}
                  >
                    <input
                      type="radio"
                      name={`practice-${currentItem.uid}`}
                      checked={chosen}
                      disabled={isChecked}
                      onChange={() =>
                        setAnswers((prev) => ({ ...prev, [currentItem.uid]: idx }))
                      }
                      className="h-4 w-4 accent-[var(--accent)]"
                    />
                    <span>{opt}</span>
                  </label>
                );
              })}
            </div>
          ) : (
            <Input
              type="text"
              aria-label="Your answer"
              value={typeof userAnswer === 'string' ? userAnswer : ''}
              disabled={isChecked}
              placeholder="Type your answer..."
              onChange={(e) =>
                setAnswers((prev) => ({ ...prev, [currentItem.uid]: e.target.value }))
              }
              className="h-11 font-mono text-sm"
            />
          )}

          {isChecked && (
            <div
              className={cn(
                'flex items-start gap-2.5 rounded-sm border p-3.5 text-xs leading-relaxed',
                isCorrect
                  ? 'border-success/40 bg-success-soft/40 text-primary'
                  : 'border-warning/40 bg-warning-soft/40 text-primary'
              )}
            >
              {isCorrect ? (
                <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-success" aria-hidden="true" />
              ) : (
                <XCircle className="mt-0.5 h-4 w-4 shrink-0 text-danger" aria-hidden="true" />
              )}
              <div className="space-y-1">
                <div>
                  <span className="font-semibold">
                    {isCorrect
                      ? 'Correct. '
                      : `Expected: ${
                          currentItem.question.type === 'mcq' && currentItem.question.options
                            ? currentItem.question.options[Number(currentItem.question.answer)]
                            : String(currentItem.question.answer)
                        }. `}
                  </span>
                  <span className="text-primary-secondary">
                    {currentItem.question.explanation}
                  </span>
                </div>
                <Link
                  href={currentItem.lessonUrl}
                  className="inline-flex items-center gap-1 font-medium text-accent hover:underline"
                >
                  <Sparkles className="h-3 w-3" aria-hidden="true" />
                  <span>Source lesson: {currentItem.lessonTitle}</span>
                </Link>
              </div>
            </div>
          )}

          <div className="flex flex-wrap items-center justify-between gap-3 border-t border-hairline pt-4">
            <Link
              href={currentItem.lessonUrl}
              className="text-xs text-primary-secondary hover:text-accent hover:underline"
            >
              Lesson: {currentItem.lessonTitle}
            </Link>

            {!isChecked ? (
              <Button
                type="button"
                variant="primary"
                disabled={userAnswer === undefined || String(userAnswer).trim() === ''}
                onClick={handleCheck}
                className="min-h-[44px]"
              >
                Check Answer
              </Button>
            ) : (
              <Button type="button" variant="primary" onClick={handleNext} className="min-h-[44px]">
                <span>
                  {cursor + 1 >= sessionItems.length ? 'Finish Mixed Set' : 'Next Topic Question'}
                </span>
                <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </Button>
            )}
          </div>
        </Card>
      ) : null}
    </div>
  );
}

