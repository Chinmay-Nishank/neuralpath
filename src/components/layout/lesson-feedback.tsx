'use client';

import * as React from 'react';
import Link from 'next/link';
import { CheckCircle2, ThumbsUp, ThumbsDown, ExternalLink, Globe, Brain } from 'lucide-react';
import { Button, buttonVariants } from '@/components/ui/button';
import { useProgress } from '@/components/progress/progress-provider';
import { useReview } from '@/components/review/review-provider';
import { useToast } from '@/components/ui/toast';
import { buildGoogleSearchUrl } from '@/lib/google-search';
import { trackEvent } from '@/lib/analytics';
import { cn } from '@/lib/utils';

export function LessonFooterActions({
  routeId,
  slugPath,
  lessonTitle,
}: {
  routeId: string;
  slugPath: string;
  lessonTitle: string;
}) {
  const { state, toggleLessonCompleted, markLessonVisited } = useProgress();
  const {
    cardCountForLesson,
    dueByLesson,
    enrollLessonCards,
    unEnrollNewLessonCards,
  } = useReview();
  const { pushToast } = useToast();
  const [feedbackSent, setFeedbackSent] = React.useState<'up' | 'down' | null>(null);

  React.useEffect(() => {
    markLessonVisited(routeId);
  }, [routeId, markLessonVisited]);

  const completed = Boolean(state.completedLessons[routeId]);
  const lessonCardCount = cardCountForLesson(routeId);
  const lessonDueCount = dueByLesson[routeId] ?? 0;
  const repo = process.env.NEXT_PUBLIC_GITHUB_REPO ?? 'https://github.com/neuralpath/neuralpath';
  const editUrl = `${repo}/edit/main/content/${slugPath}.mdx`;

  const handleToggleComplete = () => {
    const wasCompleted = Boolean(state.completedLessons[routeId]);
    toggleLessonCompleted(routeId);

    if (!wasCompleted) {
      trackEvent('lesson_complete', { routeId });
      const addedCardIds = enrollLessonCards(routeId);
      if (lessonCardCount > 0) {
        pushToast({
          title: `Added ${lessonCardCount} cards to your review queue`,
          description: 'Active-recall cards for this lesson are now unlocked in Review.',
          variant: 'success',
          action: {
            label: 'Undo',
            onClick: () => {
              unEnrollNewLessonCards(addedCardIds);
              toggleLessonCompleted(routeId);
            },
          },
        });
      }
    }
  };

  const sendFeedback = async (helpful: boolean) => {
    setFeedbackSent(helpful ? 'up' : 'down');
    try {
      await fetch('/api/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          kind: 'lesson_feedback',
          lessonSlug: routeId,
          helpful,
        }),
      });
    } catch {
      // Non-blocking
    }
  };

  return (
    <div className="my-8 flex flex-wrap items-center justify-between gap-4 rounded-md border border-hairline bg-surface p-4">
      <div className="flex flex-wrap items-center gap-2.5">
        <Button
          variant={completed ? 'secondary' : 'primary'}
          onClick={handleToggleComplete}
          className="min-h-[44px]"
        >
          <CheckCircle2 className="h-4 w-4" aria-hidden="true" />
          <span>{completed ? 'Completed (Click to undo)' : 'Mark Lesson Complete'}</span>
        </Button>

        {completed && lessonCardCount > 0 && (
          <Link
            href="/review"
            className="inline-flex min-h-[44px] items-center gap-1.5 rounded-sm border border-strong bg-canvas px-3 py-2 text-xs font-medium text-primary hover:border-accent hover:text-accent"
          >
            <Brain className="h-3.5 w-3.5 text-accent" aria-hidden="true" />
            <span>
              {lessonDueCount > 0
                ? `${lessonDueCount} cards due in Review →`
                : `${lessonCardCount} review cards unlocked →`}
            </span>
          </Link>
        )}

        <a
          href={buildGoogleSearchUrl(lessonTitle, 'web', true)}
          target="_blank"
          rel="noopener noreferrer"
          className={cn(
            buttonVariants({ variant: 'outline' }),
            'min-h-[44px] xl:hidden'
          )}
        >
          <Globe className="h-4 w-4 text-accent" aria-hidden="true" />
          <span>Search Google</span>
        </a>
      </div>

      <div className="flex flex-wrap items-center gap-3 text-xs text-primary-secondary">
        <span>Was this helpful?</span>
        <div className="flex items-center gap-1">
          <Button
            size="sm"
            variant={feedbackSent === 'up' ? 'secondary' : 'ghost'}
            onClick={() => void sendFeedback(true)}
            aria-label="Lesson was helpful"
          >
            <ThumbsUp className="h-3.5 w-3.5" aria-hidden="true" />
          </Button>
          <Button
            size="sm"
            variant={feedbackSent === 'down' ? 'secondary' : 'ghost'}
            onClick={() => void sendFeedback(false)}
            aria-label="Lesson needs improvement"
          >
            <ThumbsDown className="h-3.5 w-3.5" aria-hidden="true" />
          </Button>
        </div>

        <a
          href={editUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1 text-primary-secondary hover:text-accent"
        >
          <span>Edit on GitHub</span>
          <ExternalLink className="h-3 w-3" aria-hidden="true" />
        </a>
      </div>
    </div>
  );
}
