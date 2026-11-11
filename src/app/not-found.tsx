import Link from 'next/link';
import { Compass } from 'lucide-react';
import { buttonVariants } from '@/components/ui/button';

export default function NotFound() {
  return (
    <div className="mx-auto flex min-h-[60vh] max-w-xl flex-col items-center justify-center px-4 py-16 text-center">
      <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full border border-hairline bg-surface">
        <Compass className="h-6 w-6 text-accent" aria-hidden="true" />
      </div>
      <p className="font-mono text-xs font-semibold uppercase tracking-wider text-accent">
        404 · Route Not Found
      </p>
      <h1 className="mt-2 text-2xl font-bold tracking-tight text-primary">
        This page isn&apos;t in the curriculum graph
      </h1>
      <p className="mt-2 text-sm leading-relaxed text-primary-secondary">
        The lesson or playground URL you requested may have moved. Browse the full curriculum map
        or search for the concept you need.
      </p>
      <div className="mt-6 flex flex-wrap justify-center gap-3">
        <Link href="/curriculum" className={buttonVariants({ variant: 'primary' })}>
          Browse Curriculum
        </Link>
        <Link href="/search" className={buttonVariants({ variant: 'outline' })}>
          Search Lessons
        </Link>
      </div>
    </div>
  );
}

