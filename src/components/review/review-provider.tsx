'use client';

import * as React from 'react';
import type { CardMeta } from '@/lib/card-schema';
import {
  DEFAULT_NEW_CARDS_PER_DAY,
  MAX_NEW_CARDS_PER_DAY,
  MIN_NEW_CARDS_PER_DAY,
  createInitialCardState,
  getStudyDayKey,
  scheduleCard,
  selectDueCardIds,
  type CardProgressState,
  type DailyReviewUsage,
  type ReviewSettings,
  type ReviewStoreData,
  type SrsRating,
} from '@/lib/srs';
import {
  REVIEW_STORE_EVENT,
  REVIEW_STORE_KEY,
  createDefaultReviewStoreData,
  localReviewStore,
  normalizeDailyUsage,
  type ReviewStore,
} from '@/lib/review-store';
import { useProgress } from '@/components/progress/progress-provider';

export interface UndoReviewSnapshot {
  cardId: string;
  previousCardState: CardProgressState | undefined;
  previousDailyUsage: DailyReviewUsage;
}

interface ReviewContextValue {
  cardIndex: readonly CardMeta[];
  storeData: ReviewStoreData;
  hydrated: boolean;
  dueCardIds: string[];
  dueCount: number;
  dueByLesson: Record<string, number>;
  cardCountForLesson: (lessonSlug: string) => number;
  getCardState: (cardId: string) => CardProgressState | undefined;
  rateCard: (
    cardId: string,
    lessonSlug: string,
    rating: SrsRating,
    now?: Date
  ) => { nextState: CardProgressState; snapshot: UndoReviewSnapshot };
  restoreSnapshot: (snapshot: UndoReviewSnapshot) => void;
  enrollLessonCards: (lessonSlug: string) => string[];
  unEnrollNewLessonCards: (cardIds: string[]) => void;
  updateSettings: (partial: Partial<ReviewSettings>) => void;
  exportReviewJson: () => Promise<string>;
  importReviewJson: (jsonText: string) => Promise<{ ok: boolean; error?: string }>;
  resetReviewData: () => Promise<void>;
}

const DEFAULT_VALUE: ReviewContextValue = {
  cardIndex: [],
  storeData: createDefaultReviewStoreData(),
  hydrated: false,
  dueCardIds: [],
  dueCount: 0,
  dueByLesson: {},
  cardCountForLesson: () => 0,
  getCardState: () => undefined,
  rateCard: (cardId, lessonSlug) => {
    const state = createInitialCardState(cardId, lessonSlug);
    return {
      nextState: state,
      snapshot: {
        cardId,
        previousCardState: undefined,
        previousDailyUsage: { studyDay: getStudyDayKey(new Date()), newCardIds: [], reviewedCount: 0 },
      },
    };
  },
  restoreSnapshot: () => {},
  enrollLessonCards: () => [],
  unEnrollNewLessonCards: () => {},
  updateSettings: () => {},
  exportReviewJson: async () => '{}',
  importReviewJson: async () => ({ ok: false, error: 'Not initialized' }),
  resetReviewData: async () => {},
};

const ReviewContext = React.createContext<ReviewContextValue>(DEFAULT_VALUE);

export function useReview() {
  return React.useContext(ReviewContext);
}

