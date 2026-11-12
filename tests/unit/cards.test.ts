import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { loadCardsFromDirectory, getAllCards } from '@/lib/cards';
import { validateCardCollections, type Card } from '@/lib/card-schema';

describe('Spaced-repetition card decks & Zod schema validation', () => {
  it('loads 8-12 valid cards each across foundational, classical, deep learning, vision, and frontier modules', () => {
    const cards = loadCardsFromDirectory(path.join(process.cwd(), 'content', 'cards'));
    expect(cards.length).toBeGreaterThanOrEqual(80);

    const modelCards = cards.filter((c) => c.lessonSlug === 'foundations/01-what-is-a-model');
    const gdCards = cards.filter((c) => c.lessonSlug === 'classical-ml/02-gradient-descent');
    const bpCards = cards.filter((c) => c.lessonSlug === 'deep-learning/04-backpropagation');
    const convCards = cards.filter((c) => c.lessonSlug === 'computer-vision/01-convolutions-kernels');
    const attnCards = cards.filter((c) => c.lessonSlug === 'nlp-transformers/04-self-attention');
    const diffCards = cards.filter((c) => c.lessonSlug === 'generative-ai/03-diffusion-flow-matching');
    const rlCards = cards.filter((c) => c.lessonSlug === 'reinforcement-learning/01-mdps-bellman');
    const quantCards = cards.filter((c) => c.lessonSlug === 'mlops/03-quantization-pruning');
    const saeCards = cards.filter((c) => c.lessonSlug === 'ai-safety/03-mechanistic-interpretability');
    const capstoneCards = cards.filter((c) => c.lessonSlug === 'capstones/01-capstone-playbook');

    expect(modelCards.length).toBe(8);
    expect(gdCards.length).toBe(10);
    expect(bpCards.length).toBe(8);
    expect(convCards.length).toBe(8);
    expect(attnCards.length).toBe(10);
    expect(diffCards.length).toBe(8);
    expect(rlCards.length).toBe(8);
    expect(quantCards.length).toBe(8);
    expect(saeCards.length).toBe(8);
    expect(capstoneCards.length).toBe(8);
    expect(getAllCards().length).toBe(cards.length);
  });

  it('rejects duplicate card ids and malformed mcq/cloze shapes at validation time', () => {
    const validCard: Card = {
      id: 'lesson:one',
      lessonSlug: 'classical-ml/02-gradient-descent',
      type: 'recall',
      front: 'What is a gradient?',
      back: 'Vector of steepest ascent.',
    };

    expect(() => validateCardCollections([[validCard, validCard]])).toThrow(/Duplicate/);

    expect(() =>
      validateCardCollections([
        [
          {
            id: 'lesson:bad-mcq',
            lessonSlug: 'classical-ml/02-gradient-descent',
            type: 'mcq',
            front: 'Pick one option carefully?',
            options: ['Alpha', 'Beta'],
            correctIndex: 1,
            back: 'Alpha', // mismatch with options[1]!
          },
        ],
      ])
    ).toThrow();

    expect(() =>
      validateCardCollections([
        [
          {
            id: 'lesson:bad-cloze',
            lessonSlug: 'classical-ml/02-gradient-descent',
            type: 'cloze',
            front: 'No blank marker included here.',
            back: 'missing',
          },
        ],
      ])
    ).toThrow();
  });
});

