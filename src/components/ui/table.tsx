import * as React from 'react';
import { cn } from '@/lib/utils';

export function DataTable({
  headers,
  rows,
  caption,
  className,
}: {
  headers: string[];
  rows: (string | number | React.ReactNode)[][];
  caption?: string;
  className?: string;
}) {
  return (
    <div className={cn('w-full overflow-x-auto rounded-md border border-hairline bg-surface', className)}>
      <table className="w-full border-collapse text-left text-sm">
        {caption && <caption className="sr-only">{caption}</caption>}
        <thead className="border-b border-hairline bg-subtle text-xs font-semibold uppercase tracking-wide text-primary-secondary">
          <tr>
            {headers.map((h) => (
              <th key={h} scope="col" className="px-4 py-2.5">
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-hairline">
          {rows.map((row, rIdx) => (
            <tr key={rIdx} className="transition-colors hover:bg-subtle/60">
              {row.map((cell, cIdx) => (
                <td key={cIdx} className="px-4 py-2.5 font-mono text-xs tabular-nums text-primary">
                  {cell}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

