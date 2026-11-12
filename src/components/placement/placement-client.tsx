'use client';

import * as React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  ArrowRight,
  CheckCircle2,
  XCircle,
  RotateCcw,
  Compass,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button, buttonVariants } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { useProgress } from '@/components/progress/progress-provider';
import { cn } from '@/lib/utils';
import {
  PLACEMENT_QUESTIONS,
  evaluatePlacement,
  type PlacementResult,
} from '@/lib/placement';
import { getPathwayById } from '@/lib/pathways';

export function PlacementClient() {
  const router = useRouter();
  const { setActivePath, completeOnboarding } = useProgress();

  const [currentIndex, setCurrentIndex] = React.useState(0);
  const [selectedAnswers, setSelectedAnswers] = React.useState<number[]>([]);
  const [currentSelection, setCurrentSelection] = React.useState<number | null>(null);
  const [showExplanation, setShowExplanation] = React.useState(false);
  const [isCompleted, setIsCompleted] = React.useState(false);

  const currentQ = PLACEMENT_QUESTIONS[currentIndex]!;
  const isCorrect = currentSelection === currentQ?.correctIndex;

  const handleSelectOption = (idx: number) => {
    if (showExplanation) return;
    setCurrentSelection(idx);
    setShowExplanation(true);
  };

  const handleNext = () => {
    if (currentSelection === null) return;
    const nextAnswers = [...selectedAnswers, currentSelection];
    setSelectedAnswers(nextAnswers);
    setCurrentSelection(null);
    setShowExplanation(false);

    if (currentIndex + 1 < PLACEMENT_QUESTIONS.length) {
      setCurrentIndex((prev) => prev + 1);
    } else {
      setIsCompleted(true);
    }
  };

  const handleReset = () => {
    setCurrentIndex(0);
    setSelectedAnswers([]);
    setCurrentSelection(null);
    setShowExplanation(false);
    setIsCompleted(false);
  };

  const result: PlacementResult = React.useMemo(() => {
    return evaluatePlacement(selectedAnswers);
  }, [selectedAnswers]);

  const recommendedPathway = React.useMemo(() => {
    return getPathwayById(result.recommendedPathwayId);
  }, [result.recommendedPathwayId]);

  const handleEnrollAndStart = () => {
    setActivePath(result.level);
    completeOnboarding(result.level);
    router.push(result.recommendedStartUrl);
  };

  return (
    <div className="mx-auto max-w-3xl space-y-8 px-4 py-10 sm:px-6">
      {/* Page Header */}
      <div className="space-y-2">
        <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-accent">
          <Compass className="h-4 w-4" aria-hidden="true" />
          Diagnostic Knowledge Check
        </div>
        <h1 className="text-3xl font-bold tracking-tight text-primary">
          From Scratch to Frontier AI: Find Your Starting Point
        </h1>
        <p className="text-sm text-primary-secondary">
          Take this 10-question placement check covering first-principles math, classical ML,
          deep neural networks, transformers, and modern alignment. Get a personalized roadmap tailored to your exact level.
        </p>
      </div>

      {!isCompleted ? (
        <Card className="border-hairline shadow-sm">
          <CardHeader className="space-y-3 pb-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <Badge variant="accent">{currentQ.tierLabel}</Badge>
                <span className="text-xs text-primary-secondary">
                  Question {currentIndex + 1} of {PLACEMENT_QUESTIONS.length}
                </span>
              </div>
              <span className="font-mono text-xs text-primary-secondary">
                Tier {currentQ.tier} / 5
              </span>
            </div>

            {/* Linear Progress Bar */}
            <div className="h-1.5 w-full overflow-hidden rounded-full bg-subtle">
              <div
                className="h-full bg-accent transition-all duration-300"
                style={{
                  width: `${((currentIndex + (showExplanation ? 1 : 0)) / PLACEMENT_QUESTIONS.length) * 100}%`,
                }}
              />
            </div>

            <CardTitle className="text-lg font-semibold text-primary sm:text-xl pt-2">
              {currentQ.question}
            </CardTitle>
          </CardHeader>

          <CardContent className="space-y-3">
            <div className="space-y-2" role="radiogroup" aria-label="Question options">
              {currentQ.options.map((opt, idx) => {
                const isChosen = currentSelection === idx;
                const isRightAnswer = idx === currentQ.correctIndex;

                let optionStyles = 'border-hairline hover:border-strong hover:bg-subtle/50';
                if (showExplanation) {
                  if (isRightAnswer) {
                    optionStyles = 'border-emerald-500 bg-emerald-500/10 text-emerald-900 dark:text-emerald-100 font-medium';
                  } else if (isChosen && !isRightAnswer) {
                    optionStyles = 'border-red-500 bg-red-500/10 text-red-900 dark:text-red-100';
                  } else {
                    optionStyles = 'opacity-60 border-hairline';
                  }
                }

                return (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => handleSelectOption(idx)}
                    disabled={showExplanation}
                    className={`w-full text-left rounded-md border p-3.5 text-sm transition-colors ${optionStyles} flex items-start gap-3`}
                  >
                    <span className="inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full border text-xs font-mono">
                      {String.fromCharCode(65 + idx)}
                    </span>
                    <span className="flex-1">{opt.text}</span>
                    {showExplanation && isRightAnswer && (
                      <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0 mt-0.5" aria-hidden="true" />
                    )}
                    {showExplanation && isChosen && !isRightAnswer && (
                      <XCircle className="h-4 w-4 text-red-500 shrink-0 mt-0.5" aria-hidden="true" />
                    )}
                  </button>
                );
              })}
            </div>

            {/* Instant Pedagogical Explanation */}
            {showExplanation && (
              <div
                className={`mt-4 rounded-md p-3.5 text-xs ${
                  isCorrect
                    ? 'border border-emerald-500/30 bg-emerald-500/10 text-emerald-950 dark:text-emerald-200'
                    : 'border border-red-500/30 bg-red-500/10 text-red-950 dark:text-red-200'
                }`}
              >
                <div className="font-semibold mb-1">
                  {isCorrect ? 'Correct!' : 'Incorrect'}
                </div>
                <div>{currentQ.options[currentQ.correctIndex]?.explanation}</div>
              </div>
            )}
          </CardContent>

          <CardFooter className="flex items-center justify-between border-t border-hairline pt-4">
            <button
              type="button"
              onClick={handleReset}
              className="text-xs text-primary-secondary hover:text-primary inline-flex items-center gap-1"
            >
              <RotateCcw className="h-3.5 w-3.5" aria-hidden="true" />
              <span>Restart Quiz</span>
            </button>

            {showExplanation ? (
              <Button onClick={handleNext} size="sm">
                <span>
                  {currentIndex + 1 < PLACEMENT_QUESTIONS.length
                    ? 'Next Question'
                    : 'View Diagnostic Results'}
                </span>
                <ArrowRight className="h-3.5 w-3.5 ml-1" aria-hidden="true" />
              </Button>
            ) : (
              <span className="text-xs text-primary-secondary">
                Select an answer to see explanation
              </span>
            )}
          </CardFooter>
        </Card>
      ) : (
        /* Results View */
        <div className="space-y-6">
          <Card className="border-accent bg-accent-soft/10">
            <CardHeader className="space-y-2">
              <div className="flex items-center justify-between">
                <Badge variant="accent" className="text-xs">
                  Diagnostic Result
                </Badge>
                <span className="font-mono text-sm font-semibold text-accent">
                  Score: {result.score} / {result.total} ({Math.round((result.score / result.total) * 100)}%)
                </span>
              </div>
              <CardTitle className="text-2xl font-bold text-primary">
                {result.title}
              </CardTitle>
              <CardDescription className="text-sm text-primary-secondary">
                {result.summary}
              </CardDescription>
            </CardHeader>

            <CardContent className="space-y-4 pt-0">
              {recommendedPathway && (
                <div className="rounded-md border border-hairline bg-surface p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold uppercase tracking-wider text-accent">
                      Recommended Track
                    </span>
                    <span className="text-xs text-primary-secondary">
                      ~{recommendedPathway.estimatedHours} hours
                    </span>
                  </div>
                  <h3 className="text-lg font-bold text-primary">
                    {recommendedPathway.title}
                  </h3>
                  <p className="text-xs text-primary-secondary">
                    {recommendedPathway.tagline}
                  </p>

                  <div className="pt-2 border-t border-hairline space-y-1.5">
                    <span className="text-xs font-semibold text-primary">
                      Recommended First Lesson:
                    </span>
                    <div className="text-xs text-primary-secondary font-mono">
                      {result.recommendedModuleTitle}
                    </div>
                  </div>
                </div>
              )}
            </CardContent>

            <CardFooter className="flex flex-wrap items-center justify-between gap-3 border-t border-hairline pt-4">
              <Button variant="outline" size="sm" onClick={handleReset}>
                <RotateCcw className="h-3.5 w-3.5 mr-1" aria-hidden="true" />
                <span>Retake Assessment</span>
              </Button>

              <div className="flex flex-wrap items-center gap-2">
                <Link
                  href="/curriculum"
                  className={cn(buttonVariants({ variant: 'outline', size: 'sm' }))}
                >
                  <span>Browse Full Map</span>
                </Link>
                <Button size="sm" onClick={handleEnrollAndStart}>
                  <span>Enroll & Start Track</span>
                  <ArrowRight className="h-3.5 w-3.5 ml-1" aria-hidden="true" />
                </Button>
              </div>
            </CardFooter>
          </Card>
        </div>
      )}
    </div>
  );
}
