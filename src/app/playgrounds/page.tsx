import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowUpRight, SlidersHorizontal } from 'lucide-react';
import { PLAYGROUNDS } from '@/lib/playgrounds';
import { Badge } from '@/components/ui/badge';

export const metadata: Metadata = {
  title: 'Interactive Playgrounds',
  description:
    'Full-width interactive sandboxes for Gradient Descent, Neural Networks, Self-Attention, Convolutions, Diffusion, BPE Tokenization, and Reinforcement Learning.',
};

export default function PlaygroundsIndexPage() {
  return (
    <div className="mx-auto max-w-[1280px] space-y-8 px-4 py-10 sm:px-6">
      <div className="space-y-2 border-b border-hairline pb-6">
        <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-accent">
          <SlidersHorizontal className="h-4 w-4" aria-hidden="true" />
          Interactive Labs
        </div>
        <h1 className="text-3xl font-bold tracking-tight text-primary">
          Distraction-Free ML &amp; AI Playgrounds
        </h1>
        <p className="max-w-2xl text-sm text-primary-secondary">
          Experiment directly with hyperparameters, matrices, kernels, and neural topologies in full
          width. Every lab includes reset controls, keyboard accessibility, and shareable links.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {PLAYGROUNDS.map((pg) => (
          <Link
            key={pg.slug}
            href={`/playgrounds/${pg.slug}`}
            className="group flex flex-col justify-between rounded-md border border-hairline bg-surface p-5 transition-colors hover:border-accent"
          >
            <div>
              <div className="mb-2 flex items-center justify-between">
                <Badge variant="accent">{pg.category}</Badge>
                <ArrowUpRight className="h-4 w-4 text-primary-muted group-hover:text-accent" aria-hidden="true" />
              </div>
              <h2 className="text-base font-semibold text-primary group-hover:text-accent">
                {pg.title}
              </h2>
              <p className="mt-1.5 text-xs leading-relaxed text-primary-secondary">
                {pg.description}
              </p>
            </div>
            <div className="mt-4 border-t border-hairline pt-3 text-xs font-medium text-accent">
              Open playground →
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}

