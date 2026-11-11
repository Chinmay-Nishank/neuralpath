import * as React from 'react';
import katex from 'katex';
import 'katex/dist/katex.min.css';
import { cn } from '@/lib/utils';

export interface MathProps {
  tex?: string;
  children?: string;
  display?: boolean;
  label?: string;
  className?: string;
}

function renderKatex(formula: string, display: boolean): string {
  try {
    return katex.renderToString(formula, {
      displayMode: display,
      throwOnError: false,
      strict: false,
    });
  } catch {
    return formula;
  }
}

export function Math({ tex, children, display = false, label, className }: MathProps) {
  const formula = (tex ?? children ?? '').trim();
  const html = renderKatex(formula, display);

  if (display) {
    return (
      <div
        role="math"
        tabIndex={0}
        aria-label={label ?? formula}
        className={cn('my-4 overflow-x-auto rounded-sm bg-subtle/60 px-4 py-3 text-center', className)}
        dangerouslySetInnerHTML={{ __html: html }}
      />
    );
  }

  return (
    <span
      role="math"
      aria-label={label ?? formula}
      className={cn('inline-block align-baseline', className)}
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}
