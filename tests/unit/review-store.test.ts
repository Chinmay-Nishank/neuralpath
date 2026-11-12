import { describe, expect, it, beforeEach, vi } from 'vitest';
import {
  LocalReviewStore,
  REVIEW_STORE_EVENT,
  REVIEW_STORE_KEY,
  migrateReviewData,
} from '@/lib/review-store';
import { createInitialCardState, scheduleCard } from '@/lib/srs';

describe('LocalReviewStore & migrations', () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it('recovers gracefully when localStorage holds corrupt JSON or invalid shape', () => {
    window.localStorage.setItem(REVIEW_STORE_KEY, '{corrupt json!!');
    const store = new LocalReviewStore();
    const loaded = store.load();

    expect(loaded.version).toBe(1);
    expect(loaded.settings.newCardsPerDay).toBe(10);
    expect(loaded.cards).toEqual({});

    // Storage key should now be cleanly reset to valid serialized state
    const persisted = JSON.parse(window.localStorage.getItem(REVIEW_STORE_KEY) ?? '{}');
    expect(persisted.version).toBe(1);

    window.localStorage.setItem(REVIEW_STORE_KEY, JSON.stringify({ version: 999, cards: [] }));
    const resetAgain = store.load();
    expect(resetAgain.version).toBe(1);
    expect(resetAgain.cards).toEqual({});
  });

  it('migrates legacy version 0 review entries cleanly into version 1', () => {
    const migrated = migrateReviewData({
      version: 0,
      cards: {
        'gradient-descent:lr-too-high': {
          lessonSlug: 'classical-ml/02-gradient-descent',
          intervalDays: 4,
          reps: 2,
          lapses: 0,
          nextDue: '2026-11-15',
        },
      },
    });

    expect(migrated?.version).toBe(1);
    expect(migrated?.cards['gradient-descent:lr-too-high']?.status).toBe('review');
    expect(migrated?.cards['gradient-descent:lr-too-high']?.scheduledDays).toBe(4);
    expect(migrated?.cards['gradient-descent:lr-too-high']?.dueStudyDay).toBe('2026-11-15');
  });

  it('exports/imports JSON backups, dispatches custom sync events, and rejects invalid imports safely', () => {
    const store = new LocalReviewStore();
    const spy = vi.fn();
    window.addEventListener(REVIEW_STORE_EVENT, spy);

    const now = new Date(2026, 10, 11, 12, 0, 0);
    const data = store.load();
    const cardState = scheduleCard(
      createInitialCardState('gradient-descent:lr-too-high', 'classical-ml/02-gradient-descent', now),
      3,
      now
    );
    data.cards[cardState.cardId] = cardState;
    data.settings.newCardsPerDay = 15;
    store.save(data);

    expect(spy).toHaveBeenCalledTimes(1);

    const exported = store.exportJson();
    store.reset();
    expect(store.load().cards).toEqual({});

    const restored = store.importJson(exported);
    expect(restored.settings.newCardsPerDay).toBe(15);
    expect(restored.cards['gradient-descent:lr-too-high']?.scheduledDays).toBe(4);

    expect(() => store.importJson('{"version": 2}')).toThrow();
    // Valid existing store data remains untouched when import throws
    expect(store.load().cards['gradient-descent:lr-too-high']?.scheduledDays).toBe(4);

    window.removeEventListener(REVIEW_STORE_EVENT, spy);
  });
});

