'use client';

import * as React from 'react';
import * as SliderPrimitive from '@radix-ui/react-slider';
import { cn } from '@/lib/utils';

export interface SliderProps {
  label: string;
  value: number;
  min: number;
  max: number;
  step?: number;
  unit?: string;
  formatValue?: (val: number) => string;
  onValueChange: (val: number) => void;
  disabled?: boolean;
  className?: string;
  id?: string;
}

export function Slider({
  label,
  value,
  min,
  max,
  step = 1,
  unit = '',
  formatValue,
  onValueChange,
  disabled = false,
  className,
  id,
}: SliderProps) {
  const generatedId = React.useId();
  const sliderId = id ?? generatedId;
  const displayValue = formatValue ? formatValue(value) : `${value}${unit}`;

  return (
    <div className={cn('flex flex-col gap-2', className)}>
      <div className="flex items-center justify-between gap-2 text-xs">
        <label htmlFor={sliderId} className="font-medium text-primary">
          {label}
        </label>
        <span className="rounded bg-subtle px-1.5 py-0.5 font-mono text-xs font-medium tabular-nums text-primary">
          {displayValue}
        </span>
      </div>
      <SliderPrimitive.Root
        min={min}
        max={max}
        step={step}
        value={[value]}
        disabled={disabled}
        onValueChange={(vals) => {
          const next = vals[0];
          if (typeof next === 'number') onValueChange(next);
        }}
        className="relative flex h-6 w-full touch-none select-none items-center"
      >
        <SliderPrimitive.Track className="relative h-1.5 w-full grow overflow-hidden rounded-full bg-hairline">
          <SliderPrimitive.Range className="absolute h-full bg-accent" />
        </SliderPrimitive.Track>
        <SliderPrimitive.Thumb
          id={sliderId}
          aria-label={label}
          className="block h-5 w-5 rounded-full border-2 border-accent bg-surface shadow-sm transition-transform hover:scale-105 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50"
        />
      </SliderPrimitive.Root>
    </div>
  );
}

