import { describe, it, expect } from 'vitest';
import {
  PLACEMENT_QUESTIONS,
  evaluatePlacement,
} from '@/lib/placement';

describe('Diagnostic Placement Assessment', () => {
  it('has 10 validated questions spanning 5 tiers', () => {
    expect(PLACEMENT_QUESTIONS.length).toBe(10);
    for (const q of PLACEMENT_QUESTIONS) {
      expect(q.options.length).toBe(4);
      expect(q.correctIndex).toBeGreaterThanOrEqual(0);
      expect(q.correctIndex).toBeLessThan(4);
      expect(q.question.length).toBeGreaterThan(10);
      expect(q.options[q.correctIndex]?.explanation.length).toBeGreaterThan(10);
    }
  });

  it('evaluates low score as Beginner (Scratch Foundations)', () => {
    const answers = [0, 1, 2, 3, 0, 1, 2, 3, 0, 1]; // mostly arbitrary/wrong
    const result = evaluatePlacement(answers);
    expect(result.level).toBe('beginner');
    expect(result.recommendedPathwayId).toBe('zero-to-hero');
    expect(result.recommendedStartUrl).toBe('/learn/foundations/01-what-is-a-model');
  });

  it('evaluates perfect score as Frontier AI Researcher', () => {
    const perfectAnswers = PLACEMENT_QUESTIONS.map((q) => q.correctIndex);
    const result = evaluatePlacement(perfectAnswers);
    expect(result.score).toBe(10);
    expect(result.level).toBe('researcher');
    expect(result.title).toContain('Frontier AI Researcher');
  });

  it('evaluates intermediate score as Practitioner', () => {
    const intermediateAnswers = PLACEMENT_QUESTIONS.map((q, idx) => (idx < 5 ? q.correctIndex : 999));
    const result = evaluatePlacement(intermediateAnswers);
    expect(result.score).toBe(5);
    expect(result.level).toBe('practitioner');
    expect(result.title).toContain('Machine Learning Practitioner');
  });
});

