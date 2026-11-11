'use client';

import * as React from 'react';
import { VizShell } from './viz-shell';
import { Select } from '@/components/ui/select';
import { Toggle } from '@/components/ui/toggle';
import { Slider } from '@/components/ui/slider';
import { DataTable } from '@/components/ui/table';
import { cn } from '@/lib/utils';

type PresetId = 'pronoun-tired' | 'pronoun-wide' | 'causal-code';

const PRESETS: Record<
  PresetId,
  {
    label: string;
    tokens: string[];
    // Pre-projected illustrative 4-dim Q and K embeddings that cleanly demonstrate semantic vs syntactic matching
    qVectors: number[][];
    kVectors: number[][];
  }
> = {
  'pronoun-tired': {
    label: 'The animal ... because it was tired',
    tokens: ['The', 'animal', 'crossed', 'the', 'street', 'because', 'it', 'was', 'tired'],
    qVectors: [
      [0.6, 0.1, 0.2, 0.0],
      [0.9, 0.8, 0.1, 0.1],
      [0.4, 0.3, 0.9, 0.2],
      [0.5, 0.1, 0.2, 0.0],
      [0.2, 0.2, 0.8, 0.9],
      [0.3, 0.4, 0.5, 0.3],
      [1.1, 1.3, 0.1, 0.1], // "it" attends strongly to "animal" (living entity + tired context)
      [0.4, 0.6, 0.4, 0.2],
      [0.8, 1.0, 0.1, 0.1],
    ],
    kVectors: [
      [0.5, 0.1, 0.1, 0.0],
      [1.4, 1.4, 0.1, 0.0], // animal
      [0.4, 0.3, 0.9, 0.2],
      [0.4, 0.1, 0.2, 0.0],
      [0.2, 0.1, 0.7, 0.8], // street
      [0.3, 0.3, 0.4, 0.2],
      [0.9, 0.9, 0.2, 0.1],
      [0.3, 0.4, 0.4, 0.2],
      [0.8, 0.9, 0.1, 0.1],
    ],
  },
  'pronoun-wide': {
    label: 'The animal ... because it was wide',
    tokens: ['The', 'animal', 'crossed', 'the', 'street', 'because', 'it', 'was', 'wide'],
    qVectors: [
      [0.6, 0.1, 0.2, 0.0],
      [0.9, 0.8, 0.1, 0.1],
      [0.4, 0.3, 0.9, 0.2],
      [0.5, 0.1, 0.2, 0.0],
      [0.2, 0.2, 0.9, 1.1],
      [0.3, 0.4, 0.5, 0.3],
      [0.1, 0.1, 1.2, 1.5], // "it" now aligns with spatial/object axis -> "street"
      [0.4, 0.3, 0.5, 0.4],
      [0.1, 0.1, 1.0, 1.3],
    ],
    kVectors: [
      [0.5, 0.1, 0.1, 0.0],
      [0.9, 0.9, 0.1, 0.0],
      [0.4, 0.3, 0.9, 0.2],
      [0.4, 0.1, 0.2, 0.0],
      [0.1, 0.1, 1.2, 1.5], // street
      [0.3, 0.3, 0.4, 0.2],
      [0.2, 0.2, 0.9, 1.0],
      [0.3, 0.3, 0.5, 0.3],
      [0.1, 0.1, 0.9, 1.1],
    ],
  },
  'causal-code': {
    label: 'Autoregressive Code Completion',
    tokens: ['def', 'relu', '(', 'x', ')', ':', 'return', 'max', '(0,x)'],
    qVectors: [
      [0.9, 0.2, 0.1, 0.1],
      [0.7, 0.9, 0.2, 0.1],
      [0.2, 0.3, 1.0, 0.1],
      [0.2, 0.4, 0.3, 1.1],
      [0.2, 0.3, 1.1, 0.2],
      [0.5, 0.2, 0.7, 0.2],
      [0.9, 0.5, 0.3, 0.2],
      [0.4, 1.0, 0.3, 0.4],
      [0.3, 0.9, 0.4, 1.2],
    ],
    kVectors: [
      [0.9, 0.3, 0.1, 0.1],
      [0.7, 1.0, 0.2, 0.2],
      [0.2, 0.2, 1.1, 0.1],
      [0.2, 0.4, 0.2, 1.2],
      [0.2, 0.2, 1.0, 0.1],
      [0.5, 0.2, 0.6, 0.2],
      [0.8, 0.4, 0.3, 0.2],
      [0.4, 0.9, 0.2, 0.4],
      [0.3, 0.8, 0.3, 1.0],
    ],
  },
};

