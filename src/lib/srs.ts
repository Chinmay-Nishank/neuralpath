import type { CardMeta } from './card-schema';

export type SrsRating = 1 | 2 | 3 | 4; // 1=Again, 2=Hard, 3=Good, 4=Easy
export type CardStatus = 'new' | 'learning' | 'review' | 'relearning';

export interface CardProgressState {
  cardId: string;
  lessonSlug: string;
  status: CardStatus;
  stability: number;
  difficulty: number;
  reps: number;
  lapses: number;
  elapsedDays: number;
  scheduledDays: number;
  dueAt: string;
  dueStudyDay: string;
  lastReviewedAt: string | null;
}

export interface ReviewSettings {
  newCardsPerDay: number;
}

export interface DailyReviewUsage {
  studyDay: string;
  newCardIds: string[];
  reviewedCount: number;
}

export interface ReviewStoreData {
  version: 1;
  settings: ReviewSettings;
  cards: Record<string, CardProgressState>;
  dailyUsage: DailyReviewUsage;
}

export interface RatingPreview {
  rating: SrsRating;
  label: 'Again' | 'Hard' | 'Good' | 'Easy';
  scheduledDays: number;
  intervalText: string;
  nextState: CardProgressState;
}

export interface FsrsParameters {
  requestRetention: number;
  maximumIntervalDays: number;
  rolloverHour: number;
  relearnDelayMinutes: number;
  initialStability: readonly [number, number, number, number];
  initialDifficultyBase: number;
  initialDifficultyStep: number;
  difficultyDelta: number;
  difficultyMeanReversion: number;
  stabilityGainExp: number;
  stabilityDecayExp: number;
  retrievabilityExp: number;
  hardMultiplier: number;
  easyMultiplier: number;
  lapseRetentionFactor: number;
}

export const DEFAULT_FSRS_PARAMS: FsrsParameters = {
  requestRetention: 0.9,
  maximumIntervalDays: 365,
  rolloverHour: 4,
  relearnDelayMinutes: 10,
  initialStability: [0.4, 1.2, 4.0, 9.0],
  initialDifficultyBase: 5.0,
  initialDifficultyStep: 1.05,
  difficultyDelta: 0.85,
  difficultyMeanReversion: 0.12,
  stabilityGainExp: 0.35,
  stabilityDecayExp: 0.18,
  retrievabilityExp: 1.0,
  hardMultiplier: 0.72,
  easyMultiplier: 1.45,
  lapseRetentionFactor: 0.35,
};

export const DEFAULT_NEW_CARDS_PER_DAY = 10;
export const MIN_NEW_CARDS_PER_DAY = 1;
export const MAX_NEW_CARDS_PER_DAY = 50;

const MS_PER_MINUTE = 60_000;
const MS_PER_HOUR = 3_600_000;
const MS_PER_DAY = 86_400_000;
const FSRS_FACTOR = 19 / 81;
const FSRS_DECAY = -0.5;

const RATING_LABELS: Record<SrsRating, 'Again' | 'Hard' | 'Good' | 'Easy'> = {
  1: 'Again',
  2: 'Hard',
  3: 'Good',
  4: 'Easy',
};

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

function roundTo2(value: number): number {
  return Math.round(value * 100) / 100;
}

/**
 * Local study day key using a 4:00 AM rollover boundary.
 * E.g. 02:30 AM on Nov 12 belongs to study day "2026-11-11".
 */
