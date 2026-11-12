import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { loadCardsFromDirectory, getAllCards } from '@/lib/cards';
import { validateCardCollections, type Card } from '@/lib/card-schema';

describe('Spaced-repetition card decks & Zod schema validation', () => {
  it('loads 8-12 valid cards each for foundations, gradient-descent, backpropagation, and self-attention', () => {
    const cards = loadCardsFromDirectory(path.join(process.cwd(), 'content', 'cards'));
    expect(cards.length).toBeGreaterThanOrEqual(32);

    const modelCards = cards.filter((c) => c.lessonSlug === 'foundations/01-what-is-a-model');
    const gdCards = cards.filter((c) => c.lessonSlug === 'classical-ml/02-gradient-descent');
    const bpCards = cards.filter((c) => c.lessonSlug === 'deep-learning/04-backpropagation');
    const attnCards = cards.filter((c) => c.lessonSlug === 'nlp-transformers/04-self-attention');

    expect(modelCards.length).toBe(8);
    expect(gdCards.length).toBe(10);
    expect(bpCards.length).toBe(8);
    expect(attnCards.length).toBe(10);
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