function softmaxRow(logits: number[]): number[] {
  const finite = logits.filter((v) => Number.isFinite(v));
  const maxVal = finite.length > 0 ? Math.max(...finite) : 0;
  const exps = logits.map((v) => (Number.isFinite(v) ? Math.exp(v - maxVal) : 0));
  const sum = exps.reduce((a, b) => a + b, 0) || 1;
  return exps.map((v) => v / sum);
}

export function AttentionExplorerViz({ defaultPreset = 'pronoun-tired' }: { defaultPreset?: PresetId }) {
  const [preset, setPreset] = React.useState<PresetId>(defaultPreset);
  const [causalMask, setCausalMask] = React.useState(false);
  const [temperature, setTemperature] = React.useState(1.0);
  const [selectedQueryIdx, setSelectedQueryIdx] = React.useState(6); // "it"

  const data = PRESETS[preset];
  const tokens = data.tokens;

  const { scores, probs } = React.useMemo(() => {
    const dk = data.qVectors[0]?.length ?? 4;
    const scale = Math.sqrt(dk) * temperature;
    const scoreMat: number[][] = [];
    const probMat: number[][] = [];

    for (let i = 0; i < tokens.length; i++) {
      const q = data.qVectors[i] ?? [];
      const rowScores: number[] = [];
      for (let j = 0; j < tokens.length; j++) {
        if (causalMask && j > i) {
          rowScores.push(Number.NEGATIVE_INFINITY);
        } else {
          const k = data.kVectors[j] ?? [];
          const dot = q.reduce((acc, qv, idx) => acc + qv * (k[idx] ?? 0), 0);
          rowScores.push(dot / scale);
        }
      }
      scoreMat.push(rowScores);
      probMat.push(softmaxRow(rowScores));
    }

    return { scores: scoreMat, probs: probMat };
  }, [data, tokens.length, causalMask, temperature]);

  const activeRowProbs = probs[selectedQueryIdx] ?? [];
  const activeQueryToken = tokens[selectedQueryIdx] ?? '';

  const handleReset = () => {
    setPreset(defaultPreset);
    setCausalMask(false);
    setTemperature(1.0);
    setSelectedQueryIdx(6);
  };

  return (
    <VizShell
      title="Self-Attention Explorer (Q, K, V & Scaled Dot-Product)"
      whatToNotice="Click any query token row (like 'it') to inspect its Q·Kᵀ/√d_k attention distribution. Switch between 'tired' and 'wide' or enable Causal Masking to see how GPT blocks future tokens."
      onReset={handleReset}
      shareParams={{ preset, causalMask, temperature, q: selectedQueryIdx }}
      summaryText={`Selected query token "${activeQueryToken}" (index ${selectedQueryIdx}). Highest attention weight goes to "${
        tokens[
          activeRowProbs.reduce((bestIdx, val, idx, arr) => (val > (arr[bestIdx] ?? -1) ? idx : bestIdx), 0)
        ] ?? ''
      }".`}
      summaryTable={
        <DataTable
          caption={`Attention weights for query token ${activeQueryToken}`}
          headers={['Key Token', 'Raw Scaled Score', 'Attention Weight']}
          rows={tokens.map((tok, j) => {
            const raw = scores[selectedQueryIdx]?.[j] ?? 0;
            const w = activeRowProbs[j] ?? 0;
            return [
              tok,
              Number.isFinite(raw) ? raw.toFixed(3) : '-∞ (masked)',
              `${(w * 100).toFixed(1)}%`,
            ];
          })}
        />
      }
      controls={
        <div className="space-y-4">
          <Select
            label="Sentence Preset"
            value={preset}
            onValueChange={(v) => {
              setPreset(v as PresetId);
              setSelectedQueryIdx(v === 'causal-code' ? 6 : 6);
            }}
            options={[
              { value: 'pronoun-tired', label: '...because it was tired' },
              { value: 'pronoun-wide', label: '...because it was wide' },
              { value: 'causal-code', label: 'Python ReLU function' },
            ]}
          />

          <Toggle
            label="Causal Mask (GPT-style)"
            description="Prevent tokens from attending to future positions (j > i)."
            checked={causalMask}
            onCheckedChange={setCausalMask}
          />

          <Slider
            label="Scaling Temperature (τ)"
            value={temperature}
            min={0.3}
            max={2.5}
            step={0.1}
            formatValue={(v) => v.toFixed(1)}
            onValueChange={setTemperature}
          />

          <div className="space-y-2 border-t border-hairline pt-3">
            <div className="text-xs font-semibold text-primary">
              Attention from &ldquo;{activeQueryToken}&rdquo;
            </div>
            <div className="space-y-1.5">
              {tokens.map((tok, j) => {
                const weight = activeRowProbs[j] ?? 0;
                return (
                  <div key={`${tok}-${j}`} className="flex items-center gap-2 text-xs">
                    <span className="w-16 truncate font-mono text-primary-secondary">{tok}</span>
                    <div className="h-2.5 flex-1 overflow-hidden rounded-full bg-subtle">
                      <div
                        className="h-full rounded-full bg-accent transition-[width] duration-200"
                        style={{ width: `${Math.round(weight * 100)}%` }}
                      />
                    </div>
                    <span className="w-10 text-right font-mono tabular-nums text-primary">
                      {(weight * 100).toFixed(0)}%
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      }
    >
      <div className="overflow-x-auto">
        <div className="min-w-[460px] space-y-2">
          <div className="flex items-center justify-between text-xs text-primary-secondary">
            <span>Rows = Query tokens (click row to inspect)</span>
            <span>Columns = Key tokens</span>
          </div>

          <div
            className="grid gap-1"
            style={{
              gridTemplateColumns: `80px repeat(${tokens.length}, minmax(36px, 1fr))`,
            }}
          >
            <div />
            {tokens.map((tok, j) => (
              <div
                key={`col-${j}`}
                className="truncate px-1 py-1 text-center font-mono text-[11px] font-medium text-primary-secondary"
                title={tok}
              >
                {tok}
              </div>
            ))}

            {tokens.map((rowTok, i) => {
              const isSelectedRow = i === selectedQueryIdx;
              return (
                <React.Fragment key={`row-${i}`}>
                  <button
                    type="button"
                    onClick={() => setSelectedQueryIdx(i)}
                    className={cn(
                      'truncate rounded-sm px-2 py-1.5 text-left font-mono text-[11px] font-medium transition-colors',
                      isSelectedRow
                        ? 'bg-accent text-accent-foreground'
                        : 'bg-subtle text-primary hover:bg-hairline'
                    )}
                  >
                    {rowTok}
                  </button>
                  {tokens.map((colTok, j) => {
                    const weight = probs[i]?.[j] ?? 0;
                    const masked = causalMask && j > i;
                    return (
                      <button
                        key={`cell-${i}-${j}`}
                        type="button"
                        onClick={() => setSelectedQueryIdx(i)}
                        title={`Query "${rowTok}" -> Key "${colTok}": ${(weight * 100).toFixed(1)}%`}
                        aria-label={`Attention weight from ${rowTok} to ${colTok}: ${(weight * 100).toFixed(1)} percent`}
                        className={cn(
                          'flex h-9 items-center justify-center rounded-[4px] border font-mono text-[10px] tabular-nums transition-transform focus-visible:ring-2 focus-visible:ring-accent',
                          isSelectedRow ? 'border-accent/60' : 'border-hairline',
                          masked && 'bg-subtle/40 text-primary-muted'
                        )}
                        style={
                          masked
                            ? undefined
                            : {
                                backgroundColor: `rgba(29, 78, 216, ${(0.08 + weight * 0.88).toFixed(2)})`,
                                color: weight > 0.35 ? '#ffffff' : 'var(--text-primary)',
                              }
                        }
                      >
                        {masked ? '—' : `${Math.round(weight * 100)}`}
                      </button>
                    );
                  })}
                </React.Fragment>
              );
            })}
          </div>
        </div>
      </div>
    </VizShell>
  );
}

