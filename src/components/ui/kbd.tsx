import * as React from 'react';
import { cn } from '@/lib/utils';

export function Kbd({ className, children, ...props }: React.HTMLAttributes<HTMLElement>) {
  return (
    <kbd
      className={cn(
        'inline-flex items-center gap-0.5 rounded border border-strong bg-subtle px-1.5 py-0.5 text-[11px] font-medium tabular-nums text-primary-secondary shadow-[0_1px_0_var(--border-strong)]',
        className
      )}
      {...props}
    >
      {children}
    </kbd>
  );
}

