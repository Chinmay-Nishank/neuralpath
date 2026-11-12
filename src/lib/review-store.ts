import { z } from 'zod';
import {
  DEFAULT_NEW_CARDS_PER_DAY,
  MAX_NEW_CARDS_PER_DAY,
  MIN_NEW_CARDS_PER_DAY,
  addDaysToStudyDay,
  createInitialCardState,
  getStudyDayKey,
  getStudyDayStart,
  type CardProgressState,
  type DailyReviewUsage,
  type ReviewStoreData,
} from './srs';

export const REVIEW_STORE_KEY = 'neuralpath.review.v1';
export const REVIEW_STORE_EVENT = 'neuralpath:review-store-updated';

export interface ReviewStore {
  load(): Promise<ReviewStoreData> | ReviewStoreData;
  save(data: ReviewStoreData): Promise<void> | void;
  reset(): Promise<ReviewStoreData> | ReviewStoreData;
  exportJson(): Promise<string> | string;
  importJson(jsonText: string): Promise<ReviewStoreData> | ReviewStoreData;
}

const CardProgressStateSchema = z.object({
  cardId: z.string().min(1),
  lessonSlug: z.string().min(1),
  status: z.enum(['new', 'learning', 'review', 'relearning']),
  stability: z.number().finite().min(0),
  difficulty: z.number().finite().min(1).max(10),
  reps: z.number().int().min(0),
  lapses: z.number().int().min(0),
  elapsedDays: z.number().finite().min(0),
  scheduledDays: z.number().int().min(0),
  dueAt: z.string().min(1),
  dueStudyDay: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  lastReviewedAt: z.string().nullable(),
});

export const ReviewStoreDataSchema = z.object({
  version: z.literal(1),
  settings: z.object({
    newCardsPerDay: z.number().int().min(MIN_NEW_CARDS_PER_DAY).max(MAX_NEW_CARDS_PER_DAY),
  }),
  cards: z.record(z.string(), CardProgressStateSchema),
  dailyUsage: z.object({
    studyDay: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
    newCardIds: z.array(z.string()),
    reviewedCount: z.number().int().min(0),
  }),
});

export function createDefaultReviewStoreData(now: Date = new Date()): ReviewStoreData {
  return {
    version: 1,
    settings: {
      newCardsPerDay: DEFAULT_NEW_CARDS_PER_DAY,
    },
    cards: {},
    dailyUsage: {
      studyDay: getStudyDayKey(now),
      newCardIds: [],
      reviewedCount: 0,
    },
  };
}

function clampDailyCap(value: number): number {
  return Math.min(MAX_NEW_CARDS_PER_DAY, Math.max(MIN_NEW_CARDS_PER_DAY, Math.round(value)));
}

/**
 * Supports v0 -> v1 migration cleanly and returns null when data is structurally corrupt.
 */
