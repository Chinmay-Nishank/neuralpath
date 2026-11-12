'use client';

import * as React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  ArrowLeft,
  ArrowRight,
  BookOpen,
  Brain,
  CheckCircle2,
  Download,
  Eye,
  RotateCcw,
  Settings2,
  Upload,
  XCircle,
} from 'lucide-react';
import type { Card } from '@/lib/card-schema';
import {
  MAX_NEW_CARDS_PER_DAY,
  MIN_NEW_CARDS_PER_DAY,
  countTomorrowDueCards,
  createInitialCardState,
  formatNextReviewCountdown,
  getEarliestNextReviewDate,
  scheduleAllRatings,
  type CardProgressState,
  type SrsRating,
} from '@/lib/srs';
import { useReview, type UndoReviewSnapshot } from '@/components/review/review-provider';
import { useProgress } from '@/components/progress/progress-provider';
import { usePrefersReducedMotion } from '@/components/viz/use-reduced-motion';
import { Badge } from '@/components/ui/badge';
import { Button, buttonVariants } from '@/components/ui/button';
import { Card as UiCard } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';

export interface ReviewLessonInfo {
  routeId: string;
  title: string;
  url: string;
}

interface SessionAttempt {
  cardId: string;
  lessonSlug: string;
  rating: SrsRating;
  wasCorrect: boolean;
}

interface UndoStackItem {
  snapshot: UndoReviewSnapshot;
  prevQueueIds: string[];
  prevCursor: number;
  prevRevealed: boolean;
  prevSelectedOption: number | null;
}

const CARD_TYPE_LABELS: Record<Card['type'], string> = {
  recall: 'Active Recall',
  mcq: 'Multiple Choice',
  cloze: 'Fill the Blank',
};

const RATING_KEYS: readonly SrsRating[] = [1, 2, 3, 4];
const OPTION_LETTERS = ['A', 'B', 'C', 'D', 'E', 'F'];

function renderClozeFront(front: string, back: string, revealed: boolean) {
  const parts = front.split(/_{3,}/);
  if (parts.length < 2) {
    return <span>{front}</span>;
  }
  return (
    <>
      {parts.map((part, idx) => (
        <React.Fragment key={idx}>
          <span>{part}</span>
          {idx < parts.length - 1 && (
            <span
              className={cn(
                'mx-1 inline-block rounded-sm border px-2 py-0.5 font-mono text-sm align-baseline',
                revealed
                  ? 'border-accent bg-accent-soft font-semibold text-accent'
                  : 'border-strong bg-subtle text-primary-secondary'
              )}
            >
              {revealed ? back : '_____'}
            </span>
          )}
        </React.Fragment>
      ))}
    </>
  );
}

function findWeakestLessonSlug(attempts: SessionAttempt[]): string | null {
  if (attempts.length === 0) return null;
  const stats = new Map<string, { total: number; wrongOrLapse: number; sumRating: number }>();

  for (const a of attempts) {
    const cur = stats.get(a.lessonSlug) ?? { total: 0, wrongOrLapse: 0, sumRating: 0 };
    cur.total += 1;
    if (!a.wasCorrect || a.rating <= 2) {
      cur.wrongOrLapse += 1;
    }
    cur.sumRating += a.rating;
    stats.set(a.lessonSlug, cur);
  }

  let weakest: string | null = null;
  let worstScore = Infinity;

  for (const [slug, s] of stats.entries()) {
    const avg = s.sumRating / s.total - s.wrongOrLapse * 0.5;
    if (avg < worstScore) {
      worstScore = avg;
      weakest = slug;
    }
  }
  return weakest;
}

