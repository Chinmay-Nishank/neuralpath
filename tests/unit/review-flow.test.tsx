import { describe, expect, it, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { ProgressProvider } from '@/components/progress/progress-provider';
import { ReviewProvider } from '@/components/review/review-provider';
import { ReviewClient } from '@/components/review/review-client';
import { STORAGE_KEY } from '@/lib/progress';
import { REVIEW_STORE_KEY } from '@/lib/review-store';
import type { Card } from '@/lib/card-schema';

const mockPush = vi.fn();

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: mockPush }),
}));

const SAMPLE_CARDS: Card[] = [
  {
    id: 'gradient-descent:steepest',
    lessonSlug: 'classical-ml/02-gradient-descent',
    type: 'recall',
    front: 'Which direction does the gradient vector point?',
    back: 'Strictly uphill (steepest ascent).',
    explanation: 'Subtracting lr * grad moves downhill.',
    tags: ['calculus'],
  },
  {
    id: 'gradient-descent:lr-high',
    lessonSlug: 'classical-ml/02-gradient-descent',
    type: 'mcq',
    front: 'What happens if learning rate η is too high?',
    options: ['Steps overshoot and diverge', 'Converges monotonically slower'],
    correctIndex: 0,
    back: 'Steps overshoot and diverge',
    explanation: 'Step size exceeds curvature bound 2 / L_max.',
    tags: ['lr'],
  },
];

const SAMPLE_LESSONS = [
  {
    routeId: 'classical-ml/02-gradient-descent',
    title: 'Gradient Descent & Loss Surfaces',
    url: '/learn/classical-ml/02-gradient-descent',
  },
];

describe('ReviewClient flow & keyboard UX', () => {
  beforeEach(() => {
    window.localStorage.clear();
    mockPush.mockClear();
  });

  it('shows empty state when no card-bearing lesson has been completed', async () => {
    render(
      <ProgressProvider>
        <ReviewProvider cardIndex={SAMPLE_CARDS}>
          <ReviewClient cards={SAMPLE_CARDS} lessons={SAMPLE_LESSONS} />
        </ReviewProvider>
      </ProgressProvider>
    );

    await waitFor(() => {
      expect(screen.getByText('Finish a lesson to unlock cards')).toBeInTheDocument();
    });
  });

  it('runs reveal -> rate -> MCQ auto-grade -> summary -> Ctrl+Z undo cleanly', async () => {
    window.localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        version: 1,
        activePath: 'beginner',
        onboardingComplete: true,
        completedLessons: {
          'classical-ml/02-gradient-descent': {
            completedAt: '2026-11-11T10:00:00.000Z',
            score: 3,
            totalQuestions: 3,
          },
        },
        bookmarks: [],
        notes: {},
        reviewSchedule: {},
        activityDates: ['2026-11-11'],
        lastVisitedLesson: 'classical-ml/02-gradient-descent',
        analyticsConsent: 'denied',
        fontSerif: false,
      })
    );

    render(
      <ProgressProvider>
        <ReviewProvider cardIndex={SAMPLE_CARDS}>
          <ReviewClient cards={SAMPLE_CARDS} lessons={SAMPLE_LESSONS} />
        </ReviewProvider>
      </ProgressProvider>
    );

    await waitFor(() => {
      expect(screen.getByText('1 of 2')).toBeInTheDocument();
    });
    expect(screen.getByText('Which direction does the gradient vector point?')).toBeInTheDocument();
    expect(screen.queryByText('Strictly uphill (steepest ascent).')).not.toBeInTheDocument();

    // Reveal via Space key
    fireEvent.keyDown(window, { code: 'Space', key: ' ' });
    expect(screen.getByText('Strictly uphill (steepest ascent).')).toBeInTheDocument();

    // Rating buttons display FSRS interval predictions
    expect(screen.getByRole('button', { name: /Again: 10 min/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Hard: 1 day/i })).toBeInTheDocument();
    const goodBtn = screen.getByRole('button', { name: /Good: 4 days/i });
    expect(goodBtn).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Easy: 9 days/i })).toBeInTheDocument();

    fireEvent.click(goodBtn);

    // Card 2 (MCQ): select wrong option, auto-grades with Again suggested, override with Easy (key 4)
    expect(screen.getByText('2 of 2')).toBeInTheDocument();
    fireEvent.click(screen.getByText('Converges monotonically slower'));
    expect(screen.getByText(/Suggested:/)).toBeInTheDocument();
    expect(screen.getByLabelText('Correct option')).toBeInTheDocument();
    expect(screen.getByLabelText('Selected wrong option')).toBeInTheDocument();

    fireEvent.keyDown(window, { key: '4' });

    // Session summary displayed cleanly
    expect(screen.getByText('Session complete')).toBeInTheDocument();
    expect(screen.getByText('50%')).toBeInTheDocument();
    expect(screen.getByText('Gradient Descent & Loss Surfaces')).toBeInTheDocument();

    // Ctrl+Z undoes last rating cleanly right from summary
    fireEvent.keyDown(window, { key: 'z', ctrlKey: true });
    expect(screen.getByText('2 of 2')).toBeInTheDocument();
    expect(window.localStorage.getItem(REVIEW_STORE_KEY)).toContain('gradient-descent:steepest');
  });
});

