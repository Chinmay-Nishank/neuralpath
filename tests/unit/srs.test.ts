import { describe, expect, it } from 'vitest';
import {
  addDaysToStudyDay,
  computeRetrievability,
  countTomorrowDueCards,
  createInitialCardState,
  formatNextReviewCountdown,
  getEarliestNextReviewDate,
  getStudyDayKey,
  getStudyDayStart,
  isCardDueOnStudyDay,
  scheduleAllRatings,
  scheduleCard,
  selectDueCardIds,
  type ReviewStoreData,
} from '@/lib/srs';

describe('FSRS scheduler (lib/srs.ts)', () => {
  it('applies 4:00 AM local day-boundary rollover accurately', () => {
    const beforeRollover = new Date(2026, 10, 12, 3, 59, 0);
    const atRollover = new Date(2026, 10, 12, 4, 0, 0);
    const lateEvening = new Date(2026, 10, 12, 23, 30, 0);

    expect(getStudyDayKey(beforeRollover)).toBe('2026-11-11');
    expect(getStudyDayKey(atRollover)).toBe('2026-11-12');
    expect(getStudyDayKey(lateEvening)).toBe('2026-11-12');
    expect(addDaysToStudyDay('2026-11-11', 4)).toBe('2026-11-15');
  });

  it('produces monotonic initial intervals with Good defaulting to 4 days', () => {
    const now = new Date(2026, 10, 11, 14, 0, 0);
    const init = createInitialCardState('gradient-descent:lr-too-high', 'classical-ml/02-gradient-descent', now);
    const previews = scheduleAllRatings(init, now);

    expect(previews[1].scheduledDays).toBe(0);
    expect(previews[1].intervalText).toBe('10 min');
    expect(previews[2].scheduledDays).toBe(1);
    expect(previews[2].intervalText).toBe('1 day');
    expect(previews[3].scheduledDays).toBe(4);
    expect(previews[3].intervalText).toBe('4 days');
    expect(previews[4].scheduledDays).toBe(9);
    expect(previews[4].intervalText).toBe('9 days');
  });

  it('grows intervals exponentially over successful reviews and differentiates Hard < Good < Easy', () => {
    const day0 = new Date(2026, 10, 11, 10, 0, 0);
    let card = createInitialCardState('gradient-descent:momentum', 'classical-ml/02-gradient-descent', day0);

    card = scheduleCard(card, 3, day0); // Good -> +4d
    expect(card.scheduledDays).toBe(4);
    expect(card.dueStudyDay).toBe('2026-11-15');
    expect(card.lapses).toBe(0);

    // At 3:59 AM on 2026-11-15, study day is still 2026-11-14 -> NOT due yet!
    const tooEarly = new Date(2026, 10, 15, 3, 59, 0);
    expect(isCardDueOnStudyDay(card, tooEarly)).toBe(false);

    // At 4:00 AM on 2026-11-15 -> DUE!
    const exactRollover = new Date(2026, 10, 15, 4, 0, 0);
    expect(isCardDueOnStudyDay(card, exactRollover)).toBe(true);

    const day4Options = scheduleAllRatings(card, exactRollover);
    expect(day4Options[2].scheduledDays).toBeLessThan(day4Options[3].scheduledDays);
    expect(day4Options[3].scheduledDays).toBeLessThan(day4Options[4].scheduledDays);
    expect(day4Options[3].scheduledDays).toBeGreaterThan(4);
  });

  it('records lapses cleanly on Again and schedules relearning same study day', () => {
    const day0 = new Date(2026, 10, 11, 10, 0, 0);
    let card = createInitialCardState('self-attention:scale', 'nlp-transformers/04-self-attention', day0);
    card = scheduleCard(card, 3, day0); // stability ~4.0
    const prevStability = card.stability;

    const day4 = new Date(2026, 10, 15, 10, 0, 0);
    card = scheduleCard(card, 1, day4); // Again!

    expect(card.status).toBe('relearning');
    expect(card.lapses).toBe(1);
    expect(card.scheduledDays).toBe(0);
    expect(card.dueStudyDay).toBe('2026-11-15');
    expect(card.stability).toBeLessThan(prevStability);
    expect(isCardDueOnStudyDay(card, day4)).toBe(true);
  });

  it('keeps FSRS retrievability calibrated at R(S, S) = 0.90', () => {
    expect(computeRetrievability(0, 5)).toBe(1);
    expect(computeRetrievability(4, 4)).toBeCloseTo(0.9, 5);
    expect(computeRetrievability(20, 20)).toBeCloseTo(0.9, 5);
  });

  it('respects completed lesson unlocking, daily new-card caps, and next-review countdowns', () => {
    const now = new Date(2026, 10, 12, 1, 0, 0); // 1:00 AM -> study day 2026-11-11
    const index = [
      { id: 'c1', lessonSlug: 'classical-ml/02-gradient-descent' },
      { id: 'c2', lessonSlug: 'classical-ml/02-gradient-descent' },
      { id: 'c3', lessonSlug: 'nlp-transformers/04-self-attention' },
    ];

    const c1Tomorrow = createInitialCardState('c1', 'classical-ml/02-gradient-descent', now);
    const tomorrowStart = getStudyDayStart('2026-11-12', 4); // 4:00 AM -> 3h away!
    const scheduledC1 = {
      ...c1Tomorrow,
      status: 'review' as const,
      stability: 4,
      scheduledDays: 1,
      dueStudyDay: '2026-11-12',
      dueAt: tomorrowStart.toISOString(),
      lastReviewedAt: new Date(2026, 10, 11, 22, 0, 0).toISOString(),
    };

    const storeData: ReviewStoreData = {
      version: 1,
      settings: { newCardsPerDay: 1 },
      cards: {
        c1: scheduledC1,
      },
      dailyUsage: {
        studyDay: '2026-11-11',
        newCardIds: ['c0'], // already used 1/1 daily quota
        reviewedCount: 1,
      },
    };

    // Only classical-ml/02-gradient-descent is completed; c2 capped by daily quota; c1 due at 4am
    const dueNow = selectDueCardIds(index, storeData, { 'classical-ml/02-gradient-descent': {} }, now);
    expect(dueNow).toEqual([]);

    const earliest = getEarliestNextReviewDate(
      index,
      storeData,
      { 'classical-ml/02-gradient-descent': {} },
      now
    );
    expect(earliest).not.toBeNull();
    expect(formatNextReviewCountdown(earliest!, now)).toBe('3h');

    // Tomorrow due count sees c1 (due at 4am) + c2 (1 new card within daily cap)
    const tomorrowDue = countTomorrowDueCards(
      index,
      storeData,
      { 'classical-ml/02-gradient-descent': {} },
      now
    );
    expect(tomorrowDue).toBe(2);
  });
});

