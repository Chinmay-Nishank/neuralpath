'use client';

import * as React from 'react';

export function ReadingProgressBar() {
  const [percent, setPercent] = React.useState(0);

  React.useEffect(() => {
    let rafId = 0;
    const update = () => {
      rafId = 0;
      const docHeight = document.documentElement.scrollHeight - window.innerHeight;
      if (docHeight <= 0) {
        setPercent(100);
        return;
      }
      setPercent(Math.min(100, Math.max(0, (window.scrollY / docHeight) * 100)));
    };
    const onScroll = () => {
      if (!rafId) {
        rafId = window.requestAnimationFrame(update);
      }
    };
    if (window.scrollY > 0) {
      onScroll();
    }
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => {
      window.removeEventListener('scroll', onScroll);
      if (rafId) window.cancelAnimationFrame(rafId);
    };
  }, []);

  return (
    <div
      aria-hidden="true"
      className="fixed left-0 top-0 z-50 h-0.5 w-full bg-transparent pointer-events-none"
    >
      <div
        className="h-full bg-accent transition-[width] duration-75"
        style={{ width: `${percent}%` }}
      />
    </div>
  );
}

