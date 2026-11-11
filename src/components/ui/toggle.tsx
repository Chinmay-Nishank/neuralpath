'use client';

import * as React from 'react';
import * as SwitchPrimitive from '@radix-ui/react-switch';
import { cn } from '@/lib/utils';

export interface ToggleProps {
  label: string;
  description?: string;
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
  disabled?: boolean;
  className?: string;
}

export function Toggle({
  label,
  description,
  checked,
  onCheckedChange,
  disabled = false,
  className,
}: ToggleProps) {
  const id = React.useId();

  return (
    <div className={cn('flex items-center justify-between gap-3', className)}>
      <div className="flex flex-col">
        <label htmlFor={id} className="cursor-pointer text-sm font-medium text-primary">
          {label}
        </label>
        {description && <span className="text-xs text-primary-muted">{description}</span>}
      </div>
      <SwitchPrimitive.Root
        id={id}
        checked={checked}
        onCheckedChange={onCheckedChange}
        disabled={disabled}
        className="peer inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full border border-strong bg-subtle transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 data-[state=checked]:border-accent data-[state=checked]:bg-accent"
      >
        <SwitchPrimitive.Thumb className="pointer-events-none block h-5 w-5 translate-x-0.5 rounded-full bg-surface shadow-sm transition-transform data-[state=checked]:translate-x-5" />
      </SwitchPrimitive.Root>
    </div>
  );
}