export function getStudyDayKey(date: Date, rolloverHour = DEFAULT_FSRS_PARAMS.rolloverHour): string {
  const cursor = new Date(date.getTime());
  if (cursor.getHours() < rolloverHour) {
    cursor.setDate(cursor.getDate() - 1);
  }
  const y = cursor.getFullYear();
  const m = String(cursor.getMonth() + 1).padStart(2, '0');
  const d = String(cursor.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export function getStudyDayStart(
  studyDayKey: string,
  rolloverHour = DEFAULT_FSRS_PARAMS.rolloverHour
): Date {
  const parts = studyDayKey.split('-');
  const y = Number(parts[0]);
  const m = Number(parts[1]) - 1;
  const d = Number(parts[2]);
  return new Date(y, m, d, rolloverHour, 0, 0, 0);
}

export function addDaysToStudyDay(studyDayKey: string, days: number): string {
  const noon = getStudyDayStart(studyDayKey, 12);
  noon.setDate(noon.getDate() + days);
  const y = noon.getFullYear();
  const m = String(noon.getMonth() + 1).padStart(2, '0');
  const d = String(noon.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export function createInitialCardState(
  cardId: string,
  lessonSlug: string,
  now: Date = new Date(),
  rolloverHour = DEFAULT_FSRS_PARAMS.rolloverHour
): CardProgressState {
  const studyDay = getStudyDayKey(now, rolloverHour);
  return {
    cardId,
    lessonSlug,
    status: 'new',
    stability: 0,
    difficulty: DEFAULT_FSRS_PARAMS.initialDifficultyBase,
    reps: 0,
    lapses: 0,
    elapsedDays: 0,
    scheduledDays: 0,
    dueAt: now.toISOString(),
    dueStudyDay: studyDay,
    lastReviewedAt: null,
  };
}

/**
 * FSRS power-law forgetting curve:
 * R(t, S) = (1 + (19/81) * (t / S))^-0.5
 * Guarantees R(S, S) = 0.90.
 */
export function computeRetrievability(elapsedDays: number, stability: number): number {
  if (stability <= 0) return 0;
  const t = Math.max(0, elapsedDays);
  return Math.pow(1 + FSRS_FACTOR * (t / stability), FSRS_DECAY);
}

function nextIntervalFromStability(
  stability: number,
  params: FsrsParameters,
  minDays = 1
): number {
  const ratio = (Math.pow(params.requestRetention, 1 / FSRS_DECAY) - 1) / FSRS_FACTOR;
  const raw = Math.round(stability * ratio);
  return clamp(raw, minDays, params.maximumIntervalDays);
}

function nextDifficulty(prevDifficulty: number, rating: SrsRating, params: FsrsParameters): number {
  const dRaw = clamp(prevDifficulty - params.difficultyDelta * (rating - 3), 1, 10);
  const target = params.initialDifficultyBase;
  return roundTo2(
    clamp(params.difficultyMeanReversion * target + (1 - params.difficultyMeanReversion) * dRaw, 1, 10)
  );
}

function nextRecallStability(
  stability: number,
  difficulty: number,
  retrievability: number,
  rating: 2 | 3 | 4,
  params: FsrsParameters
): number {
  const multiplier =
    rating === 2 ? params.hardMultiplier : rating === 4 ? params.easyMultiplier : 1.0;
  const effectiveR = Math.min(retrievability, 0.92);
  const gain =
    Math.exp(params.stabilityGainExp) *
    (11 - difficulty) *
    Math.pow(Math.max(0.2, stability), -params.stabilityDecayExp) *
    (Math.exp(params.retrievabilityExp * (1 - effectiveR)) - 1) *
    multiplier;
  return roundTo2(clamp(stability * (1 + gain), 0.2, params.maximumIntervalDays * 2));
}

export function formatIntervalText(
  scheduledDays: number,
  rating: SrsRating,
  params: FsrsParameters = DEFAULT_FSRS_PARAMS
): string {
  if (rating === 1 && scheduledDays === 0) {
    return `${params.relearnDelayMinutes} min`;
  }
  if (scheduledDays <= 1) return '1 day';
  return `${scheduledDays} days`;
}

/**
 * Pure FSRS state transition returning all 4 rating outcomes cleanly sorted & monotonic.
 */
export function scheduleAllRatings(
  prev: CardProgressState,
  now: Date = new Date(),
  params: FsrsParameters = DEFAULT_FSRS_PARAMS
): Record<SrsRating, RatingPreview> {
  const currentStudyDay = getStudyDayKey(now, params.rolloverHour);
  const reviewedAtIso = now.toISOString();

  if (prev.status === 'new') {
    const againState: CardProgressState = {
      ...prev,
      status: 'relearning',
      stability: params.initialStability[0],
      difficulty: roundTo2(clamp(params.initialDifficultyBase + 2 * params.initialDifficultyStep, 1, 10)),
      reps: prev.reps + 1,
      lapses: prev.lapses + 1,
      elapsedDays: 0,
      scheduledDays: 0,
      dueAt: new Date(now.getTime() + params.relearnDelayMinutes * MS_PER_MINUTE).toISOString(),
      dueStudyDay: currentStudyDay,
      lastReviewedAt: reviewedAtIso,
    };

    const buildNewRecall = (rating: 2 | 3 | 4, days: number): CardProgressState => {
      const dueStudyDay = addDaysToStudyDay(currentStudyDay, days);
      return {
        ...prev,
        status: 'review',
        stability: roundTo2(params.initialStability[rating - 1] ?? days),
        difficulty: roundTo2(
          clamp(params.initialDifficultyBase - (rating - 3) * params.initialDifficultyStep, 1, 10)
        ),
        reps: prev.reps + 1,
        elapsedDays: 0,
        scheduledDays: days,
        dueStudyDay,
        dueAt: getStudyDayStart(dueStudyDay, params.rolloverHour).toISOString(),
        lastReviewedAt: reviewedAtIso,
      };
    };

    const hardDays = Math.max(1, Math.round(params.initialStability[1]));
    const goodDays = Math.max(hardDays + 1, Math.round(params.initialStability[2]));
    const easyDays = Math.max(goodDays + 1, Math.round(params.initialStability[3]));

    const hardState = buildNewRecall(2, hardDays);
    const goodState = buildNewRecall(3, goodDays);
    const easyState = buildNewRecall(4, easyDays);

    return {
      1: {
        rating: 1,
        label: RATING_LABELS[1],
        scheduledDays: 0,
        intervalText: formatIntervalText(0, 1, params),
        nextState: againState,
      },
      2: {
        rating: 2,
        label: RATING_LABELS[2],
        scheduledDays: hardDays,
        intervalText: formatIntervalText(hardDays, 2, params),
        nextState: hardState,
      },
      3: {
        rating: 3,
        label: RATING_LABELS[3],
        scheduledDays: goodDays,
        intervalText: formatIntervalText(goodDays, 3, params),
        nextState: goodState,
      },
      4: {
        rating: 4,
        label: RATING_LABELS[4],
        scheduledDays: easyDays,
        intervalText: formatIntervalText(easyDays, 4, params),
        nextState: easyState,
      },
    };
  }

  const lastMs = prev.lastReviewedAt ? new Date(prev.lastReviewedAt).getTime() : now.getTime();
  const elapsedDays = roundTo2(Math.max(0, (now.getTime() - lastMs) / MS_PER_DAY));
  const R = computeRetrievability(elapsedDays, Math.max(0.2, prev.stability));

  const lapseStability = roundTo2(
    clamp(
      prev.stability * params.lapseRetentionFactor * (1 + (1 - R)),
      0.25,
      Math.max(0.25, prev.stability)
    )
  );
  const againState: CardProgressState = {
    ...prev,
    status: 'relearning',
    stability: lapseStability,
    difficulty: nextDifficulty(prev.difficulty, 1, params),
    reps: prev.reps + 1,
    lapses: prev.lapses + 1,
    elapsedDays,
    scheduledDays: 0,
    dueStudyDay: currentStudyDay,
    dueAt: new Date(now.getTime() + params.relearnDelayMinutes * MS_PER_MINUTE).toISOString(),
    lastReviewedAt: reviewedAtIso,
  };

  const sHard = nextRecallStability(prev.stability, prev.difficulty, R, 2, params);
  const sGood = nextRecallStability(prev.stability, prev.difficulty, R, 3, params);
  const sEasy = nextRecallStability(prev.stability, prev.difficulty, R, 4, params);

  const hardDays = nextIntervalFromStability(sHard, params, 1);
  const goodFloor = Math.max(hardDays + 1, prev.scheduledDays >= 1 ? prev.scheduledDays + 1 : 2);
  const goodDays = clamp(
    Math.max(goodFloor, nextIntervalFromStability(sGood, params, goodFloor)),
    1,
    params.maximumIntervalDays
  );
  const easyFloor = Math.max(goodDays + 1, goodDays + 2);
  const easyDays = clamp(
    Math.max(easyFloor, nextIntervalFromStability(sEasy, params, easyFloor)),
    1,
    params.maximumIntervalDays
  );

  const buildRecall = (
    rating: 2 | 3 | 4,
    nextStabilityVal: number,
    days: number
  ): CardProgressState => {
    const dueStudyDay = addDaysToStudyDay(currentStudyDay, days);
    return {
      ...prev,
      status: 'review',
      stability: nextStabilityVal,
      difficulty: nextDifficulty(prev.difficulty, rating, params),
      reps: prev.reps + 1,
      elapsedDays,
      scheduledDays: days,
      dueStudyDay,
      dueAt: getStudyDayStart(dueStudyDay, params.rolloverHour).toISOString(),
      lastReviewedAt: reviewedAtIso,
    };
  };

  return {
    1: {
      rating: 1,
      label: RATING_LABELS[1],
      scheduledDays: 0,
      intervalText: formatIntervalText(0, 1, params),
      nextState: againState,
    },
    2: {
      rating: 2,
      label: RATING_LABELS[2],
      scheduledDays: hardDays,
      intervalText: formatIntervalText(hardDays, 2, params),
      nextState: buildRecall(2, sHard, hardDays),
    },
    3: {
      rating: 3,
      label: RATING_LABELS[3],
      scheduledDays: goodDays,
      intervalText: formatIntervalText(goodDays, 3, params),
      nextState: buildRecall(3, sGood, goodDays),
    },
    4: {
      rating: 4,
      label: RATING_LABELS[4],
      scheduledDays: easyDays,
      intervalText: formatIntervalText(easyDays, 4, params),
      nextState: buildRecall(4, sEasy, easyDays),
    },
  };
}

export function scheduleCard(
  prev: CardProgressState,
  rating: SrsRating,
  now: Date = new Date(),
  params: FsrsParameters = DEFAULT_FSRS_PARAMS
): CardProgressState {
  return scheduleAllRatings(prev, now, params)[rating].nextState;
}

export function isCardDueOnStudyDay(
  card: CardProgressState | undefined,
  now: Date,
  rolloverHour = DEFAULT_FSRS_PARAMS.rolloverHour
): boolean {
  if (!card || card.status === 'new') return false;
  if (card.status === 'relearning') {
    const currentStudyDay = getStudyDayKey(now, rolloverHour);
    return card.dueStudyDay <= currentStudyDay;
  }
  const currentStudyDay = getStudyDayKey(now, rolloverHour);
  return card.dueStudyDay <= currentStudyDay;
}

export function selectDueCardIds(
  cardIndex: readonly CardMeta[],
  storeData: ReviewStoreData,
  completedLessons: Record<string, unknown>,
  now: Date = new Date(),
  rolloverHour = DEFAULT_FSRS_PARAMS.rolloverHour
): string[] {
  const currentStudyDay = getStudyDayKey(now, rolloverHour);
  const unlocked = cardIndex.filter((c) => Boolean(completedLessons[c.lessonSlug]));
  if (unlocked.length === 0) return [];

  const dueExisting: string[] = [];
  const availableNew: string[] = [];

  for (const meta of unlocked) {
    const state = storeData.cards[meta.id];
    if (!state || state.status === 'new') {
      availableNew.push(meta.id);
    } else if (isCardDueOnStudyDay(state, now, rolloverHour)) {
      dueExisting.push(meta.id);
    }
  }

  // Sort due review cards cleanly by due timestamp ascending (most overdue / relearning first).
  dueExisting.sort((a, b) => {
    const ca = storeData.cards[a];
    const cb = storeData.cards[b];
    if (!ca || !cb) return 0;
    return ca.dueAt.localeCompare(cb.dueAt);
  });

  const introducedToday =
    storeData.dailyUsage.studyDay === currentStudyDay
      ? storeData.dailyUsage.newCardIds.length
      : 0;
  const remainingNewQuota = Math.max(0, storeData.settings.newCardsPerDay - introducedToday);
  const admittedNew = availableNew.slice(0, remainingNewQuota);

  return [...dueExisting, ...admittedNew];
}

export function countTomorrowDueCards(
  cardIndex: readonly CardMeta[],
  storeData: ReviewStoreData,
  completedLessons: Record<string, unknown>,
  now: Date = new Date(),
  rolloverHour = DEFAULT_FSRS_PARAMS.rolloverHour
): number {
  const todayKey = getStudyDayKey(now, rolloverHour);
  const tomorrowStart = getStudyDayStart(addDaysToStudyDay(todayKey, 1), rolloverHour);
  let dueExisting = 0;
  let newRemaining = 0;

  for (const meta of cardIndex) {
    if (!completedLessons[meta.lessonSlug]) continue;
    const state = storeData.cards[meta.id];
    if (!state || state.status === 'new') {
      newRemaining += 1;
    } else if (isCardDueOnStudyDay(state, tomorrowStart, rolloverHour)) {
      dueExisting += 1;
    }
  }

  return dueExisting + Math.min(newRemaining, storeData.settings.newCardsPerDay);
}

export function getEarliestNextReviewDate(
  cardIndex: readonly CardMeta[],
  storeData: ReviewStoreData,
  completedLessons: Record<string, unknown>,
  now: Date = new Date(),
  rolloverHour = DEFAULT_FSRS_PARAMS.rolloverHour
): Date | null {
  let earliestMs = Infinity;
  let hasUnseenNew = false;

  for (const meta of cardIndex) {
    if (!completedLessons[meta.lessonSlug]) continue;
    const state = storeData.cards[meta.id];
    if (!state || state.status === 'new') {
      hasUnseenNew = true;
      continue;
    }
    const dueMs = new Date(state.dueAt).getTime();
    if (!Number.isNaN(dueMs) && dueMs > now.getTime() && dueMs < earliestMs) {
      earliestMs = dueMs;
    }
  }

  // If new cards remain blocked solely by today's daily quota, next quota opens tomorrow 4am!
  if (hasUnseenNew) {
    const todayKey = getStudyDayKey(now, rolloverHour);
    const tomorrowRollover = getStudyDayStart(addDaysToStudyDay(todayKey, 1), rolloverHour).getTime();
    if (tomorrowRollover < earliestMs) {
      earliestMs = tomorrowRollover;
    }
  }

  return Number.isFinite(earliestMs) ? new Date(earliestMs) : null;
}

export function formatNextReviewCountdown(targetDate: Date, now: Date = new Date()): string {
  const diffMs = Math.max(0, targetDate.getTime() - now.getTime());
  if (diffMs < MS_PER_MINUTE) return '1m';
  if (diffMs < MS_PER_HOUR) return `${Math.ceil(diffMs / MS_PER_MINUTE)}m`;
  if (diffMs < MS_PER_DAY) return `${Math.max(1, Math.round(diffMs / MS_PER_HOUR))}h`;
  return `${Math.max(1, Math.round(diffMs / MS_PER_DAY))}d`;
}

