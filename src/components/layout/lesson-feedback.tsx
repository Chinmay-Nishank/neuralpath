'use client';

import * as React from 'react';
import { CheckCircle2, ThumbsUp, ThumbsDown, ExternalLink, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useProgress } from '@/components/progress/progress-provider';
import { trackEvent } from '@/lib/analytics';

export function LessonFooterActions({
  routeId,
  slugPath,
  onOpenTutor,
}: {
  routeId: string;
  slugPath: string;
  onOpenTutor: () => void;
}) {
  const { state, toggleLessonCompleted, markLessonVisited } = useProgress();
  const [feedbackSent, setFeedbackSent] = React.useState<'up' | 'down' | null>(null);

  React.useEffect(() => {
    markLessonVisited(routeId);
  }, [routeId, markLessonVisited]);

  const completed = Boolean(state.completedLessons[routeId]);
  const repo = process.env.NEXT_PUBLIC_GITHUB_REPO ?? 'https://github.com/neuralpath/neuralpath';
  const editUrl = `${repo}/edit/main/content/${slugPath}.mdx`;

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
          onClick={() => {
            toggleLessonCompleted(routeId);
            if (!completed) trackEvent('lesson_complete', { routeId });
          }}
        >
          <CheckCircle2 className="h-4 w-4" aria-hidden="true" />
          <span>{completed ? 'Completed (Click to undo)' : 'Mark Lesson Complete'}</span>
        </Button>

        <Button variant="outline" onClick={onOpenTutor} className="xl:hidden">
          <Sparkles className="h-4 w-4 text-accent" aria-hidden="true" />
          <span>Ask AI Tutor</span>
        </Button>
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