export function migrateReviewData(raw: unknown, now: Date = new Date()): ReviewStoreData | null {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) {
    return null;
  }

  const obj = raw as Record<string, unknown>;

  if (obj.version === 0 && obj.cards && typeof obj.cards === 'object' && !Array.isArray(obj.cards)) {
    const migratedCards: Record<string, CardProgressState> = {};
    for (const [cardId, legacy] of Object.entries(obj.cards as Record<string, unknown>)) {
      if (!legacy || typeof legacy !== 'object') continue;
      const item = legacy as Record<string, unknown>;
      const lessonSlug =
        typeof item.lessonSlug === 'string' && item.lessonSlug.length > 0
          ? item.lessonSlug
          : 'classical-ml/02-gradient-descent';
      const intervalDays =
        typeof item.intervalDays === 'number' && Number.isFinite(item.intervalDays)
          ? Math.max(0, Math.round(item.intervalDays))
          : 0;
      const studyDay = getStudyDayKey(now);
      const dueStudyDay =
        typeof item.nextDue === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(item.nextDue)
          ? item.nextDue
          : addDaysToStudyDay(studyDay, intervalDays);
      migratedCards[cardId] = {
        ...createInitialCardState(cardId, lessonSlug, now),
        status: intervalDays > 0 ? 'review' : 'new',
        stability: Math.max(0.4, intervalDays),
        reps: typeof item.reps === 'number' ? Math.max(0, Math.round(item.reps)) : 0,
        lapses: typeof item.lapses === 'number' ? Math.max(0, Math.round(item.lapses)) : 0,
        scheduledDays: intervalDays,
        dueStudyDay,
        dueAt: getStudyDayStart(dueStudyDay).toISOString(),
        lastReviewedAt: typeof item.lastReviewedAt === 'string' ? item.lastReviewedAt : null,
      };
    }

    return {
      version: 1,
      settings: { newCardsPerDay: DEFAULT_NEW_CARDS_PER_DAY },
      cards: migratedCards,
      dailyUsage: {
        studyDay: getStudyDayKey(now),
        newCardIds: [],
        reviewedCount: 0,
      },
    };
  }

  if (obj.version !== 1) {
    return null;
  }

  const normalizedSettings =
    obj.settings && typeof obj.settings === 'object' && !Array.isArray(obj.settings)
      ? {
          newCardsPerDay:
            typeof (obj.settings as Record<string, unknown>).newCardsPerDay === 'number'
              ? clampDailyCap((obj.settings as Record<string, unknown>).newCardsPerDay as number)
              : DEFAULT_NEW_CARDS_PER_DAY,
        }
      : { newCardsPerDay: DEFAULT_NEW_CARDS_PER_DAY };

  const candidate = {
    version: 1,
    settings: normalizedSettings,
    cards: obj.cards,
    dailyUsage: obj.dailyUsage ?? {
      studyDay: getStudyDayKey(now),
      newCardIds: [],
      reviewedCount: 0,
    },
  };

  const parsed = ReviewStoreDataSchema.safeParse(candidate);
  if (!parsed.success) return null;

  return parsed.data;
}

export function normalizeDailyUsage(usage: DailyReviewUsage, now: Date = new Date()): DailyReviewUsage {
  const currentDay = getStudyDayKey(now);
  if (usage.studyDay === currentDay) return usage;
  return {
    studyDay: currentDay,
    newCardIds: [],
    reviewedCount: 0,
  };
}

function dispatchSyncEvent() {
  if (typeof window === 'undefined') return;
  window.dispatchEvent(new CustomEvent(REVIEW_STORE_EVENT));
}

export class LocalReviewStore implements ReviewStore {
  constructor(private readonly storageKey = REVIEW_STORE_KEY) {}

  load(): ReviewStoreData {
    if (typeof window === 'undefined') return createDefaultReviewStoreData();
    try {
      const raw = window.localStorage.getItem(this.storageKey);
      if (!raw) return createDefaultReviewStoreData();
      const parsed = JSON.parse(raw) as unknown;
      const migrated = migrateReviewData(parsed);
      if (!migrated) {
        // Corrupt data: reset key cleanly instead of crashing.
        return this.reset();
      }
      const currentUsage = normalizeDailyUsage(migrated.dailyUsage);
      if (currentUsage !== migrated.dailyUsage) {
        const rolled = { ...migrated, dailyUsage: currentUsage };
        this.save(rolled);
        return rolled;
      }
      return migrated;
    } catch {
      return this.reset();
    }
  }

  save(data: ReviewStoreData): void {
    if (typeof window === 'undefined') return;
    try {
      window.localStorage.setItem(this.storageKey, JSON.stringify(data));
      dispatchSyncEvent();
    } catch {
      // Ignore quota / private browsing errors cleanly
    }
  }

  reset(): ReviewStoreData {
    const fresh = createDefaultReviewStoreData();
    if (typeof window !== 'undefined') {
      try {
        window.localStorage.setItem(this.storageKey, JSON.stringify(fresh));
        dispatchSyncEvent();
      } catch {
        // Non-fatal in private mode
      }
    }
    return fresh;
  }

  exportJson(): string {
    return JSON.stringify(this.load(), null, 2);
  }

  importJson(jsonText: string): ReviewStoreData {
    const parsed = JSON.parse(jsonText) as unknown;
    const migrated = migrateReviewData(parsed);
    if (!migrated) {
      throw new Error('Invalid review backup format or unsupported schema version.');
    }
    this.save(migrated);
    return migrated;
  }
}

export const localReviewStore = new LocalReviewStore();

