'use client';

import * as React from 'react';
import { VizShell } from './viz-shell';
import { Slider } from '@/components/ui/slider';
import { DataTable } from '@/components/ui/table';

interface MergeRule {
  pair: [string, string];
  merged: string;
  count: number;
}

const TOKEN_COLORS = [
  'bg-sky-500/20 border-sky-500/40 text-sky-900 dark:text-sky-100',
  'bg-amber-500/20 border-amber-500/40 text-amber-900 dark:text-amber-100',
  'bg-emerald-500/20 border-emerald-500/40 text-emerald-900 dark:text-emerald-100',
  'bg-purple-500/20 border-purple-500/40 text-purple-900 dark:text-purple-100',
  'bg-rose-500/20 border-rose-500/40 text-rose-900 dark:text-rose-100',
];

const DEFAULT_TEXT =
  'tokenization compresses common patterns like learning, neural, transformer, and transformers into subwords.';

function computeBpeSteps(text: string, maxMerges: number): {
  tokens: string[];
  merges: MergeRule[];
} {
  // Split into whitespace-preserving pre-tokens
  const words = text.match(/\S+|\s+/g) ?? [];
  let sequences = words.map((w) => (w.trim() === '' ? [w] : Array.from(w)));
  const merges: MergeRule[] = [];

  for (let step = 0; step < maxMerges; step++) {
    const pairCounts = new Map<string, { pair: [string, string]; count: number }>();
    for (const seq of sequences) {
      if (seq.length < 2) continue;
      for (let i = 0; i < seq.length - 1; i++) {
        const a = seq[i];
        const b = seq[i + 1];
        if (!a || !b) continue;
        const key = `${a}\u0000${b}`;
        const existing = pairCounts.get(key);
        if (existing) {
          existing.count += 1;
        } else {
          pairCounts.set(key, { pair: [a, b], count: 1 });
        }
      }
    }

    let best: { pair: [string, string]; count: number } | null = null;
    for (const entry of pairCounts.values()) {
      if (!best || entry.count > best.count) {
        best = entry;
      }
    }

    if (!best || best.count < 2) break;

    const [first, second] = best.pair;
    const merged = `${first}${second}`;
    merges.push({ pair: [first, second], merged, count: best.count });

    sequences = sequences.map((seq) => {
      const next: string[] = [];
      let i = 0;
      while (i < seq.length) {
        const cur = seq[i];
        const nxt = seq[i + 1];
        if (cur === first && nxt === second) {
          next.push(merged);
          i += 2;
        } else {
          if (cur !== undefined) next.push(cur);
          i += 1;
        }
      }
      return next;
    });
  }

  return { tokens: sequences.flat(), merges };
}

export function TokenizerViz() {
  const [text, setText] = React.useState(DEFAULT_TEXT);
  const [mergeSteps, setMergeSteps] = React.useState(12);

  const { tokens, merges } = React.useMemo(
    () => computeBpeSteps(text, mergeSteps),
    [text, mergeSteps]
  );

  const charCount = text.length;
  const wordCount = (text.trim().match(/\S+/g) ?? []).length;
  const compressionRatio = tokens.length > 0 ? (charCount / tokens.length).toFixed(2) : '0';

  const handleReset = () => {
    setText(DEFAULT_TEXT);
    setMergeSteps(12);
  };

  return (
    <VizShell
      title="Byte-Pair Encoding (BPE) Tokenizer Visualizer"
      whatToNotice="Drag BPE Merge Steps from 0 (pure character tokenization) upward to watch frequent adjacent pairs merge greedily into reusable subword tokens."
      onReset={handleReset}
      shareParams={{ mergeSteps }}
      summaryText={`Text length ${charCount} characters split into ${tokens.length} BPE tokens after ${merges.length} merges (${compressionRatio} chars/token).`}
      summaryTable={
        <DataTable
          caption="Learned BPE merge rules"
          headers={['Step', 'Merged Pair', 'New Subword', 'Frequency']}
          rows={merges.map((m, idx) => [
            idx + 1,
            `"${m.pair[0]}" + "${m.pair[1]}"`,
            `"${m.merged}"`,
            m.count,
          ])}
        />
      }
      controls={
        <div className="space-y-4">
          <Slider
            label="BPE Merge Steps"
            value={mergeSteps}
            min={0}
            max={30}
            step={1}
            onValueChange={setMergeSteps}
          />

          <div className="grid grid-cols-2 gap-2 text-xs">
            <div className="rounded-sm border border-hairline bg-surface p-2.5">
              <div className="text-primary-muted">BPE Tokens</div>
              <div className="font-mono text-lg font-semibold tabular-nums text-primary">
                {tokens.length}
              </div>
            </div>
            <div className="rounded-sm border border-hairline bg-surface p-2.5">
              <div className="text-primary-muted">Chars / Token</div>
              <div className="font-mono text-lg font-semibold tabular-nums text-primary">
                {compressionRatio}
              </div>
            </div>
            <div className="rounded-sm border border-hairline bg-surface p-2.5">
              <div className="text-primary-muted">Characters</div>
              <div className="font-mono text-base font-semibold tabular-nums text-primary">
                {charCount}
              </div>
            </div>
            <div className="rounded-sm border border-hairline bg-surface p-2.5">
              <div className="text-primary-muted">Words</div>
              <div className="font-mono text-base font-semibold tabular-nums text-primary">
                {wordCount}
              </div>
            </div>
          </div>

          {merges.length > 0 && (
            <div className="max-h-40 overflow-y-auto border-t border-hairline pt-2 text-xs">
              <div className="mb-1.5 font-semibold text-primary">Recent Merges</div>
              <ol className="space-y-1 font-mono text-[11px] text-primary-secondary">
                {merges.slice(-8).map((m, i) => (
                  <li key={`${m.merged}-${i}`}>
                    &ldquo;{m.pair[0]}&rdquo; + &ldquo;{m.pair[1]}&rdquo; → <strong>{m.merged}</strong> ({m.count}x)
                  </li>
                ))}
              </ol>
            </div>
          )}
        </div>
      }
    >
      <div className="space-y-4">
        <div>
          <label htmlFor="bpe-input-text" className="mb-1.5 block text-xs font-medium text-primary">
            Input Text (edit live)
          </label>
          <textarea
            id="bpe-input-text"
            rows={3}
            value={text}
            onChange={(e) => setText(e.target.value)}
            className="w-full rounded-sm border border-strong bg-canvas p-3 font-mono text-xs text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
          />
        </div>

        <div>
          <div className="mb-1.5 text-xs font-medium text-primary">Tokenized Output</div>
          <div className="flex flex-wrap gap-1.5 rounded-sm border border-hairline bg-canvas p-3">
            {tokens.map((tok, idx) => (
              <span
                key={`${tok}-${idx}`}
                className={`inline-flex items-center rounded border px-1.5 py-0.5 font-mono text-xs ${
                  tok.trim() === ''
                    ? 'border-hairline bg-subtle text-primary-muted'
                    : TOKEN_COLORS[idx % TOKEN_COLORS.length]
                }`}
                title={`Token #${idx}: "${tok}"`}
              >
                {tok === ' ' ? '␣' : tok}
              </span>
            ))}
          </div>
        </div>
      </div>
    </VizShell>
  );
}

