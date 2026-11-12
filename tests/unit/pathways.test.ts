import { describe, it, expect } from 'vitest';
import {
  LEARNING_PATHWAYS,
  getPathwayById,
  calculatePathwayProgress,
} from '@/lib/pathways';

describe('Learning Pathways System', () => {
  it('defines 5 structured pathways spanning scratch to advanced', () => {
    expect(LEARNING_PATHWAYS.length).toBe(5);
    const ids = LEARNING_PATHWAYS.map((p) => p.id);
    expect(ids).toContain('zero-to-hero');
    expect(ids).toContain('generative-ai-llm');
    expect(ids).toContain('computer-vision-multimodal');
    expect(ids).toContain('reinforcement-learning-alignment');
    expect(ids).toContain('mlops-production');
  });

  it('retrieves pathway by id', () => {
    const zeroToHero = getPathwayById('zero-to-hero');
    expect(zeroToHero).toBeDefined();
    expect(zeroToHero?.title).toContain('Zero to Hero');
    expect(zeroToHero?.modules.length).toBe(10);
    expect(zeroToHero?.startUrl).toBe('/learn/foundations/01-what-is-a-model');
  });

  it('calculates pathway progress accurately', () => {
    const pathway = LEARNING_PATHWAYS[0]!;
    const dummyLessons = [
      { routeId: 'foundations:01-what-is-a-model', module: 'foundations' },
      { routeId: 'foundations:02-python-for-ml', module: 'foundations' },
      { routeId: 'classical-ml:01-intro', module: 'classical-ml' },
    ];

    const completed = {
      'foundations:01-what-is-a-model': { score: 10, total: 10 },
    };

    const progress = calculatePathwayProgress(pathway, completed, dummyLessons);
    expect(progress.total).toBe(3);
    expect(progress.completed).toBe(1);
    expect(progress.percent).toBe(33);
    expect(progress.nextLessonRouteId).toBe('foundations:02-python-for-ml');
  });

  it('handles 100% completion cleanly', () => {
    const pathway = LEARNING_PATHWAYS[1]!; // gen ai
    const dummyLessons = [
      { routeId: 'deep-learning:01', module: 'deep-learning' },
    ];
    const completed = {
      'deep-learning:01': true,
    };
    const progress = calculatePathwayProgress(pathway, completed, dummyLessons);
    expect(progress.completed).toBe(1);
    expect(progress.percent).toBe(100);
    expect(progress.nextLessonRouteId).toBeUndefined();
  });
});

