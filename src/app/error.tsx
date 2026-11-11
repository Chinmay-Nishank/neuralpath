'use client';

import * as React from 'react';
import Link from 'next/link';
import { AlertTriangle } from 'lucide-react';
import { Button, buttonVariants } from '@/components/ui/button';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  React.useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="mx-auto flex min-h-[60vh] max-w-xl flex-col items-center justify-center px-4 py-16 text-center">
      <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full border border-danger/30 bg-danger-soft/40">
        <AlertTriangle className="h-6 w-6 text-danger" aria-hidden="true" />
      </div>
      <h1 className="text-2xl font-bold text-primary">Something interrupted this page</h1>
      <p className="mt-2 text-sm text-primary-secondary">
        Try reloading the view. Your saved progress and lesson notes remain safely preserved in
        your browser.
      </p>
      <div className="mt-6 flex gap-3">
        <Button onClick={reset}>Try Again</Button>
        <Link href="/" className={buttonVariants({ variant: 'outline' })}>
          Return Home
        </Link>
      </div>
    </div>
  );
}

