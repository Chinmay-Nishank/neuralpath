import type { Metadata } from 'next';
import Link from 'next/link';
import { FileDown, FileText } from 'lucide-react';
import { getLessonsForModule, getModules } from '@/lib/content';
import { Badge } from '@/components/ui/badge';

export const metadata: Metadata = {
  title: 'Module Cheatsheets (PDF)',
  description:
    'Download concise, printer-friendly PDF cheatsheets summarizing formulas, hyperparameters, and Python idioms for all 10 NeuralPath modules.',
};

export default function CheatsheetsPage() {
  const modules = getModules();

  return (
    <div className="mx-auto max-w-[1200px] space-y-8 px-4 py-10 sm:px-6">
      <div className="space-y-2 border-b border-hairline pb-6">
        <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-accent">
          <FileText className="h-4 w-4" aria-hidden="true" />
          Quick Reference PDFs
        </div>
        <h1 className="text-3xl font-bold tracking-tight text-primary">
          Downloadable Module Cheatsheets
        </h1>
        <p className="max-w-2xl text-sm text-primary-secondary">
          One printable reference PDF per curriculum module covering key formulas, failure modes,
          and scikit-learn / PyTorch patterns.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {modules.map((mod) => {
          const lessons = getLessonsForModule(mod.id);
          const pdfHref = `/cheatsheets/${mod.id}.pdf`;
          return (
            <div
              key={mod.id}
              className="flex flex-col justify-between rounded-md border border-hairline bg-surface p-5"
            >
              <div>
                <div className="mb-2 flex items-center justify-between">
                  <span className="font-mono text-xs font-semibold text-accent">
                    Module {String(mod.order).padStart(2, '0')}
                  </span>
                  <Badge variant="neutral">{lessons.length} lessons</Badge>
                </div>
                <h2 className="text-base font-semibold text-primary">{mod.title}</h2>
                <p className="mt-1.5 text-xs leading-relaxed text-primary-secondary">
                  {mod.description}
                </p>
              </div>
              <div className="mt-5 flex items-center justify-between border-t border-hairline pt-3">
                <a
                  href={pdfHref}
                  download={`${mod.id}-cheatsheet.pdf`}
                  className="inline-flex items-center gap-1.5 rounded-sm bg-accent px-3 py-1.5 text-xs font-medium text-accent-foreground hover:bg-accent-hover"
                >
                  <FileDown className="h-3.5 w-3.5" aria-hidden="true" />
                  <span>Download PDF</span>
                </a>
                <Link
                  href={lessons[0]?.url ?? '/curriculum'}
                  className="text-xs font-medium text-primary-secondary hover:text-primary"
                >
                  Start module →
                </Link>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

