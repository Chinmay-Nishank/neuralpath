'use client';

export type ConsentStatus = 'pending' | 'granted' | 'denied';

export interface QuizRecord {
  completedAt: string;
  score: number;
  totalQuestions: number;
}

export type LearningPathId = 'beginner' | 'practitioner' | 'researcher';

export type ReviewRating = 'again' | 'hard' | 'good' | 'easy';

export interface ReviewCardState {
  intervalDays: number;
  reps: number;
  lapses: number;
  nextDue: string;
  lastReviewedAt: string;
}

export interface LearningState {
  version: 1;
  activePath: LearningPathId;
  onboardingComplete: boolean;
  completedLessons: Record<string, QuizRecord>;
  bookmarks: string[];
  notes: Record<string, string>;
  reviewSchedule: Record<string, ReviewCardState>;
  activityDates: string[];
  lastVisitedLesson: string | null;
  analyticsConsent: ConsentStatus;
  fontSerif: boolean;
}

export const DEFAULT_LEARNING_STATE: LearningState = {
  version: 1,
  activePath: 'beginner',
  onboardingComplete: false,
  completedLessons: {},
  bookmarks: [],
  notes: {},
  reviewSchedule: {},
  activityDates: [],
  lastVisitedLesson: null,
  analyticsConsent: 'pending',
  fontSerif: false,
};

export const STORAGE_KEY = 'neuralpath.state.v1';

const VALID_PATHS = new Set<LearningPathId>(['beginner', 'practitioner', 'researcher']);
const VALID_CONSENTS = new Set<ConsentStatus>(['pending', 'granted', 'denied']);

export function validateImportedState(raw: unknown): LearningState | null {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return null;
  const obj = raw as Record<string, unknown>;
  if (obj.version !== undefined && obj.version !== 1) return null;

  const activePath =
    typeof obj.activePath === 'string' && VALID_PATHS.has(obj.activePath as LearningPathId)
      ? (obj.activePath as LearningPathId)
      : DEFAULT_LEARNING_STATE.activePath;

  const analyticsConsent =
    typeof obj.analyticsConsent === 'string' &&
    VALID_CONSENTS.has(obj.analyticsConsent as ConsentStatus)
      ? (obj.analyticsConsent as ConsentStatus)
      : DEFAULT_LEARNING_STATE.analyticsConsent;

  const completedLessons =
    obj.completedLessons && typeof obj.completedLessons === 'object' && !Array.isArray(obj.completedLessons)
      ? (obj.completedLessons as Record<string, QuizRecord>)
      : {};

  const notes =
    obj.notes && typeof obj.notes === 'object' && !Array.isArray(obj.notes)
      ? (obj.notes as Record<string, string>)
      : {};

  const reviewSchedule =
    obj.reviewSchedule && typeof obj.reviewSchedule === 'object' && !Array.isArray(obj.reviewSchedule)
      ? (obj.reviewSchedule as Record<string, ReviewCardState>)
      : {};

  return {
    version: 1,
    activePath,
    onboardingComplete: Boolean(obj.onboardingComplete),
    completedLessons,
    bookmarks: Array.isArray(obj.bookmarks)
      ? obj.bookmarks.filter((item): item is string => typeof item === 'string')
      : [],
    notes,
    reviewSchedule,
    activityDates: Array.isArray(obj.activityDates)
      ? obj.activityDates.filter((item): item is string => typeof item === 'string')
      : [],
    lastVisitedLesson: typeof obj.lastVisitedLesson === 'string' ? obj.lastVisitedLesson : null,
    analyticsConsent,
    fontSerif: Boolean(obj.fontSerif),
  };
}

export function loadLearningState(): LearningState {
  if (typeof window === 'undefined') return DEFAULT_LEARNING_STATE;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_LEARNING_STATE;
    const parsed = JSON.parse(raw) as unknown;
    return validateImportedState(parsed) ?? DEFAULT_LEARNING_STATE;
  } catch {
    return DEFAULT_LEARNING_STATE;
  }
}

export function saveLearningState(state: LearningState): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // Storage quota exceeded or private browsing — fail silently
  }
}

export function getTodayIsoDate(): string {
  return new Date().toISOString().slice(0, 10);
}

export function calculateStreak(activityDates: string[], today = getTodayIsoDate()): number {
  if (activityDates.length === 0) return 0;
  const uniqueDesc = Array.from(new Set(activityDates)).sort().reverse();
  const latest = uniqueDesc[0];
  if (!latest) return 0;

  const toDayNum = (iso: string) => Math.floor(new Date(`${iso}T00:00:00Z`).getTime() / 86_400_000);
  const todayNum = toDayNum(today);
  const latestNum = toDayNum(latest);

  if (todayNum - latestNum > 1) return 0;

  let streak = 0;
  let expected = latestNum;
  for (const dateStr of uniqueDesc) {
    const num = toDayNum(dateStr);
    if (num === expected) {
      streak += 1;
      expected -= 1;
    } else if (num < expected) {
      break;
    }
  }
  return streak;
}

export function addDaysToIsoDate(isoDate: string, days: number): string {
  const cursor = new Date(`${isoDate}T00:00:00.000Z`);
  cursor.setUTCDate(cursor.getUTCDate() + days);
  return cursor.toISOString().slice(0, 10);
}

const MAX_REVIEW_INTERVAL_DAYS = 180;

export function scheduleNextReview(
  prev: ReviewCardState | undefined,
  rating: ReviewRating,
  today = getTodayIsoDate()
): ReviewCardState {
  const prevReps = prev?.reps ?? 0;
  const prevLapses = prev?.lapses ?? 0;
  const prevInterval = prev?.intervalDays ?? 0;

  let intervalDays = 0;
  let reps = prevReps + 1;
  let lapses = prevLapses;

  if (rating === 'again') {
    intervalDays = 0;
    reps = 0;
    lapses = prevLapses + 1;
  } else if (rating === 'hard') {
    intervalDays = prevInterval >= 2 ? Math.max(1, Math.round(prevInterval * 1.2)) : 1;
  } else if (rating === 'good') {
    intervalDays = prevInterval >= 1 ? Math.round(prevInterval * 2.1) : 3;
  } else {
    intervalDays = prevInterval >= 1 ? Math.round(prevInterval * 3) : 7;
  }

  intervalDays = Math.min(MAX_REVIEW_INTERVAL_DAYS, intervalDays);

  return {
    intervalDays,
    reps,
    lapses,
    nextDue: addDaysToIsoDate(today, intervalDays),
    lastReviewedAt: new Date().toISOString(),
  };
}

export interface QuizStatsSummary {
  completedCount: number;
  attemptedQuizzes: number;
  totalCorrect: number;
  totalQuestions: number;
  accuracyPercent: number | null;
}

export function calculateQuizStats(completedLessons: Record<string, QuizRecord>): QuizStatsSummary {
  const entries = Object.values(completedLessons);
  let attemptedQuizzes = 0;
  let totalCorrect = 0;
  let totalQuestions = 0;

  for (const rec of entries) {
    if (rec.totalQuestions > 0) {
      attemptedQuizzes += 1;
      totalCorrect += Math.min(rec.score, rec.totalQuestions);
      totalQuestions += rec.totalQuestions;
    }
  }

  return {
    completedCount: entries.length,
    attemptedQuizzes,
    totalCorrect,
    totalQuestions,
    accuracyPercent: totalQuestions > 0 ? Math.round((totalCorrect / totalQuestions) * 100) : null,
  };
}

export function encodeVizParams(params: Record<string, string | number | boolean>): string {
  const search = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) {
    search.set(k, String(v));
  }
  return search.toString();
}

