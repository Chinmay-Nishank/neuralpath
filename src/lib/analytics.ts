'use client';

import { loadLearningState } from './progress';

export type AnalyticsEventName =
  | 'lesson_view'
  | 'lesson_complete'
  | 'code_run'
  | 'quiz_submit'
  | 'viz_interact';

declare global {
  interface Window {
    plausible?: (event: string, options?: { props?: Record<string, string | number | boolean> }) => void;
    posthog?: {
      capture: (event: string, properties?: Record<string, string | number | boolean>) => void;
    };
  }
}

/**
 * Privacy-friendly, cookie-consent-aware analytics dispatcher.
 * Only sends events when the user explicitly opts in (`analyticsConsent === 'granted'`)
 * and an external provider (Plausible or PostHog) is configured.
 */
export function trackEvent(
  event: AnalyticsEventName,
  props?: Record<string, string | number | boolean>
): void {
  if (typeof window === 'undefined') return;
  const state = loadLearningState();
  if (state.analyticsConsent !== 'granted') return;

  try {
    if (typeof window.plausible === 'function') {
      window.plausible(event, { props });
    }
    if (window.posthog && typeof window.posthog.capture === 'function') {
      window.posthog.capture(event, props);
    }
  } catch {
    // Non-blocking telemetry
  }
}