export function ReviewProvider({
  cardIndex,
  store = localReviewStore,
  children,
}: {
  cardIndex: CardMeta[];
  store?: ReviewStore;
  children: React.ReactNode;
}) {
  const { state: progressState, hydrated: progressHydrated } = useProgress();
  const [storeData, setStoreData] = React.useState<ReviewStoreData>(() =>
    createDefaultReviewStoreData()
  );
  const [hydrated, setHydrated] = React.useState(false);

  const loadFromStore = React.useCallback(() => {
    const result = store.load();
    if (result instanceof Promise) {
      return result.then((loaded) => {
        setStoreData(loaded);
        setHydrated(true);
      });
    }
    setStoreData(result);
    setHydrated(true);
    return undefined;
  }, [store]);

  React.useEffect(() => {
    void loadFromStore();

    const onSync = () => {
      void loadFromStore();
    };
    const onStorage = (e: StorageEvent) => {
      if (e.key === REVIEW_STORE_KEY || e.key === null) {
        void loadFromStore();
      }
    };

    window.addEventListener(REVIEW_STORE_EVENT, onSync);
    window.addEventListener('storage', onStorage);
    return () => {
      window.removeEventListener(REVIEW_STORE_EVENT, onSync);
      window.removeEventListener('storage', onStorage);
    };
  }, [loadFromStore]);

  const storeDataRef = React.useRef(storeData);
  storeDataRef.current = storeData;

  const commit = React.useCallback(
    (updater: (prev: ReviewStoreData) => ReviewStoreData) => {
      const next = updater(storeDataRef.current);
      storeDataRef.current = next;
      setStoreData(next);
      void store.save(next);
      return next;
    },
    [store]
  );

  const cardCountByLesson = React.useMemo(() => {
    const counts = new Map<string, number>();
    for (const card of cardIndex) {
      counts.set(card.lessonSlug, (counts.get(card.lessonSlug) ?? 0) + 1);
    }
    return counts;
  }, [cardIndex]);

  const cardCountForLesson = React.useCallback(
    (lessonSlug: string) => cardCountByLesson.get(lessonSlug) ?? 0,
    [cardCountByLesson]
  );

  const dueCardIds = React.useMemo(() => {
    if (!hydrated || !progressHydrated) return [];
    return selectDueCardIds(cardIndex, storeData, progressState.completedLessons, new Date());
  }, [hydrated, progressHydrated, cardIndex, storeData, progressState.completedLessons]);

  const dueByLesson = React.useMemo(() => {
    const dueSet = new Set(dueCardIds);
    const map: Record<string, number> = {};
    for (const meta of cardIndex) {
      if (dueSet.has(meta.id)) {
        map[meta.lessonSlug] = (map[meta.lessonSlug] ?? 0) + 1;
      }
    }
    return map;
  }, [cardIndex, dueCardIds]);

  const getCardState = React.useCallback(
    (cardId: string) => storeData.cards[cardId],
    [storeData.cards]
  );

  const rateCard = React.useCallback(
    (cardId: string, lessonSlug: string, rating: SrsRating, now = new Date()) => {
      const prevData = storeDataRef.current;
      const previousCardState = prevData.cards[cardId];
      const previousDailyUsage = {
        ...prevData.dailyUsage,
        newCardIds: [...prevData.dailyUsage.newCardIds],
      };

      const currentCardState =
        previousCardState ?? createInitialCardState(cardId, lessonSlug, now);
      const isNewlyIntroduced = currentCardState.status === 'new';
      const nextCardState = scheduleCard(currentCardState, rating, now);

      commit((prev) => {
        const usage = normalizeDailyUsage(prev.dailyUsage, now);
        const newCardIds =
          isNewlyIntroduced && !usage.newCardIds.includes(cardId)
            ? [...usage.newCardIds, cardId]
            : usage.newCardIds;
        return {
          ...prev,
          cards: {
            ...prev.cards,
            [cardId]: nextCardState,
          },
          dailyUsage: {
            ...usage,
            newCardIds,
            reviewedCount: usage.reviewedCount + 1,
          },
        };
      });

      return {
        nextState: nextCardState,
        snapshot: {
          cardId,
          previousCardState,
          previousDailyUsage,
        },
      };
    },
    [commit]
  );

  const restoreSnapshot = React.useCallback(
    (snapshot: UndoReviewSnapshot) => {
      commit((prev) => {
        const nextCards = { ...prev.cards };
        if (snapshot.previousCardState) {
          nextCards[snapshot.cardId] = snapshot.previousCardState;
        } else {
          delete nextCards[snapshot.cardId];
        }
        return {
          ...prev,
          cards: nextCards,
          dailyUsage: snapshot.previousDailyUsage,
        };
      });
    },
    [commit]
  );

  const enrollLessonCards = React.useCallback(
    (lessonSlug: string) => {
      const addedCardIds: string[] = [];
      const now = new Date();
      const matching = cardIndex.filter((c) => c.lessonSlug === lessonSlug);
      if (matching.length === 0) return addedCardIds;

      commit((prev) => {
        const nextCards = { ...prev.cards };
        for (const meta of matching) {
          if (!nextCards[meta.id]) {
            nextCards[meta.id] = createInitialCardState(meta.id, lessonSlug, now);
            addedCardIds.push(meta.id);
          }
        }
        return {
          ...prev,
          cards: nextCards,
        };
      });
      return addedCardIds;
    },
    [cardIndex, commit]
  );

  const unEnrollNewLessonCards = React.useCallback(
    (cardIds: string[]) => {
      if (cardIds.length === 0) return;
      commit((prev) => {
        const nextCards = { ...prev.cards };
        for (const id of cardIds) {
          const existing = nextCards[id];
          if (existing && existing.status === 'new' && existing.reps === 0) {
            delete nextCards[id];
          }
        }
        return {
          ...prev,
          cards: nextCards,
        };
      });
    },
    [commit]
  );

  const updateSettings = React.useCallback(
    (partial: Partial<ReviewSettings>) => {
      commit((prev) => {
        const rawCap = partial.newCardsPerDay ?? prev.settings.newCardsPerDay ?? DEFAULT_NEW_CARDS_PER_DAY;
        const clampedCap = Math.min(
          MAX_NEW_CARDS_PER_DAY,
          Math.max(MIN_NEW_CARDS_PER_DAY, Math.round(rawCap))
        );
        return {
          ...prev,
          settings: {
            ...prev.settings,
            ...partial,
            newCardsPerDay: clampedCap,
          },
        };
      });
    },
    [commit]
  );

  const exportReviewJson = React.useCallback(async () => {
    return await Promise.resolve(store.exportJson());
  }, [store]);

  const importReviewJson = React.useCallback(
    async (jsonText: string) => {
      try {
        const imported = await Promise.resolve(store.importJson(jsonText));
        storeDataRef.current = imported;
        setStoreData(imported);
        return { ok: true };
      } catch (err) {
        return {
          ok: false,
          error: err instanceof Error ? err.message : 'Unable to import review JSON.',
        };
      }
    },
    [store]
  );

  const resetReviewData = React.useCallback(async () => {
    const fresh = await Promise.resolve(store.reset());
    storeDataRef.current = fresh;
    setStoreData(fresh);
  }, [store]);

  const value = React.useMemo<ReviewContextValue>(
    () => ({
      cardIndex,
      storeData,
      hydrated: hydrated && progressHydrated,
      dueCardIds,
      dueCount: dueCardIds.length,
      dueByLesson,
      cardCountForLesson,
      getCardState,
      rateCard,
      restoreSnapshot,
      enrollLessonCards,
      unEnrollNewLessonCards,
      updateSettings,
      exportReviewJson,
      importReviewJson,
      resetReviewData,
    }),
    [
      cardIndex,
      storeData,
      hydrated,
      progressHydrated,
      dueCardIds,
      dueByLesson,
      cardCountForLesson,
      getCardState,
      rateCard,
      restoreSnapshot,
      enrollLessonCards,
      unEnrollNewLessonCards,
      updateSettings,
      exportReviewJson,
      importReviewJson,
      resetReviewData,
    ]
  );

  return <ReviewContext.Provider value={value}>{children}</ReviewContext.Provider>;
}
