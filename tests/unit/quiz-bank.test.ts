import { describe, expect, it } from 'vitest';
import { buildInterleavedSession, extractPracticeQuizBank } from '@/lib/quiz-bank';

describe('Interleaved Quiz Bank Extractor', () => {
  it('extracts structured quiz items cleanly across published MDX lessons', () => {
    const bank = extractPracticeQuizBank();
    expect(bank.length).toBeGreaterThanOrEqual(120);

    const uniqueModules = new Set(bank.map((b) => b.moduleId));
    expect(uniqueModules.size).toBeGreaterThanOrEqual(8);
  });

  it('interleaves questions across modules without clustering', () => {
    const bank = extractPracticeQuizBank();
    const session = buildInterleavedSession(bank, 6, 1);
    expect(session.length).toBe(6);

    const distinctModules = new Set(session.map((s) => s.moduleId));
    expect(distinctModules.size).toBeGreaterThanOrEqual(5);
  });
});

