import Link from 'next/link';
import { WifiOff } from 'lucide-react';
import { buttonVariants } from '@/components/ui/button';

export default function OfflinePage() {
  return (
    <div className="mx-auto flex min-h-[60vh] max-w-xl flex-col items-center justify-center px-4 py-16 text-center">
      <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full border border-hairline bg-surface">
        <WifiOff className="h-6 w-6 text-primary-secondary" aria-hidden="true" />
      </div>
      <h1 className="text-2xl font-bold text-primary">You&apos;re currently offline</h1>
      <p className="mt-2 text-sm leading-relaxed text-primary-secondary">
        Previously visited lessons, glossary terms, and local progress remain available in your
        cache. Reconnect to fetch uncached lessons or initialize Pyodide for the first time.
      </p>
      <div className="mt-6 flex gap-3">
        <Link href="/dashboard" className={buttonVariants({ variant: 'primary' })}>
          Open Dashboard
        </Link>
        <Link href="/curriculum" className={buttonVariants({ variant: 'outline' })}>
          View Curriculum
        </Link>
      </div>
    </div>
  );
}

