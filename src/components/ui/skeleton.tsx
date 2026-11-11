import * as React from 'react';
import { cn } from '@/lib/utils';

export function Skeleton({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      aria-hidden="true"
      className={cn('animate-pulse rounded-sm bg-subtle', className)}
      {...props}
    />
  );
}

export function VizSkeleton({ height = 360 }: { height?: number }) {
  return (
    <div
      role="status"
      className="w-full rounded-md border border-hairline bg-surface p-5"
      style={{ minHeight: height }}
      aria-busy="true"
      aria-label="Loading interactive visualization"
    >
      <div className="mb-4 flex items-center justify-between gap-4">
        <div className="space-y-2">
          <Skeleton className="h-5 w-48" />
          <Skeleton className="h-3.5 w-72" />
        </div>
        <Skeleton className="h-8 w-20" />
      </div>
      <Skeleton className="h-[240px] w-full rounded-sm" />
      <div className="mt-4 flex gap-3">
        <Skeleton className="h-9 w-36" />
        <Skeleton className="h-9 w-36" />
      </div>
    </div>
  );
}

