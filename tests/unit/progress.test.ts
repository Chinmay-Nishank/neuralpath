import { describe, expect, it, beforeEach } from 'vitest';
import {
  calculateQuizStats,
  calculateStreak,
  encodeVizParams,
  loadLearningState,
  saveLearningState,
  scheduleNextReview,
  validateImportedState,
  DEFAULT_LEARNING_STATE,
} from '@/lib/progress';

describe('progress utilities', () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it('computes active streaks cleanly for consecutive days', () => {
    expect(calculateStreak([], '2026-11-11')).toBe(0);
    expect(calculateStreak(['2026-11-11', '2026-11-10', '2026-11-09'], '2026-11-11')).toBe(3);
    expect(calculateStreak(['2026-11-10', '2026-11-09'], '2026-11-11')).toBe(2);
    expect(calculateStreak(['2026-11-08', '2026-11-07'], '2026-11-11')).toBe(0);
  });

  it('persists and restores learning state from localStorage', () => {
    const updated = {
      ...DEFAULT_LEARNING_STATE,
      activePath: 'researcher' as const,
      bookmarks: ['nlp-transformers/04-self-attention'],
    };
    saveLearningState(updated);
    const loaded = loadLearningState();
    expect(loaded.activePath).toBe('researcher');
    expect(loaded.bookmarks).toEqual(['nlp-transformers/04-self-attention']);
  });

  it('encodes visualization parameters deterministically', () => {
    const qs = encodeVizParams({ landscape: 'bowl', lr: 0.14, causal: true });
    expect(qs).toContain('landscape=bowl');
    expect(qs).toContain('lr=0.14');
    expect(qs).toContain('causal=true');
  });

  it('schedules spaced repetition intervals with SM-2-lite progression and caps', () => {
    const firstGood = scheduleNextReview(undefined, 'good', '2026-11-11');
    expect(firstGood.intervalDays).toBe(3);
    expect(firstGood.nextDue).toBe('2026-11-14');
    expect(firstGood.reps).toBe(1);

    const secondGood = scheduleNextReview(firstGood, 'good', '2026-11-14');
    expect(secondGood.intervalDays).toBe(6);
    expect(secondGood.nextDue).toBe('2026-11-20');

    const lapsed = scheduleNextReview(secondGood, 'again', '2026-11-20');
    expect(lapsed.intervalDays).toBe(0);
    expect(lapsed.reps).toBe(0);
    expect(lapsed.lapses).toBe(1);
    expect(lapsed.nextDue).toBe('2026-11-20');

    const capped = scheduleNextReview(
      { intervalDays: 120, reps: 5, lapses: 0, nextDue: '2026-11-11', lastReviewedAt: '2026-11-11T00:00:00.000Z' },
      'easy',
      '2026-11-11'
    );
    expect(capped.intervalDays).toBe(180);
  });

  it('computes quiz mastery accuracy and validates JSON backups strictly', () => {
    const stats = calculateQuizStats({
      'foundations/01-what-is-a-model': {
        completedAt: '2026-11-11T00:00:00.000Z',
        score: 2,
        totalQuestions: 3,
      },
      'foundations/02-math-essentials': {
        completedAt: '2026-11-11T00:00:00.000Z',
        score: 3,
        totalQuestions: 3,
      },
      'foundations/03-manual-complete': {
        completedAt: '2026-11-11T00:00:00.000Z',
        score: 0,
        totalQuestions: 0,
      },
    });
    expect(stats).toEqual({
      completedCount: 3,
      attemptedQuizzes: 2,
      totalCorrect: 5,
      totalQuestions: 6,
      accuracyPercent: 83,
    });

    expect(validateImportedState(null)).toBeNull();
    expect(validateImportedState([])).toBeNull();
    expect(validateImportedState({ version: 2 })).toBeNull();

    const restored = validateImportedState({
      version: 1,
      activePath: 'practitioner',
      onboardingComplete: true,
      bookmarks: ['classical-ml/02-gradient-descent', 123],
      reviewSchedule: {
        softmax: {
          intervalDays: 3,
          reps: 1,
          lapses: 0,
          nextDue: '2026-11-14',
          lastReviewedAt: '2026-11-11T00:00:00.000Z',
        },
      },
    });
    expect(restored?.activePath).toBe('practitioner');
    expect(restored?.bookmarks).toEqual(['classical-ml/02-gradient-descent']);
    expect(restored?.reviewSchedule.softmax?.intervalDays).toBe(3);
  });
});

