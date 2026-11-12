import { z } from 'zod';

export const CardTypeSchema = z.enum(['recall', 'mcq', 'cloze']);
export type CardType = z.infer<typeof CardTypeSchema>;

export const CardSchema = z
  .object({
    id: z
      .string()
      .trim()
      .min(3)
      .regex(/^[a-z0-9-]+:[a-z0-9-]+$/, 'Card id must match "<lesson>:<slug>" format'),
    lessonSlug: z.string().trim().min(3),
    type: CardTypeSchema,
    front: z.string().trim().min(5),
    back: z.string().trim().min(1),
    options: z.array(z.string().trim().min(1)).optional(),
    correctIndex: z.number().int().min(0).optional(),
    explanation: z.string().trim().min(1).optional(),
    tags: z.array(z.string().trim().min(1)).optional(),
  })
  .superRefine((card, ctx) => {
    if (card.type === 'mcq') {
      if (!card.options || card.options.length < 2) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['options'],
          message: 'MCQ cards must specify at least 2 options',
        });
        return;
      }
      if (
        card.correctIndex === undefined ||
        card.correctIndex < 0 ||
        card.correctIndex >= card.options.length
      ) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['correctIndex'],
          message: 'MCQ cards require a valid correctIndex inside options',
        });
        return;
      }
      if (card.options[card.correctIndex] !== card.back) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['back'],
          message: 'MCQ card back must match options[correctIndex]',
        });
      }
    }

    if (card.type === 'cloze' && !card.front.includes('___')) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['front'],
        message: 'Cloze cards must contain a blank marker (at least "___") in front',
      });
    }
  });

export type Card = z.infer<typeof CardSchema>;

export const CardDeckFileSchema = z.array(CardSchema).min(1);

export interface CardMeta {
  id: string;
  lessonSlug: string;
}

export function validateCardCollections(decks: Card[][]): Card[] {
  const seenIds = new Set<string>();
  const flattened: Card[] = [];

  for (const deck of decks) {
    const parsed = CardDeckFileSchema.parse(deck);
    for (const card of parsed) {
      if (seenIds.has(card.id)) {
        throw new Error(`Duplicate spaced-repetition card id detected: "${card.id}"`);
      }
      seenIds.add(card.id);
      flattened.push(card);
    }
  }

  return flattened;
}

