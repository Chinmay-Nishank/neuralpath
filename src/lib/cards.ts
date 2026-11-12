import fs from 'node:fs';
import path from 'node:path';
import { CardDeckFileSchema, validateCardCollections, type Card, type CardMeta } from './card-schema';

let cachedCards: Card[] | null = null;

export function loadCardsFromDirectory(cardsDir: string): Card[] {
  if (!fs.existsSync(cardsDir)) return [];

  const fileNames = fs
    .readdirSync(cardsDir)
    .filter((name) => name.endsWith('.json'))
    .sort();

  const decks: Card[][] = fileNames.map((fileName) => {
    const fullPath = path.join(cardsDir, fileName);
    const raw = fs.readFileSync(fullPath, 'utf8');
    let parsedJson: unknown;
    try {
      parsedJson = JSON.parse(raw);
    } catch (err) {
      throw new Error(
        `Invalid JSON in card deck ${fileName}: ${err instanceof Error ? err.message : String(err)}`
      );
    }

    const result = CardDeckFileSchema.safeParse(parsedJson);
    if (!result.success) {
      const firstIssue = result.error.issues[0];
      throw new Error(
        `Malformed card deck "${fileName}" (${firstIssue?.path.join('.') || 'root'}): ${firstIssue?.message ?? result.error.message}`
      );
    }
    return result.data;
  });

  return validateCardCollections(decks);
}

export function getAllCards(): Card[] {
  if (cachedCards && process.env.NODE_ENV === 'production') {
    return cachedCards;
  }

  const velitePath = path.join(process.cwd(), '.velite', 'cards.json');
  const cardsDir = path.join(process.cwd(), 'content', 'cards');

  let cards: Card[];
  if (fs.existsSync(cardsDir)) {
    cards = loadCardsFromDirectory(cardsDir);
  } else if (fs.existsSync(velitePath)) {
    const raw = JSON.parse(fs.readFileSync(velitePath, 'utf8')) as unknown;
    cards = validateCardCollections([CardDeckFileSchema.parse(raw)]);
  } else {
    cards = [];
  }

  cachedCards = cards;
  return cards;
}

export function getCardIndex(): CardMeta[] {
  return getAllCards().map(({ id, lessonSlug }) => ({ id, lessonSlug }));
}

export function getCardsForLesson(lessonSlug: string): Card[] {
  return getAllCards().filter((card) => card.lessonSlug === lessonSlug);
}

