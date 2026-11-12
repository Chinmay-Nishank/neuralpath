'use client';

import * as React from 'react';
import Link from 'next/link';
import {
  Award,
  Bookmark,
  Flame,
  NotebookPen,
  ArrowRight,
  CheckCircle2,
  Brain,
  Target,
  Download,
  Upload,
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ProgressRing } from '@/components/ui/progress';
import { Button, buttonVariants } from '@/components/ui/button';
import { useProgress } from '@/components/progress/progress-provider';
import { useReview } from '@/components/review/review-provider';
import type { ModuleMeta, SearchableLessonSummary } from '@/lib/content';
import {
  calculateQuizStats,
  getTodayIsoDate,
  validateImportedState,
  type LearningPathId,
} from '@/lib/progress';

export function DashboardClient({
  modules,
  lessons,
  pathLessons,
}: {
  modules: ModuleMeta[];
  lessons: SearchableLessonSummary[];
  pathLessons: Record<LearningPathId, string[]>;
}) {
  const { state, hydrated, streakDays, importLearningState } = useProgress();
  const { cardIndex, dueCount, hydrated: reviewHydrated } = useReview();
  const fileInputRef = React.useRef<HTMLInputElement | null>(null);
  const [backupNotice, setBackupNotice] = React.useState<{
    kind: 'ok' | 'err';
    text: string;
  } | null>(null);

  const lessonMap = React.useMemo(
    () => new Map(lessons.map((l) => [l.routeId, l])),
    [lessons]
  );

  const completedIds = Object.keys(state.completedLessons);
  const lastVisited = state.lastVisitedLesson
    ? lessonMap.get(state.lastVisitedLesson)
    : lessons[0];

  const quizStats = React.useMemo(
    () => calculateQuizStats(state.completedLessons),
    [state.completedLessons]
  );

  const today = React.useMemo(() => getTodayIsoDate(), []);

  const handleExportBackup = () => {
    const blob = new Blob([JSON.stringify(state, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `neuralpath-progress-${today}.json`;
    link.click();
    URL.revokeObjectURL(url);
    setBackupNotice({ kind: 'ok', text: 'Exported local progress JSON backup.' });
  };

  const handleRestoreFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    try {
      const text = await file.text();
      const parsed = JSON.parse(text) as unknown;
      const valid = validateImportedState(parsed);
      if (!valid) {
        setBackupNotice({
          kind: 'err',
          text: 'File is not a valid NeuralPath progress backup.',
        });
        return;
      }
      importLearningState(valid);
      setBackupNotice({ kind: 'ok', text: 'Progress backup restored cleanly.' });
    } catch {
      setBackupNotice({ kind: 'err', text: 'Unable to parse JSON backup file.' });
    }
  };

  const earnedBadges = modules.filter((mod) => {
    const modLessons = lessons.filter((l) => l.module === mod.id);
    return (
      modLessons.length > 0 &&
      modLessons.every((l) => Boolean(state.completedLessons[l.routeId]))
    );
  });

  const nextRecommended = lessons
    .filter((l) => !state.completedLessons[l.routeId])
    .slice(0, 4);

  const noteEntries = Object.entries(state.notes).filter(([, content]) => content.trim().length > 0);

  return (
    <div className="mx-auto max-w-[1280px] space-y-8 px-4 py-10 sm:px-6">
      <div className="flex flex-wrap items-end justify-between gap-4 border-b border-hairline pb-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-primary">Your Learning Dashboard</h1>
          <p className="mt-1 text-sm text-primary-secondary">
            Saved locally in your browser. Optional GitHub + Postgres sync activates automatically when configured.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 rounded-md border border-hairline bg-surface px-3.5 py-2 text-xs">
            <Flame className="h-4 w-4 text-accent" aria-hidden="true" />
            <span className="font-mono font-semibold">{hydrated ? streakDays : 0} day streak</span>
          </div>
          <div className="flex items-center gap-2 rounded-md border border-hairline bg-surface px-3.5 py-2 text-xs">
            <CheckCircle2 className="h-4 w-4 text-success" aria-hidden="true" />
            <span className="font-mono font-semibold">
              {completedIds.length} / {lessons.length} lessons
            </span>
          </div>
        </div>
      </div>

      {/* Continue where you left off + Path Rings */}
      <div className="grid gap-6 lg:grid-cols-[1.2fr_1fr]">
        <Card className="flex flex-col justify-between">
          <CardHeader>
            <Badge variant="accent" className="w-fit">Continue where you left off</Badge>
            <CardTitle className="mt-2 text-xl">
              {lastVisited?.title ?? 'What Is a Model?'}
            </CardTitle>
            <CardDescription>{lastVisited?.summary}</CardDescription>
          </CardHeader>
          <CardContent className="flex items-center justify-between">
            <span className="font-mono text-xs text-primary-muted">
              {lastVisited?.moduleTitle} · {lastVisited?.estimatedMinutes ?? 12} min
            </span>
            <Link
              href={lastVisited?.url ?? '/learn/foundations/01-what-is-a-model'}
              className={buttonVariants({ variant: 'primary', size: 'sm' })}
            >
              <span>Resume Lesson</span>
              <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
            </Link>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Path Progress</CardTitle>
            <CardDescription>Completion across the three curated tracks</CardDescription>
          </CardHeader>
          <CardContent className="grid grid-cols-3 gap-4 pt-2">
            {(['beginner', 'practitioner', 'researcher'] as const).map((pathId) => {
              const ids = pathLessons[pathId] ?? [];
              const done = ids.filter((id) => Boolean(state.completedLessons[id])).length;
              const pct = ids.length > 0 ? Math.round((done / ids.length) * 100) : 0;
              return (
                <div key={pathId} className="flex flex-col items-center gap-2 text-center">
                  <ProgressRing value={pct} label={`${pathId} path progress`} />
                  <div>
                    <div className="text-xs font-semibold capitalize text-primary">{pathId}</div>
                    <div className="font-mono text-[11px] text-primary-muted">
                      {done}/{ids.length}
                    </div>
                  </div>
                </div>
              );
            })}
          </CardContent>
        </Card>
      </div>

      {/* Recommended Next + Earned Badges */}
      <div className="grid gap-6 lg:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Target className="h-4 w-4 text-accent" aria-hidden="true" />
              Quiz Mastery
            </CardTitle>
            <CardDescription>Best recorded score per lesson check</CardDescription>
          </CardHeader>
          <CardContent className="space-y-1">
            <div className="font-mono text-2xl font-bold text-primary">
              {quizStats.accuracyPercent !== null ? `${quizStats.accuracyPercent}%` : '—'}
            </div>
            <p className="text-xs text-primary-secondary">
              {quizStats.totalQuestions > 0
                ? `${quizStats.totalCorrect} / ${quizStats.totalQuestions} questions across ${quizStats.attemptedQuizzes} quiz${quizStats.attemptedQuizzes === 1 ? '' : 'zes'}`
                : 'Submit any lesson quiz to track mastery accuracy.'}
            </p>
          </CardContent>
        </Card>

        <Card className="flex flex-col justify-between">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Brain className="h-4 w-4 text-accent" aria-hidden="true" />
              Active-Recall Queue
            </CardTitle>
            <CardDescription>FSRS spaced-repetition deck from completed lessons</CardDescription>
          </CardHeader>
          <CardContent className="flex items-end justify-between gap-3">
            <div>
              <div className="font-mono text-2xl font-bold text-primary">
                {hydrated && reviewHydrated ? `${dueCount} due` : '—'}
              </div>
              <p className="text-xs text-primary-secondary">
                {cardIndex.length} authored review cards
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Link
                href="/practice"
                className={buttonVariants({ variant: 'ghost', size: 'sm' })}
              >
                Mixed Practice
              </Link>
              <Link
                href="/review"
                className={buttonVariants({ variant: 'outline', size: 'sm' })}
              >
                <span>Review Now</span>
                <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
              </Link>
            </div>
          </CardContent>
        </Card>

        <Card className="flex flex-col justify-between">
          <CardHeader>
            <CardTitle className="text-base">Portable Progress Backup</CardTitle>
            <CardDescription>
              Export or restore streaks, quiz scores, flashcards, and notes as JSON.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-2.5">
            <div className="flex flex-wrap gap-2">
              <Button type="button" variant="outline" size="sm" onClick={handleExportBackup}>
                <Download className="h-3.5 w-3.5" aria-hidden="true" />
                <span>Export JSON</span>
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => fileInputRef.current?.click()}
              >
                <Upload className="h-3.5 w-3.5" aria-hidden="true" />
                <span>Restore Backup</span>
              </Button>
              <input
                ref={fileInputRef}
                type="file"
                accept=".json,application/json"
                aria-label="Restore NeuralPath progress JSON backup"
                className="sr-only"
                onChange={handleRestoreFile}
              />
            </div>
            {backupNotice && (
              <p
                role={backupNotice.kind === 'err' ? 'alert' : 'status'}
                className={
                  backupNotice.kind === 'err'
                    ? 'text-xs font-medium text-danger'
                    : 'text-xs font-medium text-success'
                }
              >
                {backupNotice.text}
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Recommended Next + Earned Badges */}
      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Recommended Next Lessons</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2.5">
            {nextRecommended.map((lesson) => (
              <Link
                key={lesson.routeId}
                href={lesson.url}
                className="flex items-center justify-between rounded-sm border border-hairline bg-canvas p-3 text-sm transition-colors hover:border-accent"
              >
                <div>
                  <div className="font-medium text-primary">{lesson.title}</div>
                  <div className="text-xs text-primary-muted">
                    {lesson.moduleTitle} · {lesson.estimatedMinutes} min
                  </div>
                </div>
                <Badge variant="neutral">{lesson.level}</Badge>
              </Link>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Award className="h-4 w-4 text-accent" aria-hidden="true" />
              Module Completion Badges ({earnedBadges.length}/{modules.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {earnedBadges.length === 0 ? (
              <p className="text-xs text-primary-secondary">
                Complete every lesson in a module to earn its completion badge.
              </p>
            ) : (
              <div className="flex flex-wrap gap-2">
                {earnedBadges.map((b) => (
                  <Badge key={b.id} variant="success">
                    {b.badgeTitle} ({b.shortTitle})
                  </Badge>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Bookmarks & Notes */}
      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bookmark className="h-4 w-4 text-accent" aria-hidden="true" />
              Bookmarked Lessons ({state.bookmarks.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {state.bookmarks.length === 0 ? (
              <p className="text-xs text-primary-secondary">
                Use the Save button on any lesson to bookmark it for quick review.
              </p>
            ) : (
              state.bookmarks.map((id) => {
                const l = lessonMap.get(id);
                if (!l) return null;
                return (
                  <Link
                    key={id}
                    href={l.url}
                    className="block rounded-sm border border-hairline p-2.5 text-sm font-medium text-primary hover:border-accent"
                  >
                    {l.title}
                  </Link>
                );
              })
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <NotebookPen className="h-4 w-4 text-accent" aria-hidden="true" />
              Your Lesson Notes ({noteEntries.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2.5">
            {noteEntries.length === 0 ? (
              <p className="text-xs text-primary-secondary">
                Open the Notes scratchpad inside any lesson to capture formulas or insights.
              </p>
            ) : (
              noteEntries.map(([routeId, text]) => {
                const l = lessonMap.get(routeId);
                return (
                  <div key={routeId} className="rounded-sm border border-hairline bg-canvas p-3">
                    <Link
                      href={l?.url ?? `/learn/${routeId}`}
                      className="text-xs font-semibold text-accent hover:underline"
                    >
                      {l?.title ?? routeId}
                    </Link>
                    <p className="mt-1 whitespace-pre-wrap text-xs text-primary-secondary">{text}</p>
                  </div>
                );
              })
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