export function ReviewClient({
  cards,
  lessons,
}: {
  cards: Card[];
  lessons: ReviewLessonInfo[];
}) {
  const router = useRouter();
  const prefersReducedMotion = usePrefersReducedMotion();
  const { state: progressState } = useProgress();
  const {
    cardIndex,
    storeData,
    hydrated,
    dueCardIds,
    rateCard,
    restoreSnapshot,
    updateSettings,
    exportReviewJson,
    importReviewJson,
    resetReviewData,
  } = useReview();

  const cardMap = React.useMemo(() => new Map(cards.map((c) => [c.id, c])), [cards]);
  const lessonMap = React.useMemo(() => new Map(lessons.map((l) => [l.routeId, l])), [lessons]);

  const [sessionQueueIds, setSessionQueueIds] = React.useState<string[]>([]);
  const [cursor, setCursor] = React.useState(0);
  const [sessionStarted, setSessionStarted] = React.useState(false);
  const [revealed, setRevealed] = React.useState(false);
  const [selectedOption, setSelectedOption] = React.useState<number | null>(null);
  const [attempts, setAttempts] = React.useState<SessionAttempt[]>([]);
  const [undoStack, setUndoStack] = React.useState<UndoStackItem[]>([]);
  const [announcement, setAnnouncement] = React.useState('');

  // Settings Popover local UI state
  const [confirmReset, setConfirmReset] = React.useState(false);
  const [settingsNotice, setSettingsNotice] = React.useState<{
    kind: 'ok' | 'err';
    text: string;
  } | null>(null);
  const importFileRef = React.useRef<HTMLInputElement | null>(null);

  // Initialize queue once hydrated and whenever idle (not currently midway in an active session)
  React.useEffect(() => {
    if (!hydrated) return;
    if (!sessionStarted) {
      if (dueCardIds.length > 0) {
        setSessionQueueIds(dueCardIds);
        setCursor(0);
      } else {
        setSessionQueueIds([]);
        setCursor(0);
      }
    }
  }, [hydrated, dueCardIds, sessionStarted]);

  const unlockedCount = React.useMemo(
    () => cards.filter((c) => Boolean(progressState.completedLessons[c.lessonSlug])).length,
    [cards, progressState.completedLessons]
  );

  const sessionComplete =
    sessionStarted && attempts.length > 0 && cursor >= sessionQueueIds.length;
  const currentCardId = cursor < sessionQueueIds.length ? sessionQueueIds[cursor] : undefined;
  const currentCard = currentCardId ? cardMap.get(currentCardId) : undefined;

  const currentCardState: CardProgressState | undefined = React.useMemo(() => {
    if (!currentCard) return undefined;
    return (
      storeData.cards[currentCard.id] ??
      createInitialCardState(currentCard.id, currentCard.lessonSlug)
    );
  }, [currentCard, storeData.cards]);

  const ratingPreviews = React.useMemo(() => {
    if (!currentCardState) return null;
    return scheduleAllRatings(currentCardState, new Date());
  }, [currentCardState]);

  const mcqCorrect: boolean | null = React.useMemo(() => {
    if (!currentCard || currentCard.type !== 'mcq' || selectedOption === null) return null;
    return selectedOption === currentCard.correctIndex;
  }, [currentCard, selectedOption]);

  const suggestedRating: SrsRating | null = React.useMemo(() => {
    if (mcqCorrect === null) return null;
    return mcqCorrect ? 3 : 1;
  }, [mcqCorrect]);

  const handleReveal = React.useCallback(() => {
    if (!currentCard || revealed) return;
    setRevealed(true);
    setAnnouncement(`Answer revealed: ${currentCard.back}`);
  }, [currentCard, revealed]);

  const handleSelectMcqOption = React.useCallback(
    (optionIndex: number) => {
      if (!currentCard || currentCard.type !== 'mcq' || revealed) return;
      setSelectedOption(optionIndex);
      setRevealed(true);
      const isRight = optionIndex === currentCard.correctIndex;
      setAnnouncement(
        isRight
          ? `Correct: ${currentCard.back}. Choose a rating 1 to 4.`
          : `Incorrect. Correct answer: ${currentCard.back}. Choose a rating 1 to 4.`
      );
    },
    [currentCard, revealed]
  );

  const handleRate = React.useCallback(
    (rating: SrsRating) => {
      if (!currentCard || !revealed) return;
      const prevQueue = sessionQueueIds;
      const prevCursor = cursor;
      const prevRevealed = revealed;
      const prevOption = selectedOption;

      const { nextState, snapshot } = rateCard(
        currentCard.id,
        currentCard.lessonSlug,
        rating,
        new Date()
      );

      setSessionStarted(true);

      const wasCorrect =
        currentCard.type === 'mcq' && selectedOption !== null
          ? selectedOption === currentCard.correctIndex
          : rating >= 2;

      setAttempts((prev) => [
        ...prev,
        {
          cardId: currentCard.id,
          lessonSlug: currentCard.lessonSlug,
          rating,
          wasCorrect,
        },
      ]);

      setUndoStack((prev) => [
        ...prev,
        {
          snapshot,
          prevQueueIds: prevQueue,
          prevCursor,
          prevRevealed,
          prevSelectedOption: prevOption,
        },
      ]);

      // Re-queue 'Again' cards once at the end of the session so lapses get reinforced.
      const alreadyRequeuedCount = prevQueue.filter((id) => id === currentCard.id).length;
      const nextQueue =
        rating === 1 && alreadyRequeuedCount < 2
          ? [...prevQueue, currentCard.id]
          : prevQueue;

      setSessionQueueIds(nextQueue);
      setCursor(prevCursor + 1);
      setRevealed(false);
      setSelectedOption(null);

      const intervalMsg =
        nextState.scheduledDays === 0
          ? '10 minutes'
          : nextState.scheduledDays === 1
            ? '1 day'
            : `${nextState.scheduledDays} days`;
      const nextPos = prevCursor + 2;
      setAnnouncement(
        nextPos <= nextQueue.length
          ? `Rated ${rating}. Next review in ${intervalMsg}. Card ${nextPos} of ${nextQueue.length}.`
          : `Rated ${rating}. Next review in ${intervalMsg}. Session complete.`
      );
    },
    [currentCard, revealed, sessionQueueIds, cursor, selectedOption, rateCard]
  );

  const handleUndo = React.useCallback(() => {
    const last = undoStack[undoStack.length - 1];
    if (!last) return;
    restoreSnapshot(last.snapshot);
    setUndoStack((prev) => prev.slice(0, -1));
    setAttempts((prev) => prev.slice(0, -1));
    setSessionQueueIds(last.prevQueueIds);
    setCursor(last.prevCursor);
    setRevealed(false);
    setSelectedOption(null);
    setAnnouncement(
      `Undid last rating. Returned to card ${last.prevCursor + 1} of ${last.prevQueueIds.length}.`
    );
  }, [undoStack, restoreSnapshot]);

  // Global keyboard shortcuts: Esc exit, Cmd/Ctrl+Z undo, Space/Enter reveal, A-D MCQ before reveal, 1-4 rate after reveal
  React.useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      const inInput =
        target &&
        (target.tagName === 'INPUT' ||
          target.tagName === 'TEXTAREA' ||
          target.tagName === 'SELECT');

      if (e.key === 'Escape') {
        if (!inInput) {
          e.preventDefault();
          router.push('/curriculum');
        }
        return;
      }

      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'z' && !e.shiftKey) {
        if (undoStack.length > 0 && !inInput) {
          e.preventDefault();
          handleUndo();
        }
        return;
      }

      if (inInput || !currentCard) return;

      const isOtherInteractive =
        target &&
        (target.tagName === 'A' ||
          (target.tagName === 'BUTTON' && !target.dataset.reviewTrigger));

      if ((e.code === 'Space' || e.key === 'Enter') && !revealed) {
        if (isOtherInteractive) return;
        e.preventDefault();
        handleReveal();
        return;
      }

      if (!revealed && currentCard.type === 'mcq' && currentCard.options) {
        const letterIndex = OPTION_LETTERS.indexOf(e.key.toUpperCase());
        if (letterIndex >= 0 && letterIndex < currentCard.options.length) {
          e.preventDefault();
          handleSelectMcqOption(letterIndex);
          return;
        }
      }

      if (revealed) {
        const num = Number(e.key);
        if (num >= 1 && num <= 4) {
          e.preventDefault();
          handleRate(num as SrsRating);
        }
      }
    };

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [
    router,
    undoStack.length,
    handleUndo,
    currentCard,
    revealed,
    handleReveal,
    handleSelectMcqOption,
    handleRate,
  ]);

  const handleExport = async () => {
    const json = await exportReviewJson();
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `neuralpath-review-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
    setSettingsNotice({ kind: 'ok', text: 'Exported review JSON backup.' });
  };

  const handleImportChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    try {
      const content = await file.text();
      const res = await importReviewJson(content);
      if (res.ok) {
        setSessionStarted(false);
        setAttempts([]);
        setUndoStack([]);
        setRevealed(false);
        setSelectedOption(null);
        setSettingsNotice({ kind: 'ok', text: 'Imported review backup cleanly.' });
      } else {
        setSettingsNotice({ kind: 'err', text: res.error ?? 'Invalid backup JSON.' });
      }
    } catch {
      setSettingsNotice({ kind: 'err', text: 'Unable to read backup file.' });
    }
  };

  const handleResetData = async () => {
    await resetReviewData();
    setConfirmReset(false);
    setSessionStarted(false);
    setAttempts([]);
    setUndoStack([]);
    setRevealed(false);
    setSelectedOption(null);
    setSettingsNotice({ kind: 'ok', text: 'Review history reset.' });
  };

  const handleDailyCapChange = (rawVal: string) => {
    const parsed = Number(rawVal);
    if (!Number.isFinite(parsed)) return;
    updateSettings({
      newCardsPerDay: Math.min(MAX_NEW_CARDS_PER_DAY, Math.max(MIN_NEW_CARDS_PER_DAY, parsed)),
    });
    if (!sessionStarted) {
      setRevealed(false);
    }
  };

  const progressCurrent =
    sessionQueueIds.length === 0 ? 0 : Math.min(cursor + 1, sessionQueueIds.length);
  const progressPct =
    sessionQueueIds.length > 0
      ? Math.round((Math.min(cursor, sessionQueueIds.length) / sessionQueueIds.length) * 100)
      : 0;

  // Session summary metrics
  const accuracyPercent =
    attempts.length > 0
      ? Math.round((attempts.filter((a) => a.wasCorrect).length / attempts.length) * 100)
      : 100;
  const tomorrowDue = React.useMemo(
    () => countTomorrowDueCards(cardIndex, storeData, progressState.completedLessons, new Date()),
    [cardIndex, storeData, progressState.completedLessons]
  );
  const weakestSlug = findWeakestLessonSlug(attempts);
  const weakestLesson = weakestSlug ? lessonMap.get(weakestSlug) : undefined;

  // Empty countdown text
  const earliestNext = React.useMemo(() => {
    if (!hydrated || unlockedCount === 0 || dueCardIds.length > 0) return null;
    return getEarliestNextReviewDate(
      cardIndex,
      storeData,
      progressState.completedLessons,
      new Date()
    );
  }, [hydrated, unlockedCount, dueCardIds.length, cardIndex, storeData, progressState.completedLessons]);

  const countdownLabel = earliestNext ? formatNextReviewCountdown(earliestNext, new Date()) : null;

  return (
    <div className="mx-auto flex min-h-[calc(100vh-8rem)] max-w-[680px] flex-col justify-start px-4 py-6 sm:px-6 sm:py-10">
      {/* Screen-reader live region for reveal, rating & undo announcements */}
      <div className="sr-only" role="status" aria-live="polite" aria-atomic="true">
        {announcement}
      </div>

      {/* Distraction-free quiet header bar */}
      <div className="mb-4 flex items-center justify-between gap-2">
        <Link
          href="/curriculum"
          className={cn(
            buttonVariants({ variant: 'ghost', size: 'md' }),
            'min-h-[44px] min-w-[44px] gap-1.5 px-2.5 text-primary-secondary hover:text-primary'
          )}
          aria-label="Exit review (Esc)"
        >
          <ArrowLeft className="h-4 w-4" aria-hidden="true" />
          <span className="text-sm font-medium">Exit</span>
        </Link>

        {currentCard && !sessionComplete && (
          <div className="text-center font-mono text-xs font-medium tabular-nums text-primary-secondary">
            {progressCurrent} of {sessionQueueIds.length}
          </div>
        )}

        <div className="flex items-center gap-1.5">
          {undoStack.length > 0 && (
            <Button
              type="button"
              variant="ghost"
              size="md"
              onClick={handleUndo}
              aria-label="Undo last rating (Ctrl+Z)"
              title="Undo last rating (Ctrl+Z)"
              className="min-h-[44px] min-w-[44px] px-2.5 text-primary-secondary hover:text-primary"
            >
              <RotateCcw className="h-4 w-4" aria-hidden="true" />
              <span className="hidden text-xs sm:inline">Undo</span>
            </Button>
          )}

          <Popover>
            <PopoverTrigger asChild>
              <Button
                type="button"
                variant="outline"
                size="icon"
                aria-label="Review settings"
                className="min-h-[44px] min-w-[44px]"
              >
                <Settings2 className="h-4 w-4" aria-hidden="true" />
              </Button>
            </PopoverTrigger>
            <PopoverContent align="end" className="w-80 max-w-[calc(100vw-2rem)] space-y-4">
              <div>
                <h2 className="text-sm font-semibold text-primary">Review Settings</h2>
                <p className="mt-0.5 text-xs text-primary-secondary">
                  Daily cutoff resets at 4:00 AM local time. Stored locally in your browser.
                </p>
              </div>

              <div className="space-y-1.5">
                <label htmlFor="new-cards-per-day" className="block text-xs font-medium text-primary">
                  New cards per day (1–{MAX_NEW_CARDS_PER_DAY})
                </label>
                <Input
                  id="new-cards-per-day"
                  type="number"
                  min={MIN_NEW_CARDS_PER_DAY}
                  max={MAX_NEW_CARDS_PER_DAY}
                  value={storeData.settings.newCardsPerDay}
                  onChange={(e) => handleDailyCapChange(e.target.value)}
                  className="h-11"
                />
              </div>

              <div className="space-y-2 border-t border-hairline pt-3">
                <div className="text-xs font-medium text-primary">Backup &amp; Transfer</div>
                <div className="grid grid-cols-2 gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => void handleExport()}
                    className="min-h-[44px] justify-center text-xs"
                  >
                    <Download className="h-3.5 w-3.5" aria-hidden="true" />
                    <span>Export JSON</span>
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => importFileRef.current?.click()}
                    className="min-h-[44px] justify-center text-xs"
                  >
                    <Upload className="h-3.5 w-3.5" aria-hidden="true" />
                    <span>Import JSON</span>
                  </Button>
                  <input
                    ref={importFileRef}
                    type="file"
                    accept=".json,application/json"
                    aria-label="Import review progress JSON"
                    className="sr-only"
                    onChange={(e) => void handleImportChange(e)}
                  />
                </div>
              </div>

              <div className="space-y-2 border-t border-hairline pt-3">
                {!confirmReset ? (
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setConfirmReset(true)}
                    className="min-h-[44px] w-full text-xs text-danger hover:text-danger"
                  >
                    Reset review data
                  </Button>
                ) : (
                  <div className="flex gap-2">
                    <Button
                      type="button"
                      variant="danger"
                      onClick={() => void handleResetData()}
                      className="min-h-[44px] flex-1 text-xs"
                    >
                      Confirm reset
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setConfirmReset(false)}
                      className="min-h-[44px] flex-1 text-xs"
                    >
                      Cancel
                    </Button>
                  </div>
                )}
              </div>

              {settingsNotice && (
                <p
                  role={settingsNotice.kind === 'err' ? 'alert' : 'status'}
                  className={cn(
                    'text-xs font-medium',
                    settingsNotice.kind === 'err' ? 'text-danger' : 'text-success'
                  )}
                >
                  {settingsNotice.text}
                </p>
              )}
            </PopoverContent>
          </Popover>
        </div>
      </div>

      {/* Subtle progress bar */}
      {sessionQueueIds.length > 0 && !sessionComplete && (
        <div
          className="mb-6 h-1.5 w-full overflow-hidden rounded-full bg-subtle"
          role="progressbar"
          aria-valuenow={progressPct}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label="Review session progress"
        >
          <div
            className="h-full bg-accent transition-[width] duration-200 ease-neural"
            style={{ width: `${progressPct}%` }}
          />
        </div>
      )}

      {/* Main Centered Content States */}
      {!hydrated ? (
        <UiCard className="flex min-h-[460px] items-center justify-center p-8 text-sm text-primary-secondary">
          Loading review queue...
        </UiCard>
      ) : sessionComplete ? (
        /* Session Summary */
        <UiCard className="flex min-h-[460px] flex-col justify-between p-6 sm:p-8">
          <div className="space-y-6">
            <div className="flex items-start gap-3">
              <CheckCircle2 className="mt-0.5 h-6 w-6 shrink-0 text-success" aria-hidden="true" />
              <div>
                <h1 className="text-2xl font-bold tracking-tight text-primary">
                  Session complete
                </h1>
                <p className="mt-1 text-sm text-primary-secondary">
                  Consistent active recall strengthens neural retention cleanly without cramming.
                </p>
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-3">
              <div className="rounded-md border border-hairline bg-canvas p-4">
                <div className="text-xs text-primary-secondary">Cards reviewed</div>
                <div className="mt-1 font-mono text-2xl font-bold tabular-nums text-primary">
                  {attempts.length}
                </div>
              </div>
              <div className="rounded-md border border-hairline bg-canvas p-4">
                <div className="text-xs text-primary-secondary">Accuracy</div>
                <div className="mt-1 font-mono text-2xl font-bold tabular-nums text-primary">
                  {accuracyPercent}%
                </div>
              </div>
              <div className="rounded-md border border-hairline bg-canvas p-4">
                <div className="text-xs text-primary-secondary">Due tomorrow</div>
                <div className="mt-1 font-mono text-2xl font-bold tabular-nums text-primary">
                  {tomorrowDue}
                </div>
              </div>
            </div>

            {weakestLesson && (
              <div className="rounded-md border border-hairline bg-subtle/60 p-4">
                <div className="text-xs font-medium text-primary-secondary">
                  Lesson worth revisiting
                </div>
                <div className="mt-1.5 flex flex-wrap items-center justify-between gap-2">
                  <span className="text-sm font-semibold text-primary">{weakestLesson.title}</span>
                  <Link
                    href={weakestLesson.url}
                    className={cn(
                      buttonVariants({ variant: 'outline', size: 'md' }),
                      'min-h-[44px]'
                    )}
                  >
                    <BookOpen className="h-4 w-4 text-accent" aria-hidden="true" />
                    <span>Review Lesson</span>
                  </Link>
                </div>
              </div>
            )}
          </div>

          <div className="mt-8 flex flex-wrap items-center justify-between gap-3 border-t border-hairline pt-5">
            {undoStack.length > 0 ? (
              <Button
                type="button"
                variant="outline"
                onClick={handleUndo}
                className="min-h-[44px]"
              >
                <RotateCcw className="h-4 w-4" aria-hidden="true" />
                <span>Undo last rating</span>
              </Button>
            ) : (
              <span />
            )}

            <Link
              href="/curriculum"
              className={cn(buttonVariants({ variant: 'primary', size: 'md' }), 'min-h-[44px]')}
            >
              <span>Back to Curriculum</span>
              <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </Link>
          </div>
        </UiCard>
      ) : currentCard && ratingPreviews ? (
        /* Active Review Card (Zero Layout Shift Frame) */
        <UiCard
          key={currentCard.id}
          className={cn(
            'flex min-h-[380px] sm:min-h-[440px] flex-col justify-between p-5 sm:p-8',
            !prefersReducedMotion && 'transition-opacity duration-200 ease-neural'
          )}
        >
          {/* Fixed top header + Question prompt */}
          <div className="space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-hairline pb-3">
              <div className="flex flex-wrap items-center gap-2">
                <Badge variant="accent">{CARD_TYPE_LABELS[currentCard.type]}</Badge>
                {currentCard.tags?.slice(0, 2).map((tag) => (
                  <Badge key={tag} variant="neutral">
                    {tag}
                  </Badge>
                ))}
              </div>
              <Link
                href={lessonMap.get(currentCard.lessonSlug)?.url ?? `/learn/${currentCard.lessonSlug}`}
                className="inline-flex min-h-[44px] items-center text-xs font-medium text-primary-secondary hover:text-accent hover:underline"
              >
                {lessonMap.get(currentCard.lessonSlug)?.title ?? currentCard.lessonSlug}
              </Link>
            </div>

            <h1 className="text-lg font-semibold leading-relaxed text-primary sm:text-xl">
              {currentCard.type === 'cloze'
                ? renderClozeFront(currentCard.front, currentCard.back, revealed)
                : currentCard.front}
            </h1>
          </div>

          {/* Stable middle slot preventing layout shifts when answer is revealed */}
          <div className="my-3 flex min-h-[140px] flex-1 flex-col justify-center sm:my-5 sm:min-h-[180px]">
            {currentCard.type === 'mcq' && currentCard.options ? (
              <div className="space-y-2.5" role="group" aria-label="Multiple choice options">
                {currentCard.options.map((opt, idx) => {
                  const isCorrectOpt = idx === currentCard.correctIndex;
                  const isChosenOpt = selectedOption === idx;
                  const letter = OPTION_LETTERS[idx] ?? String(idx + 1);
                  return (
                    <button
                      key={idx}
                      type="button"
                      disabled={revealed}
                      onClick={() => handleSelectMcqOption(idx)}
                      className={cn(
                        'flex min-h-[44px] w-full items-center justify-between gap-3 rounded-sm border px-3.5 py-2.5 text-left text-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent',
                        !revealed &&
                          'border-strong bg-canvas text-primary hover:border-accent hover:bg-subtle',
                        revealed &&
                          isCorrectOpt &&
                          'border-success bg-success-soft/50 font-medium text-primary',
                        revealed &&
                          isChosenOpt &&
                          !isCorrectOpt &&
                          'border-danger bg-danger-soft/50 text-primary',
                        revealed && !isCorrectOpt && !isChosenOpt && 'border-hairline bg-subtle/50 text-primary-secondary'
                      )}
                    >
                      <span className="flex items-start gap-2.5">
                        <span className="font-mono text-xs font-semibold text-primary-secondary">
                          {letter}.
                        </span>
                        <span>{opt}</span>
                      </span>
                      {revealed && isCorrectOpt && (
                        <CheckCircle2 className="h-4 w-4 shrink-0 text-success" aria-label="Correct option" />
                      )}
                      {revealed && isChosenOpt && !isCorrectOpt && (
                        <XCircle className="h-4 w-4 shrink-0 text-danger" aria-label="Selected wrong option" />
                      )}
                    </button>
                  );
                })}

                {revealed && currentCard.explanation && (
                  <div className="rounded-sm border border-hairline bg-canvas p-3 text-xs leading-relaxed text-primary-secondary">
                    {currentCard.explanation}
                  </div>
                )}
              </div>
            ) : (
              <div
                className={cn(
                  'rounded-md border p-4 transition-colors',
                  revealed
                    ? 'border-hairline bg-canvas'
                    : 'border-dashed border-hairline bg-subtle/40'
                )}
              >
                {revealed ? (
                  <div className="space-y-2.5">
                    <div className="text-xs font-semibold uppercase tracking-wider text-primary-secondary">
                      Answer
                    </div>
                    <p className="text-sm font-medium leading-relaxed text-primary">
                      {currentCard.back}
                    </p>
                    {currentCard.explanation && (
                      <p className="border-t border-hairline pt-2.5 text-xs leading-relaxed text-primary-secondary">
                        {currentCard.explanation}
                      </p>
                    )}
                  </div>
                ) : (
                  <p className="py-6 text-center text-sm text-primary-secondary">
                    Think through the answer before revealing it.
                  </p>
                )}
              </div>
            )}
          </div>

          {/* Fixed height bottom action dock */}
          <div className="border-t border-hairline pt-4">
            {!revealed ? (
              <div className="flex flex-col items-center gap-2">
                <Button
                  type="button"
                  size="lg"
                  data-review-trigger="true"
                  onClick={handleReveal}
                  className="min-h-[48px] w-full sm:w-auto sm:min-w-[220px]"
                >
                  <Eye className="h-4 w-4" aria-hidden="true" />
                  <span>Show Answer (Space)</span>
                </Button>
              </div>
            ) : (
              <div className="space-y-2">
                {suggestedRating && (
                  <div className="text-center text-xs text-primary-secondary">
                    Suggested:{' '}
                    <span className="font-semibold text-primary">
                      {ratingPreviews[suggestedRating].label}
                    </span>{' '}
                    (or override with 1–4)
                  </div>
                )}
                <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-4">
                  {RATING_KEYS.map((rating) => {
                    const info = ratingPreviews[rating];
                    const isSuggested =
                      suggestedRating === rating || (!suggestedRating && rating === 3);
                    return (
                      <Button
                        key={rating}
                        type="button"
                        variant={isSuggested ? 'primary' : 'outline'}
                        onClick={() => handleRate(rating)}
                        className="min-h-[48px] flex-col gap-0.5 px-2 py-2"
                        aria-label={`${info.label}: ${info.intervalText} (key ${rating})`}
                      >
                        <span className="text-xs font-semibold">
                          {rating} · {info.label}: {info.intervalText}
                        </span>
                      </Button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </UiCard>
      ) : unlockedCount === 0 ? (
        /* Empty State 1: No completed lessons with cards */
        <UiCard className="flex min-h-[380px] flex-col items-center justify-center p-8 text-center">
          <Brain className="h-10 w-10 text-accent" aria-hidden="true" />
          <h1 className="mt-4 text-xl font-bold text-primary">
            Finish a lesson to unlock cards
          </h1>
          <p className="mt-2 max-w-md text-sm text-primary-secondary">
            Spaced-repetition flashcards activate automatically when you mark a lesson complete.
            Try Gradient Descent or Self-Attention to get started.
          </p>
          <div className="mt-6 flex flex-wrap justify-center gap-3">
            <Link
              href="/learn/classical-ml/02-gradient-descent"
              className={cn(buttonVariants({ variant: 'primary', size: 'md' }), 'min-h-[44px]')}
            >
              <span>Start Gradient Descent</span>
              <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </Link>
            <Link
              href="/curriculum"
              className={cn(buttonVariants({ variant: 'outline', size: 'md' }), 'min-h-[44px]')}
            >
              Browse Curriculum
            </Link>
          </div>
        </UiCard>
      ) : (
        /* Empty State 2: Unlocked cards exist, none currently due */
        <UiCard className="flex min-h-[380px] flex-col items-center justify-center p-8 text-center">
          <CheckCircle2 className="h-10 w-10 text-success" aria-hidden="true" />
          <h1 className="mt-4 text-xl font-bold text-primary">
            Nothing due. Next review in {countdownLabel ?? '24h'}
          </h1>
          <p className="mt-2 max-w-md text-sm text-primary-secondary">
            You are caught up for today across {unlockedCount} unlocked concept cards. Complete
            another lesson or check back after the 4:00 AM daily rollover.
          </p>
          <div className="mt-6 flex flex-wrap justify-center gap-3">
            <Link
              href="/curriculum"
              className={cn(buttonVariants({ variant: 'outline', size: 'md' }), 'min-h-[44px]')}
            >
              <span>Browse Curriculum</span>
              <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </Link>
          </div>
        </UiCard>
      )}
    </div>
  );
}
