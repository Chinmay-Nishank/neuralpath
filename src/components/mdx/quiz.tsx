'use client';

import * as React from 'react';
import { CheckCircle2, XCircle, HelpCircle, RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useProgress } from '@/components/progress/progress-provider';
import { trackEvent } from '@/lib/analytics';
import { cn } from '@/lib/utils';

export interface QuizQuestion {
  id: string;
  type: 'mcq' | 'fill-blank' | 'code-completion';
  prompt: string;
  codeSnippet?: string;
  options?: string[];
  answer: string | number; // index for mcq, expected trimmed string for fill-blank/code-completion
  acceptableAnswers?: string[];
  explanation: string;
}

export interface QuizProps {
  lessonId?: string;
  title?: string;
  questions: QuizQuestion[];
}

function normalizeAnswer(val: string): string {
  return val.trim().replace(/\s+/g, ' ').toLowerCase();
}

export function Quiz({ lessonId, title = 'Check Your Understanding', questions }: QuizProps) {
  const { markLessonCompleted } = useProgress();
  const [answers, setAnswers] = React.useState<Record<string, string | number>>({});
  const [submitted, setSubmitted] = React.useState(false);

  const isQuestionCorrect = React.useCallback(
    (q: QuizQuestion, userVal: string | number | undefined): boolean => {
      if (userVal === undefined || userVal === '') return false;
      if (q.type === 'mcq') {
        return Number(userVal) === Number(q.answer);
      }
      const normalized = normalizeAnswer(String(userVal));
      const candidates = [String(q.answer), ...(q.acceptableAnswers ?? [])].map(normalizeAnswer);
      return candidates.includes(normalized);
    },
    []
  );

  const score = React.useMemo(() => {
    if (!submitted) return 0;
    return questions.reduce((acc, q) => acc + (isQuestionCorrect(q, answers[q.id]) ? 1 : 0), 0);
  }, [submitted, questions, answers, isQuestionCorrect]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
    const computedScore = questions.reduce(
      (acc, q) => acc + (isQuestionCorrect(q, answers[q.id]) ? 1 : 0),
      0
    );
    if (lessonId) {
      markLessonCompleted(lessonId, computedScore, questions.length);
    }
    trackEvent('quiz_submit', {
      lessonId: lessonId ?? 'unknown',
      score: computedScore,
      total: questions.length,
    });
  };

  const handleReset = () => {
    setAnswers({});
    setSubmitted(false);
  };

  const answeredCount = Object.keys(answers).filter((k) => answers[k] !== '').length;

  return (
    <section
      aria-label={title}
      className="my-8 rounded-md border border-hairline bg-surface p-5 shadow-sm"
    >
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3 border-b border-hairline pb-3">
        <div className="flex items-center gap-2">
          <HelpCircle className="h-4 w-4 text-accent" aria-hidden="true" />
          <h2 className="text-base font-semibold text-primary">{title}</h2>
        </div>
        <div className="flex items-center gap-2">
          {submitted ? (
            <Badge variant={score === questions.length ? 'success' : 'accent'}>
              Score: {score} / {questions.length}
            </Badge>
          ) : (
            <Badge variant="neutral">
              {answeredCount} / {questions.length} answered
            </Badge>
          )}
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {questions.map((q, idx) => {
          const userVal = answers[q.id];
          const correct = submitted ? isQuestionCorrect(q, userVal) : false;

          return (
            <fieldset key={q.id} className="space-y-3 rounded-sm border border-hairline bg-canvas/60 p-4">
              <legend className="px-1 text-sm font-semibold text-primary">
                <span className="mr-1.5 font-mono text-xs text-accent">Q{idx + 1}.</span>
                {q.prompt}
              </legend>

              {q.codeSnippet && (
                <pre className="overflow-x-auto rounded-sm border border-hairline bg-subtle p-3 font-mono text-xs leading-relaxed text-primary">
                  <code>{q.codeSnippet}</code>
                </pre>
              )}

              {q.type === 'mcq' && q.options && (
                <div className="space-y-2" role="radiogroup" aria-label={`Question ${idx + 1} choices`}>
                  {q.options.map((opt, optIdx) => {
                    const selected = Number(userVal) === optIdx;
                    const isAnswer = Number(q.answer) === optIdx;
                    return (
                      <label
                        key={optIdx}
                        className={cn(
                          'flex cursor-pointer items-center gap-3 rounded-sm border px-3 py-2.5 text-sm transition-colors',
                          selected && !submitted && 'border-accent bg-accent-soft/40 text-primary',
                          !selected && !submitted && 'border-hairline bg-surface hover:bg-subtle',
                          submitted && isAnswer && 'border-success bg-success-soft/50 text-primary',
                          submitted && selected && !isAnswer && 'border-danger bg-danger-soft/50 text-primary',
                          submitted && !selected && !isAnswer && 'border-hairline bg-surface opacity-75'
                        )}
                      >
                        <input
                          type="radio"
                          name={`quiz-${q.id}`}
                          value={optIdx}
                          checked={selected}
                          disabled={submitted}
                          onChange={() =>
                            setAnswers((prev) => ({ ...prev, [q.id]: optIdx }))
                          }
                          className="h-4 w-4 accent-accent"
                        />
                        <span className="flex-1">{opt}</span>
                        {submitted && isAnswer && (
                          <CheckCircle2 className="h-4 w-4 shrink-0 text-success" aria-hidden="true" />
                        )}
                        {submitted && selected && !isAnswer && (
                          <XCircle className="h-4 w-4 shrink-0 text-danger" aria-hidden="true" />
                        )}
                      </label>
                    );
                  })}
                </div>
              )}

              {(q.type === 'fill-blank' || q.type === 'code-completion') && (
                <div>
                  <label htmlFor={`input-${q.id}`} className="sr-only">
                    Your answer for question {idx + 1}
                  </label>
                  <input
                    id={`input-${q.id}`}
                    type="text"
                    value={typeof userVal === 'string' ? userVal : ''}
                    disabled={submitted}
                    onChange={(e) =>
                      setAnswers((prev) => ({ ...prev, [q.id]: e.target.value }))
                    }
                    placeholder={
                      q.type === 'code-completion'
                        ? 'Type the missing expression...'
                        : 'Type your short answer...'
                    }
                    className={cn(
                      'h-10 w-full rounded-sm border bg-surface px-3 text-sm text-primary placeholder:text-primary-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent',
                      q.type === 'code-completion' && 'font-mono text-xs',
                      submitted && correct && 'border-success bg-success-soft/30',
                      submitted && !correct && 'border-danger bg-danger-soft/30',
                      !submitted && 'border-strong'
                    )}
                  />
                </div>
              )}

              {submitted && (
                <div
                  className={cn(
                    'flex items-start gap-2 rounded-sm border px-3 py-2.5 text-xs leading-relaxed',
                    correct
                      ? 'border-success/35 bg-success-soft/40 text-primary'
                      : 'border-warning/35 bg-warning-soft/40 text-primary'
                  )}
                >
                  {correct ? (
                    <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-success" aria-hidden="true" />
                  ) : (
                    <XCircle className="mt-0.5 h-4 w-4 shrink-0 text-danger" aria-hidden="true" />
                  )}
                  <div>
                    <span className="font-semibold">
                      {correct ? 'Correct. ' : `Expected: ${q.type === 'mcq' && q.options ? q.options[Number(q.answer)] : String(q.answer)}. `}
                    </span>
                    <span className="text-primary-secondary">{q.explanation}</span>
                  </div>
                </div>
              )}
            </fieldset>
          );
        })}

        <div className="flex flex-wrap items-center justify-between gap-3">
          {!submitted ? (
            <Button type="submit" disabled={answeredCount === 0}>
              Check Answers
            </Button>
          ) : (
            <Button type="button" variant="outline" onClick={handleReset}>
              <RotateCcw className="h-3.5 w-3.5" aria-hidden="true" />
              Try Again
            </Button>
          )}
          <span className="text-xs text-primary-muted">
            Completing the quiz records this lesson in your progress tracker.
          </span>
        </div>
      </form>
    </section>
  );
}

