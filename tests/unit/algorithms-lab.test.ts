import { describe, it, expect } from 'vitest';
import {
  SCRATCH_ALGORITHMS,
  getScratchAlgorithmById,
} from '@/lib/algorithms-lab';

describe('From-Scratch Algorithms Lab', () => {
  it('contains fundamental to advanced algorithms', () => {
    expect(SCRATCH_ALGORITHMS.length).toBeGreaterThanOrEqual(6);
    const ids = SCRATCH_ALGORITHMS.map((a) => a.id);
    expect(ids).toContain('linear-regression');
    expect(ids).toContain('logistic-regression');
    expect(ids).toContain('micro-autograd');
    expect(ids).toContain('two-layer-mlp');
    expect(ids).toContain('scaled-dot-product-attention');
    expect(ids).toContain('bpe-tokenizer');
  });

  it('each algorithm contains valid code, math, and exercise prompts', () => {
    for (const alg of SCRATCH_ALGORITHMS) {
      expect(alg.title.length).toBeGreaterThan(5);
      expect(alg.mathFormula.length).toBeGreaterThan(3);
      expect(alg.code.length).toBeGreaterThan(50);
      expect(alg.explanation.length).toBeGreaterThanOrEqual(2);
      expect(alg.exercisePrompt.length).toBeGreaterThan(10);
      expect(alg.lessonUrl.startsWith('/learn/')).toBe(true);
    }
  });

  it('retrieves algorithm by id', () => {
    const autograd = getScratchAlgorithmById('micro-autograd');
    expect(autograd).toBeDefined();
    expect(autograd?.title).toContain('Micro-Autograd');
    expect(autograd?.category).toBe('Deep Learning');
  });
});

