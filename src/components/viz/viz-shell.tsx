'use client';

import * as React from 'react';
import { RotateCcw, Play, Pause, StepForward, Eye, Link2, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { usePrefersReducedMotion } from './use-reduced-motion';

export interface VizLegendItem {
  label: string;
  color: string;
  shape?: 'circle' | 'line' | 'square';
}

export interface VizShellProps {
  title: string;
  whatToNotice: string;
  legend?: VizLegendItem[];
  onReset: () => void;
  shareParams?: Record<string, string | number | boolean>;
  playing?: boolean;
  onTogglePlay?: () => void;
  onStep?: () => void;
  speed?: number;
  onSpeedChange?: (speed: number) => void;
  controls?: React.ReactNode;
  summaryText?: string;
  summaryTable?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}

export function VizShell({
  title,
  whatToNotice,
  legend,
  onReset,
  shareParams,
  playing,
  onTogglePlay,
  onStep,
  speed,
  onSpeedChange,
  controls,
  summaryText,
  summaryTable,
  children,
  className,
}: VizShellProps) {
  const reducedMotion = usePrefersReducedMotion();
  const [showSummary, setShowSummary] = React.useState(false);
  const [copiedLink, setCopiedLink] = React.useState(false);

  const handleCopyShare = async () => {
    if (typeof window === 'undefined') return;
    const url = new URL(window.location.href);
    if (shareParams) {
      for (const [k, v] of Object.entries(shareParams)) {
        url.searchParams.set(k, String(v));
      }
    }
    try {
      await navigator.clipboard.writeText(url.toString());
      setCopiedLink(true);
      window.setTimeout(() => setCopiedLink(false), 2000);
    } catch {
      // Clipboard blocked
    }
  };

  return (
    <figure
      className={cn(
        'my-7 overflow-hidden rounded-md border border-hairline bg-surface shadow-sm',
        className
      )}
    >
      {/* Header */}
      <figcaption className="flex flex-wrap items-start justify-between gap-3 border-b border-hairline bg-subtle/60 px-5 py-3.5">
        <div className="space-y-1">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="text-sm font-semibold text-primary">{title}</h3>
            {reducedMotion && (
              <Badge variant="info">Static / Step Mode (Reduced Motion)</Badge>
            )}
          </div>
          <p className="text-xs leading-relaxed text-primary-secondary">
            <span className="font-semibold text-primary">What to notice: </span>
            {whatToNotice}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-1.5">
          {onTogglePlay && (
            <Button
              size="sm"
              variant={playing ? 'secondary' : 'primary'}
              onClick={onTogglePlay}
              aria-label={playing ? 'Pause simulation' : 'Play simulation'}
            >
              {playing ? (
                <>
                  <Pause className="h-3.5 w-3.5" aria-hidden="true" />
                  <span>Pause</span>
                </>
              ) : (
                <>
                  <Play className="h-3.5 w-3.5" aria-hidden="true" />
                  <span>Play</span>
                </>
              )}
            </Button>
          )}
          {onStep && (
            <Button size="sm" variant="outline" onClick={onStep} aria-label="Step forward">
              <StepForward className="h-3.5 w-3.5" aria-hidden="true" />
              <span>Step</span>
            </Button>
          )}
          {typeof speed === 'number' && onSpeedChange && (
            <select
              aria-label="Simulation speed"
              value={speed}
              onChange={(e) => onSpeedChange(Number(e.target.value))}
              className="h-8 rounded-sm border border-strong bg-surface px-2 font-mono text-xs text-primary"
            >
              <option value={0.5}>0.5x</option>
              <option value={1}>1x</option>
              <option value={2}>2x</option>
            </select>
          )}
          {shareParams && (
            <Button
              size="sm"
              variant="ghost"
              onClick={handleCopyShare}
              aria-label="Copy link with visualization settings"
            >
              {copiedLink ? (
                <Check className="h-3.5 w-3.5 text-success" aria-hidden="true" />
              ) : (
                <Link2 className="h-3.5 w-3.5" aria-hidden="true" />
              )}
              <span className="hidden sm:inline">{copiedLink ? 'Copied' : 'Share'}</span>
            </Button>
          )}
          <Button size="sm" variant="outline" onClick={onReset} aria-label="Reset visualization">
            <RotateCcw className="h-3.5 w-3.5" aria-hidden="true" />
            <span>Reset</span>
          </Button>
        </div>
      </figcaption>

      {/* Canvas + Controls */}
      <div className="grid gap-4 p-5 lg:grid-cols-[1fr_280px] lg:items-start">
        <div className="min-w-0 space-y-3">
          {children}
          {legend && legend.length > 0 && (
            <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 border-t border-hairline pt-2.5 text-xs text-primary-secondary">
              {legend.map((item) => (
                <span key={item.label} className="inline-flex items-center gap-1.5">
                  <span
                    aria-hidden="true"
                    className={cn(
                      'inline-block shrink-0',
                      item.shape === 'line'
                        ? 'h-0.5 w-4 rounded-full'
                        : item.shape === 'square'
                        ? 'h-2.5 w-2.5 rounded-[2px]'
                        : 'h-2.5 w-2.5 rounded-full'
                    )}
                    style={{ backgroundColor: item.color }}
                  />
                  <span>{item.label}</span>
                </span>
              ))}
            </div>
          )}
        </div>

        {controls && (
          <div className="space-y-4 rounded-sm border border-hairline bg-canvas/70 p-4">
            {controls}
          </div>
        )}
      </div>

      {/* Screen-reader / Accessible Data Summary */}
      {(summaryText || summaryTable) && (
        <div className="border-t border-hairline bg-subtle/40 px-5 py-2.5">
          <button
            type="button"
            onClick={() => setShowSummary((s) => !s)}
            aria-expanded={showSummary}
            className="inline-flex items-center gap-1.5 text-xs font-medium text-primary-secondary hover:text-primary"
          >
            <Eye className="h-3.5 w-3.5" aria-hidden="true" />
            <span>{showSummary ? 'Hide accessible data summary' : 'Show accessible data summary'}</span>
          </button>
          {showSummary && (
            <div className="mt-3 space-y-2 text-xs text-primary-secondary">
              {summaryText && <p>{summaryText}</p>}
              {summaryTable}
            </div>
          )}
        </div>
      )}
    </figure>
  );
}

