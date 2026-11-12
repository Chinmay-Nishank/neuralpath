'use client';

import * as React from 'react';
import {
  DEFAULT_LEARNING_STATE,
  type ConsentStatus,
  type LearningPathId,
  type LearningState,
  type ReviewRating,
  calculateStreak,
  getTodayIsoDate,
  loadLearningState,
  saveLearningState,
  scheduleNextReview,
} from '@/lib/progress';

interface ProgressContextValue {
  state: LearningState;
  hydrated: boolean;
  streakDays: number;
  setActivePath: (path: LearningPathId) => void;
  completeOnboarding: (path: LearningPathId) => void;
  markLessonVisited: (routeId: string) => void;
  markLessonCompleted: (routeId: string, quizScore?: number, totalQuestions?: number) => void;
  toggleLessonCompleted: (routeId: string) => void;
  toggleBookmark: (routeId: string) => void;
  saveNote: (routeId: string, content: string) => void;
  recordReview: (termKey: string, rating: ReviewRating) => void;
  importLearningState: (nextState: LearningState) => void;
  setAnalyticsConsent: (status: ConsentStatus) => void;
  toggleFontSerif: () => void;
}

const ProgressContext = React.createContext<ProgressContextValue>({
  state: DEFAULT_LEARNING_STATE,
  hydrated: false,
  streakDays: 0,
  setActivePath: () => {},
  completeOnboarding: () => {},
  markLessonVisited: () => {},
  markLessonCompleted: () => {},
  toggleLessonCompleted: () => {},
  toggleBookmark: () => {},
  saveNote: () => {},
  recordReview: () => {},
  importLearningState: () => {},
  setAnalyticsConsent: () => {},
  toggleFontSerif: () => {},
});

export function useProgress() {
  return React.useContext(ProgressContext);
}

