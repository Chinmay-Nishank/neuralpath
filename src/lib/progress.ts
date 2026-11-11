'use client';

export type ConsentStatus = 'pending' | 'granted' | 'denied';

export interface QuizRecord {
  completedAt: string;
  score: number;
  totalQuestions: number;
}

export type LearningPathId = 'beginner' | 'practitioner' | 'researcher';

export interface LearningState {
  version: 1;
  activePath: LearningPathId;
  onboardingComplete: boolean;
  completedLessons: Record<string, QuizRecord>;
  bookmarks: string[];
  notes: Record<string, string>;
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
  activityDates: [],
  lastVisitedLesson: null,
  analyticsConsent: 'pending',
  fontSerif: false,
};

export const STORAGE_KEY = 'neuralpath.state.v1';

export function loadLearningState(): LearningState {
  if (typeof window === 'undefined') return DEFAULT_LEARNING_STATE;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_LEARNING_STATE;
    const parsed = JSON.parse(raw) as Partial<LearningState>;
    return {
      ...DEFAULT_LEARNING_STATE,
      ...parsed,
      completedLessons: parsed.completedLessons ?? {},
      bookmarks: Array.isArray(parsed.bookmarks) ? parsed.bookmarks : [],
      notes: parsed.notes ?? {},
      activityDates: Array.isArray(parsed.activityDates) ? parsed.activityDates : [],
    };
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

export function encodeVizParams(params: Record<string, string | number | boolean>): string {
  const search = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) {
    search.set(k, String(v));
  }
  return search.toString();
}

