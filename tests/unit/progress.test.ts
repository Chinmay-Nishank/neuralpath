import { describe, expect, it, beforeEach } from 'vitest';
import {
  calculateStreak,
  encodeVizParams,
  loadLearningState,
  saveLearningState,
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
});