export function ProgressProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = React.useState<LearningState>(DEFAULT_LEARNING_STATE);
  const [hydrated, setHydrated] = React.useState(false);

  React.useEffect(() => {
    setState(loadLearningState());
    setHydrated(true);
  }, []);

  const updateState = React.useCallback((updater: (prev: LearningState) => LearningState) => {
    setState((prev) => {
      const next = updater(prev);
      saveLearningState(next);
      return next;
    });
  }, []);

  const syncRemote = React.useCallback(async (payload: Record<string, unknown>) => {
    try {
      await fetch('/api/progress', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
    } catch {
      // Offline or DB not configured — localStorage remains authoritative
    }
  }, []);

  const setActivePath = React.useCallback(
    (activePath: LearningPathId) => {
      updateState((prev) => ({ ...prev, activePath }));
    },
    [updateState]
  );

  const completeOnboarding = React.useCallback(
    (activePath: LearningPathId) => {
      updateState((prev) => ({
        ...prev,
        activePath,
        onboardingComplete: true,
      }));
    },
    [updateState]
  );

  const markLessonVisited = React.useCallback(
    (routeId: string) => {
      const today = getTodayIsoDate();
      updateState((prev) => {
        if (prev.lastVisitedLesson === routeId && prev.activityDates.includes(today)) {
          return prev;
        }
        const activityDates = prev.activityDates.includes(today)
          ? prev.activityDates
          : [...prev.activityDates, today];
        return {
          ...prev,
          lastVisitedLesson: routeId,
          activityDates,
        };
      });
    },
    [updateState]
  );

  const markLessonCompleted = React.useCallback(
    (routeId: string, quizScore = 0, totalQuestions = 0) => {
      const today = getTodayIsoDate();
      updateState((prev) => {
        const existing = prev.completedLessons[routeId];
        const bestScore = existing ? Math.max(existing.score, quizScore) : quizScore;
        const bestTotal = totalQuestions || existing?.totalQuestions || 0;
        const activityDates = prev.activityDates.includes(today)
          ? prev.activityDates
          : [...prev.activityDates, today];
        return {
          ...prev,
          activityDates,
          completedLessons: {
            ...prev.completedLessons,
            [routeId]: {
              completedAt: existing?.completedAt ?? new Date().toISOString(),
              score: bestScore,
              totalQuestions: bestTotal,
            },
          },
        };
      });
      void syncRemote({ type: 'complete', lessonSlug: routeId, quizScore, totalQuestions });
    },
    [updateState, syncRemote]
  );

  const toggleLessonCompleted = React.useCallback(
    (routeId: string) => {
      const today = getTodayIsoDate();
      updateState((prev) => {
        const nextMap = { ...prev.completedLessons };
        if (nextMap[routeId]) {
          delete nextMap[routeId];
        } else {
          nextMap[routeId] = {
            completedAt: new Date().toISOString(),
            score: 0,
            totalQuestions: 0,
          };
        }
        const activityDates = prev.activityDates.includes(today)
          ? prev.activityDates
          : [...prev.activityDates, today];
        return {
          ...prev,
          activityDates,
          completedLessons: nextMap,
        };
      });
    },
    [updateState]
  );

  const toggleBookmark = React.useCallback(
    (routeId: string) => {
      updateState((prev) => {
        const exists = prev.bookmarks.includes(routeId);
        const bookmarks = exists
          ? prev.bookmarks.filter((item) => item !== routeId)
          : [...prev.bookmarks, routeId];
        return { ...prev, bookmarks };
      });
      void syncRemote({ type: 'bookmark', lessonSlug: routeId });
    },
    [updateState, syncRemote]
  );

  const saveNote = React.useCallback(
    (routeId: string, content: string) => {
      updateState((prev) => ({
        ...prev,
        notes: {
          ...prev.notes,
          [routeId]: content,
        },
      }));
      void syncRemote({ type: 'note', lessonSlug: routeId, content });
    },
    [updateState, syncRemote]
  );

  const recordReview = React.useCallback(
    (termKey: string, rating: ReviewRating) => {
      const today = getTodayIsoDate();
      updateState((prev) => {
        const nextCard = scheduleNextReview(prev.reviewSchedule[termKey], rating, today);
        const activityDates = prev.activityDates.includes(today)
          ? prev.activityDates
          : [...prev.activityDates, today];
        return {
          ...prev,
          activityDates,
          reviewSchedule: {
            ...prev.reviewSchedule,
            [termKey]: nextCard,
          },
        };
      });
    },
    [updateState]
  );

  const importLearningState = React.useCallback(
    (nextState: LearningState) => {
      updateState(() => nextState);
    },
    [updateState]
  );

  const setAnalyticsConsent = React.useCallback(
    (analyticsConsent: ConsentStatus) => {
      updateState((prev) => ({ ...prev, analyticsConsent }));
    },
    [updateState]
  );

  const toggleFontSerif = React.useCallback(() => {
    updateState((prev) => ({ ...prev, fontSerif: !prev.fontSerif }));
  }, [updateState]);

  const streakDays = React.useMemo(
    () => (hydrated ? calculateStreak(state.activityDates) : 0),
    [hydrated, state.activityDates]
  );

  const value = React.useMemo<ProgressContextValue>(
    () => ({
      state,
      hydrated,
      streakDays,
      setActivePath,
      completeOnboarding,
      markLessonVisited,
      markLessonCompleted,
      toggleLessonCompleted,
      toggleBookmark,
      saveNote,
      recordReview,
      importLearningState,
      setAnalyticsConsent,
      toggleFontSerif,
    }),
    [
      state,
      hydrated,
      streakDays,
      setActivePath,
      completeOnboarding,
      markLessonVisited,
      markLessonCompleted,
      toggleLessonCompleted,
      toggleBookmark,
      saveNote,
      recordReview,
      importLearningState,
      setAnalyticsConsent,
      toggleFontSerif,
    ]
  );

  return <ProgressContext.Provider value={value}>{children}</ProgressContext.Provider>;
}

