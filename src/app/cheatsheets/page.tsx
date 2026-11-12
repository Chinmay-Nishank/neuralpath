import type { Metadata } from 'next';
import { Sparkles } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { CheatsheetHub } from '@/components/cheatsheets/cheatsheet-hub';

export const metadata: Metadata = {
  title: 'Master ML & AI Cheatsheets & Formula Reference',
  description:
    'Complete self-contained formula reference, PyTorch patterns, failure modes, and printable PDFs across all 10 NeuralPath curriculum modules from scratch to expert level.',
};

export default function CheatsheetsPage() {
  return (
    <div className="mx-auto w-full min-w-0 max-w-[1360px] space-y-8 px-4 py-10 sm:px-6 overflow-x-hidden">
      <div className="space-y-3 border-b border-hairline pb-6 min-w-0">
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant="accent" className="break-words">
            <Sparkles className="mr-1 h-3 w-3 shrink-0" aria-hidden="true" />
            Complete First-Principles Reference
          </Badge>
          <Badge variant="neutral">All 10 Modules</Badge>
          <Badge variant="neutral">Formulas + Code + PDFs</Badge>
        </div>
        <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold tracking-tight text-primary break-words">
          Master Formula &amp; Architecture Reference
        </h1>
        <p className="max-w-3xl text-sm leading-relaxed text-primary-secondary sm:text-base break-words">
          A completely self-contained reference hub. Every core equation, gradient step, PyTorch idiom,
          and production gotcha across mathematical foundations, deep learning, sequence models, generative systems,
          RL alignment, and MLOps—no external searching required.
        </p>
      </div>

      <CheatsheetHub />
    </div>
  );
}
