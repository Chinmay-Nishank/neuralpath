import * as React from 'react';
import { cn } from '@/lib/utils';

export interface ProgressBarProps {
  value: number; // 0-100
  label?: string;
  showPercent?: boolean;
  className?: string;
}

export function ProgressBar({
  value,
  label,
  showPercent = false,
  className,
}: ProgressBarProps) {
  const clamped = Math.max(0, Math.min(100, Math.round(value)));

  return (
    <div className={cn('flex flex-col gap-1.5', className)}>
      {(label || showPercent) && (
        <div className="flex items-center justify-between text-xs">
          {label && <span className="font-medium text-primary-secondary">{label}</span>}
          {showPercent && (
            <span className="font-mono tabular-nums text-primary-muted">{clamped}%</span>
          )}
        </div>
      )}
      <div
        role="progressbar"
        aria-valuenow={clamped}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={label ?? 'Progress'}
        className="h-2 w-full overflow-hidden rounded-full bg-subtle"
      >
        <div
          className="h-full rounded-full bg-accent transition-[width] duration-300 ease-neural"
          style={{ width: `${clamped}%` }}
        />
      </div>
    </div>
  );
}

export interface ProgressRingProps {
  value: number; // 0-100
  size?: number;
  strokeWidth?: number;
  label?: string;
  className?: string;
}

export function ProgressRing({
  value,
  size = 56,
  strokeWidth = 5,
  label,
  className,
}: ProgressRingProps) {
  const clamped = Math.max(0, Math.min(100, Math.round(value)));
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (clamped / 100) * circumference;

  return (
    <div
      className={cn('relative inline-flex items-center justify-center', className)}
      style={{ width: size, height: size }}
      role="progressbar"
      aria-valuenow={clamped}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-label={label ?? `${clamped}% complete`}
    >
      <svg width={size} height={size} className="-rotate-90" aria-hidden="true">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="var(--border-hairline)"
          strokeWidth={strokeWidth}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="var(--accent)"
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          className="transition-[stroke-dashoffset] duration-300 ease-neural"
        />
      </svg>
      <span className="absolute font-mono text-xs font-semibold tabular-nums text-primary">
        {clamped}%
      </span>
    </div>
  );
}

