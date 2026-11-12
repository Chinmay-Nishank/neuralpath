'use client';

import * as React from 'react';
import { usePathname } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { useProgress } from '@/components/progress/progress-provider';

export function ConsentBanner() {
  const pathname = usePathname();
  const { state, hydrated, setAnalyticsConsent } = useProgress();

  React.useEffect(() => {
    if (typeof window === 'undefined' || !('serviceWorker' in navigator) || process.env.NODE_ENV !== 'production') {
      return;
    }
    const timer = window.setTimeout(() => {
      navigator.serviceWorker.register('/sw.js').catch(() => undefined);
    }, 2500);
    return () => window.clearTimeout(timer);
  }, []);

  if (!hydrated || state.analyticsConsent !== 'pending' || pathname.startsWith('/review')) {
    return null;
  }

  return (
    <aside
      aria-label="Privacy preferences"
      className="fixed bottom-4 left-4 z-40 max-w-sm rounded-md border border-hairline bg-elevated p-4 text-xs shadow-lg"
    >
      <p className="font-medium text-primary">Privacy-first learning analytics</p>
      <p className="mt-1 leading-relaxed text-primary-secondary">
        Your lesson progress stays locally in your browser. Allow anonymous page-level telemetry
        to help us improve lessons?
      </p>
      <div className="mt-3 flex items-center gap-2">
        <Button size="sm" onClick={() => setAnalyticsConsent('granted')}>
          Allow Anonymous Stats
        </Button>
        <Button size="sm" variant="ghost" onClick={() => setAnalyticsConsent('denied')}>
          Decline
        </Button>
      </div>
    </aside>
  );
}

