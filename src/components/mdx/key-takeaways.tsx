import * as React from 'react';
import { CheckCircle2 } from 'lucide-react';

export function KeyTakeaways({ items }: { items: string[] }) {
  return (
    <section
      aria-label="Key Takeaways"
      className="my-8 rounded-md border border-accent/30 bg-accent-soft/30 p-5"
    >
      <h2 className="mb-3 flex items-center gap-2 text-base font-semibold text-primary">
        <CheckCircle2 className="h-4 w-4 text-accent" aria-hidden="true" />
        Key Takeaways
      </h2>
      <ul className="space-y-2 text-sm leading-relaxed text-primary-secondary">
        {items.map((item, index) => (
          <li key={index} className="flex items-start gap-2.5">
            <span
              className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-accent"
              aria-hidden="true"
            />
            <span>{item}</span>
          </li>
        ))}
      </ul>
    </section>
  );
}

