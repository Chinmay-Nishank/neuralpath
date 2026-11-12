'use client';

import * as React from 'react';
import { Play, Pause, RotateCcw, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

type TimerPreset = { label: string; minutes: number };

const PRESETS: TimerPreset[] = [
  { label: 'Focus 25m', minutes: 25 },
  { label: 'Sprint 15m', minutes: 15 },
  { label: 'Break 5m', minutes: 5 },
];

const FOCUS_STORAGE_KEY = 'neuralpath.focus.v1';

function readLoggedMinutes(): number {
  if (typeof window === 'undefined') return 0;
  try {
    const raw = window.localStorage.getItem(FOCUS_STORAGE_KEY);
    if (!raw) return 0;
    const parsed = JSON.parse(raw) as { date?: string; minutes?: number };
    const today = new Date().toISOString().slice(0, 10);
    return parsed.date === today && typeof parsed.minutes === 'number' ? parsed.minutes : 0;
  } catch {
    return 0;
  }
}

function addLoggedMinute() {
  if (typeof window === 'undefined') return 0;
  try {
    const today = new Date().toISOString().slice(0, 10);
    const next = readLoggedMinutes() + 1;
    window.localStorage.setItem(FOCUS_STORAGE_KEY, JSON.stringify({ date: today, minutes: next }));
    return next;
  } catch {
    return 0;
  }
}

export function StudyTimer({ className }: { className?: string }) {
  const [presetIdx, setPresetIdx] = React.useState(0);
  const activePreset = PRESETS[presetIdx] ?? PRESETS[0]!;
  const [secondsLeft, setSecondsLeft] = React.useState(activePreset.minutes * 60);
  const [running, setRunning] = React.useState(false);
  const [focusMinutesToday, setFocusMinutesToday] = React.useState(0);

  React.useEffect(() => {
    setFocusMinutesToday(readLoggedMinutes());
  }, []);

  React.useEffect(() => {
    if (!running) return;
    const id = window.setInterval(() => {
      setSecondsLeft((prev) => {
        if (prev <= 1) {
          setRunning(false);
          return 0;
        }
        if ((prev - 1) % 60 === 0 && activePreset.minutes >= 15) {
          setFocusMinutesToday(addLoggedMinute());
        }
        return prev - 1;
      });
    }, 1000);
    return () => window.clearInterval(id);
  }, [running, activePreset.minutes]);

  const selectPreset = (idx: number) => {
    const p = PRESETS[idx] ?? PRESETS[0]!;
    setRunning(false);
    setPresetIdx(idx);
    setSecondsLeft(p.minutes * 60);
  };

  const mins = String(Math.floor(secondsLeft / 60)).padStart(2, '0');
  const secs = String(secondsLeft % 60).padStart(2, '0');

  return (
    <div
      className={cn(
        'flex flex-wrap items-center justify-between gap-2 rounded-md border border-hairline bg-surface px-3 py-2 text-xs',
        className
      )}
      aria-label="Focused study timer"
    >
      <div className="flex items-center gap-2">
        <Clock className="h-3.5 w-3.5 text-accent" aria-hidden="true" />
        <span className="font-mono text-sm font-semibold tabular-nums text-primary" aria-live="off">
          {mins}:{secs}
        </span>
        {focusMinutesToday > 0 && (
          <span className="text-[11px] text-primary-secondary">
            · {focusMinutesToday}m today
          </span>
        )}
      </div>

      <div className="flex flex-wrap items-center gap-1">
        {PRESETS.map((p, idx) => (
          <button
            key={p.label}
            type="button"
            onClick={() => selectPreset(idx)}
            className={cn(
              'min-h-[32px] rounded-sm px-2 py-1 text-[11px] font-medium transition-colors',
              presetIdx === idx
                ? 'bg-subtle text-primary'
                : 'text-primary-secondary hover:bg-subtle/60 hover:text-primary'
            )}
          >
            {p.label}
          </button>
        ))}

        <Button
          type="button"
          size="sm"
          variant={running ? 'secondary' : 'outline'}
          onClick={() => setRunning((r) => !r)}
          aria-label={running ? 'Pause study timer' : 'Start study timer'}
        >
          {running ? <Pause className="h-3.5 w-3.5" aria-hidden="true" /> : <Play className="h-3.5 w-3.5" aria-hidden="true" />}
        </Button>

        <Button
          type="button"
          size="sm"
          variant="ghost"
          onClick={() => selectPreset(presetIdx)}
          aria-label="Reset study timer"
        >
          <RotateCcw className="h-3.5 w-3.5" aria-hidden="true" />
        </Button>
      </div>
    </div>
  );
}

