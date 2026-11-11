'use client';

import * as React from 'react';
import { BookOpen, Lightbulb, AlertTriangle, Sigma, ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';

export type CalloutType = 'note' | 'tip' | 'warning' | 'math-deep-dive';

export interface CalloutProps {
  type?: CalloutType;
  title?: string;
  defaultOpen?: boolean;
  children: React.ReactNode;
  className?: string;
}

const CALLOUT_CONFIG: Record<
  CalloutType,
  {
    label: string;
    icon: React.ComponentType<{ className?: string }>;
    borderClass: string;
    bgClass: string;
    iconClass: string;
  }
> = {
  note: {
    label: 'Note',
    icon: BookOpen,
    borderClass: 'border-info/40',
    bgClass: 'bg-info-soft/40',
    iconClass: 'text-info',
  },
  tip: {
    label: 'Practical Tip',
    icon: Lightbulb,
    borderClass: 'border-success/40',
    bgClass: 'bg-success-soft/40',
    iconClass: 'text-success',
  },
  warning: {
    label: 'Watch Out',
    icon: AlertTriangle,
    borderClass: 'border-warning/40',
    bgClass: 'bg-warning-soft/40',
    iconClass: 'text-warning',
  },
  'math-deep-dive': {
    label: 'Math Deep Dive',
    icon: Sigma,
    borderClass: 'border-accent/35',
    bgClass: 'bg-accent-soft/35',
    iconClass: 'text-accent',
  },
};

export function Callout({
  type = 'note',
  title,
  defaultOpen = false,
  children,
  className,
}: CalloutProps) {
  const [open, setOpen] = React.useState(defaultOpen || type !== 'math-deep-dive');
  const config = CALLOUT_CONFIG[type];
  const Icon = config.icon;
  const heading = title ?? config.label;
  const isCollapsible = type === 'math-deep-dive';

  return (
    <aside
      aria-label={heading}
      className={cn(
        'my-6 rounded-md border px-4 py-3.5 text-sm leading-relaxed',
        config.borderClass,
        config.bgClass,
        className
      )}
    >
      {isCollapsible ? (
        <button
          type="button"
          onClick={() => setOpen((prev) => !prev)}
          aria-expanded={open}
          className="flex w-full items-center justify-between gap-2 text-left font-semibold text-primary"
        >
          <span className="flex items-center gap-2">
            <Icon className={cn('h-4 w-4 shrink-0', config.iconClass)} aria-hidden="true" />
            <span>{heading}</span>
          </span>
          <span className="flex items-center gap-1.5 text-xs font-normal text-primary-secondary">
            <span>{open ? 'Hide derivation' : 'Expand derivation'}</span>
            <ChevronDown
              className={cn('h-4 w-4 transition-transform duration-200', open && 'rotate-180')}
              aria-hidden="true"
            />
          </span>
        </button>
      ) : (
        <div className="mb-1.5 flex items-center gap-2 font-semibold text-primary">
          <Icon className={cn('h-4 w-4 shrink-0', config.iconClass)} aria-hidden="true" />
          <span>{heading}</span>
        </div>
      )}

      {open && (
        <div className={cn('text-primary-secondary [&>p:last-child]:mb-0', isCollapsible && 'mt-3 border-t border-hairline/70 pt-3')}>
          {children}
        </div>
      )}
    </aside>
  );
}

