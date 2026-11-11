'use client';

import * as React from 'react';
import { ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface SelectOption {
  value: string;
  label: string;
  description?: string;
}

export interface SelectProps {
  label?: string;
  value: string;
  onValueChange: (value: string) => void;
  options: SelectOption[];
  placeholder?: string;
  disabled?: boolean;
  className?: string;
}

export function Select({
  label,
  value,
  onValueChange,
  options,
  placeholder = 'Select an option',
  disabled = false,
  className,
}: SelectProps) {
  const id = React.useId();

  return (
    <div className={cn('flex flex-col gap-1.5', className)}>
      {label && (
        <label htmlFor={id} className="text-xs font-medium text-primary">
          {label}
        </label>
      )}
      <div className="relative">
        <select
          id={id}
          aria-label={label ?? placeholder}
          value={value}
          disabled={disabled}
          onChange={(e) => onValueChange(e.target.value)}
          className="flex h-10 w-full appearance-none rounded-sm border border-strong bg-surface pl-3 pr-8 text-sm text-primary transition-colors hover:bg-subtle focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent disabled:cursor-not-allowed disabled:opacity-50"
        >
          {options.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
        <ChevronDown
          className="pointer-events-none absolute right-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-primary-secondary"
          aria-hidden="true"
        />
      </div>
    </div>
  );
}
