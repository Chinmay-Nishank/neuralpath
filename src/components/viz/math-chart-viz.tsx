'use client';

import * as React from 'react';
import { VizShell } from './viz-shell';
import { Slider } from '@/components/ui/slider';
import { Select } from '@/components/ui/select';
import { DataTable } from '@/components/ui/table';

export type MathVizPreset =
  | 'linear-algebra'
  | 'probability'
  | 'activations'
  | 'roc-pr'
  | 'quantization'
  | 'shap'
  | 'rag';

export function MathChartViz({ preset = 'activations' }: { preset?: MathVizPreset }) {
  const [paramA, setParamA] = React.useState(1.0);
  const [paramB, setParamB] = React.useState(0.5);
  const [activeSub, setActiveSub] = React.useState('gelu');

  const handleReset = () => {
    setParamA(1.0);
    setParamB(0.5);
    setActiveSub('gelu');
  };

  if (preset === 'linear-algebra') {
    // 2x2 Matrix transformation [[paramA, paramB], [0.2, 1.1]] applied to unit square & basis vectors
    const a11 = paramA;
    const a12 = paramB;
    const a21 = 0.25;
    const a22 = 1.1;
    const det = a11 * a22 - a12 * a21;
    const transform = (x: number, y: number): [number, number] => [a11 * x + a12 * y, a21 * x + a22 * y];
    const p00 = transform(0, 0);
    const p10 = transform(1, 0);
    const p11 = transform(1, 1);
    const p01 = transform(0, 1);
    const tx = (x: number) => 180 + x * 60;
    const ty = (y: number) => 150 - y * 60;
    const poly = [p00, p10, p11, p01].map(([x, y]) => `${tx(x)},${ty(y)}`).join(' ');

    return (
      <VizShell
        title="2×2 Linear Matrix Transformation & Determinant"
        whatToNotice="Watch how matrix columns map basis vectors î and ĵ, shearing/scaling the unit square by |det(A)|."
        onReset={handleReset}
        summaryText={`Determinant det(A) = ${det.toFixed(2)}. Basis î maps to (${p10[0].toFixed(2)}, ${p10[1].toFixed(2)}).`}
        controls={
          <div className="space-y-4">
            <Slider label="Matrix a₁₁ (Scale X)" value={paramA} min={-1.5} max={2.0} step={0.1} formatValue={(v) => v.toFixed(1)} onValueChange={setParamA} />
            <Slider label="Matrix a₁₂ (Shear X)" value={paramB} min={-1.5} max={1.5} step={0.1} formatValue={(v) => v.toFixed(1)} onValueChange={setParamB} />
            <div className="rounded-sm border border-hairline bg-surface p-3 font-mono text-xs">
              det(A) = <strong>{det.toFixed(2)}</strong>
            </div>
          </div>
        }
      >
        <svg viewBox="0 0 360 260" className="h-auto max-h-[300px] w-full rounded-sm border border-hairline bg-canvas" role="img" aria-label="2D linear transformation of unit square">
          <line x1="180" y1="15" x2="180" y2="245" stroke="var(--border-hairline)" />
          <line x1="20" y1="150" x2="340" y2="150" stroke="var(--border-hairline)" />
          <polygon points={poly} fill="rgba(0, 114, 178, 0.18)" stroke="#0072B2" strokeWidth="2" />
          <line x1={tx(0)} y1={ty(0)} x2={tx(p10[0])} y2={ty(p10[1])} stroke="#E69F00" strokeWidth="3" />
          <line x1={tx(0)} y1={ty(0)} x2={tx(p01[0])} y2={ty(p01[1])} stroke="#009E73" strokeWidth="3" />
        </svg>
      </VizShell>
    );
  }

  if (preset === 'probability') {
    const mu = (paramA - 1) * 1.5;
    const sigma = Math.max(0.3, paramB + 0.4);
    const pts = Array.from({ length: 61 }, (_, i) => {
      const x = -4 + (i / 60) * 8;
      const z = (x - mu) / sigma;
      const pdf = Math.exp(-0.5 * z * z) / (sigma * Math.sqrt(2 * Math.PI));
      return { x, pdf };
    });
    const path = pts
      .map((p) => `${(24 + ((p.x + 4) / 8) * 312).toFixed(1)},${(220 - p.pdf * 240).toFixed(1)}`)
      .join(' ');
    const entropy = 0.5 * Math.log(2 * Math.PI * Math.E * sigma * sigma);

    return (
      <VizShell
        title="Gaussian Distribution & Differential Entropy Explorer"
        whatToNotice="Widening standard deviation σ flattens peak density and raises uncertainty (differential entropy)."
        onReset={handleReset}
        summaryText={`Gaussian N(μ=${mu.toFixed(2)}, σ=${sigma.toFixed(2)}), Differential Entropy H=${entropy.toFixed(2)} nats.`}
        controls={
          <div className="space-y-4">
            <Slider label="Mean (μ)" value={mu} min={-2} max={2} step={0.1} formatValue={(v) => v.toFixed(1)} onValueChange={(v) => setParamA(v / 1.5 + 1)} />
            <Slider label="Std Dev (σ)" value={sigma} min={0.35} max={1.8} step={0.05} formatValue={(v) => v.toFixed(2)} onValueChange={(v) => setParamB(v - 0.4)} />
            <div className="rounded-sm border border-hairline bg-surface p-3 font-mono text-xs">
              Entropy: <strong>{entropy.toFixed(2)} nats</strong>
            </div>
          </div>
        }
      >
        <svg viewBox="0 0 360 250" className="h-auto max-h-[300px] w-full rounded-sm border border-hairline bg-canvas" role="img" aria-label="Gaussian probability density curve">
          <line x1="24" y1="220" x2="336" y2="220" stroke="var(--border-strong)" />
          <polyline fill="none" stroke="#0072B2" strokeWidth="2.5" points={path} />
        </svg>
      </VizShell>
    );
  }

  if (preset === 'roc-pr') {
    const threshold = Math.max(0.05, Math.min(0.95, paramB));
    const sep = Math.max(0.4, paramA * 1.4);
    const tp = Math.round(80 * (1 / (1 + Math.exp((threshold - 0.5) * 4 * sep))));
    const fn = 80 - tp;
    const fp = Math.round(60 * (1 / (1 + Math.exp((threshold - 0.25) * 5 * sep))));
    const tn = 60 - fp;
    const precision = tp / Math.max(1, tp + fp);
    const recall = tp / Math.max(1, tp + fn);
    const f1 = (2 * precision * recall) / Math.max(1e-6, precision + recall);

    return (
      <VizShell
        title="Classification Threshold, Precision-Recall & Confusion Matrix"
        whatToNotice="Drag the probability threshold upward to suppress False Positives (raising Precision) at the expense of Recall."
        onReset={handleReset}
        summaryText={`At threshold ${threshold.toFixed(2)}: Precision=${(precision * 100).toFixed(1)}%, Recall=${(recall * 100).toFixed(1)}%, F1=${f1.toFixed(2)}.`}
        summaryTable={
          <DataTable
            caption="Confusion matrix counts"
            headers={['Actual \\ Predicted', 'Pred Positive', 'Pred Negative']}
            rows={[
              ['Actual Positive', `TP = ${tp}`, `FN = ${fn}`],
              ['Actual Negative', `FP = ${fp}`, `TN = ${tn}`],
            ]}
          />
        }
        controls={
          <div className="space-y-4">
            <Slider label="Decision Threshold" value={threshold} min={0.1} max={0.9} step={0.05} formatValue={(v) => v.toFixed(2)} onValueChange={setParamB} />
            <Slider label="Model Separability" value={sep} min={0.6} max={2.4} step={0.1} formatValue={(v) => v.toFixed(1)} onValueChange={(v) => setParamA(v / 1.4)} />
          </div>
        }
      >
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="rounded-sm border border-hairline bg-canvas p-4 space-y-2 text-xs">
            <div className="font-semibold text-primary">Confusion Matrix</div>
            <div className="grid grid-cols-2 gap-2 font-mono text-center">
              <div className="rounded bg-success-soft p-3 text-success">TP: {tp}</div>
              <div className="rounded bg-warning-soft p-3 text-warning">FN: {fn}</div>
              <div className="rounded bg-danger-soft p-3 text-danger">FP: {fp}</div>
              <div className="rounded bg-info-soft p-3 text-info">TN: {tn}</div>
            </div>
          </div>
          <div className="rounded-sm border border-hairline bg-canvas p-4 space-y-2.5 text-xs font-mono">
            <div className="font-sans font-semibold text-primary">Threshold Metrics</div>
            <div className="flex justify-between"><span>Precision:</span><strong>{(precision * 100).toFixed(1)}%</strong></div>
            <div className="flex justify-between"><span>Recall (TPR):</span><strong>{(recall * 100).toFixed(1)}%</strong></div>
            <div className="flex justify-between"><span>F1 Score:</span><strong>{f1.toFixed(3)}</strong></div>
          </div>
        </div>
      </VizShell>
    );
  }

  if (preset === 'quantization') {
    const bits = activeSub === 'int4' ? 4 : activeSub === 'int8' ? 8 : 16;
    const levels = bits === 16 ? 65536 : 2 ** bits;
    const paramsB = Math.round(paramA * 7); // e.g., 7B - 14B
    const vramGb = ((paramsB * 1e9 * (bits / 8)) / 1e9) * 1.15;
    const sampleWeight = 0.3719;
    const stepSize = 2 / (levels - 1);
    const quantWeight = Math.round(sampleWeight / stepSize) * stepSize;
    const err = Math.abs(sampleWeight - quantWeight);

    return (
      <VizShell
        title="Model Quantization: Memory Footprint vs. Precision Error"
        whatToNotice="Dropping from FP16 to INT4 cuts 7B model VRAM by nearly 4× while keeping scalar quantization error tiny when group-wise scaling is used."
        onReset={handleReset}
        controls={
          <div className="space-y-4">
            <Select
              label="Precision Format"
              value={activeSub}
              onValueChange={setActiveSub}
              options={[
                { value: 'fp16', label: 'FP16 / BF16 (16-bit)' },
                { value: 'int8', label: 'INT8 (8-bit)' },
                { value: 'int4', label: 'NF4 / AWQ (4-bit)' },
              ]}
            />
            <Slider label="Model Size (Billion Params)" value={paramsB} min={1} max={70} step={1} unit="B" onValueChange={(v) => setParamA(v / 7)} />
          </div>
        }
      >
        <div className="grid gap-3 sm:grid-cols-3">
          <div className="rounded-sm border border-hairline bg-canvas p-4">
            <div className="text-xs text-primary-muted">Estimated VRAM (+KV overhead)</div>
            <div className="mt-1 font-mono text-2xl font-semibold text-primary">{vramGb.toFixed(1)} GB</div>
          </div>
          <div className="rounded-sm border border-hairline bg-canvas p-4">
            <div className="text-xs text-primary-muted">Representable Levels</div>
            <div className="mt-1 font-mono text-2xl font-semibold text-primary">{levels.toLocaleString()}</div>
          </div>
          <div className="rounded-sm border border-hairline bg-canvas p-4">
            <div className="text-xs text-primary-muted">Sample Error |w - q(w)|</div>
            <div className="mt-1 font-mono text-2xl font-semibold text-primary">{err.toFixed(5)}</div>
          </div>
        </div>
      </VizShell>
    );
  }

  if (preset === 'shap') {
    const base = 0.35;
    const f1 = (paramA - 1) * 0.25;
    const f2 = (paramB - 0.5) * 0.35;
    const f3 = 0.14;
    const pred = Math.max(0.01, Math.min(0.99, base + f1 + f2 + f3));
    const bars = [
      { label: 'Debt-to-Income', val: f1 },
      { label: 'Credit History', val: f2 },
      { label: 'Verified Income', val: f3 },
    ];

    return (
      <VizShell
        title="SHAP Additive Feature Attribution Waterfall"
        whatToNotice="Each feature's Shapley contribution adds linearly from the dataset baseline E[f(x)] = 0.35 to the exact model prediction."
        onReset={handleReset}
        controls={
          <div className="space-y-4">
            <Slider label="Debt-to-Income Contribution" value={f1} min={-0.3} max={0.3} step={0.02} formatValue={(v) => v.toFixed(2)} onValueChange={(v) => setParamA(v / 0.25 + 1)} />
            <Slider label="Credit History Contribution" value={f2} min={-0.3} max={0.3} step={0.02} formatValue={(v) => v.toFixed(2)} onValueChange={(v) => setParamB(v / 0.35 + 0.5)} />
          </div>
        }
      >
        <div className="space-y-3 rounded-sm border border-hairline bg-canvas p-4 text-xs">
          <div className="flex justify-between font-mono">
            <span>Base Rate E[f(x)]: {base.toFixed(2)}</span>
            <strong>Final f(x): {pred.toFixed(2)}</strong>
          </div>
          {bars.map((b) => (
            <div key={b.label} className="space-y-1">
              <div className="flex justify-between">
                <span>{b.label}</span>
                <span className="font-mono">{b.val >= 0 ? `+${b.val.toFixed(2)}` : b.val.toFixed(2)}</span>
              </div>
              <div className="h-3 overflow-hidden rounded-full bg-subtle">
                <div
                  className="h-full rounded-full"
                  style={{
                    width: `${Math.min(100, Math.abs(b.val) * 280)}%`,
                    backgroundColor: b.val >= 0 ? '#0072B2' : '#D55E00',
                  }}
                />
              </div>
            </div>
          ))}
        </div>
      </VizShell>
    );
  }

  if (preset === 'rag') {
    const denseWeight = paramB;
    const sparseWeight = 1 - denseWeight;
    const chunks = [
      { id: 'Chunk A (RoPE Formula)', dense: 0.91, sparse: 0.42 },
      { id: 'Chunk B (Exact Flag --kv-cache-dtype)', dense: 0.52, sparse: 0.96 },
      { id: 'Chunk C (General Transformer Intro)', dense: 0.78, sparse: 0.25 },
    ].map((c) => ({
      ...c,
      hybrid: denseWeight * c.dense + sparseWeight * c.sparse,
    })).sort((a, b) => b.hybrid - a.hybrid);

    return (
      <VizShell
        title="Hybrid RAG Retrieval Scorer (Dense Embeddings + BM25)"
        whatToNotice="Adjust α weighting between Semantic Vector Similarity and Sparse BM25 keyword match to see why Hybrid Search rescues exact technical identifiers."
        onReset={handleReset}
        controls={
          <div className="space-y-4">
            <Slider
              label="Dense Vector Weight (α)"
              value={denseWeight}
              min={0}
              max={1}
              step={0.05}
              formatValue={(v) => v.toFixed(2)}
              onValueChange={setParamB}
            />
          </div>
        }
      >
        <DataTable
          caption="Hybrid retrieval ranking"
          headers={['Rank & Chunk', 'Dense Cosine', 'BM25 Sparse', 'Hybrid Score']}
          rows={chunks.map((c, idx) => [
            `#${idx + 1} ${c.id}`,
            c.dense.toFixed(2),
            c.sparse.toFixed(2),
            c.hybrid.toFixed(3),
          ])}
        />
      </VizShell>
    );
  }

  // Default: activation functions (ReLU, GELU, SwiGLU/SiLU, Sigmoid, Tanh)
  const actFn = (x: number, kind: string) => {
    if (kind === 'relu') return Math.max(0, x);
    if (kind === 'sigmoid') return 1 / (1 + Math.exp(-x));
    if (kind === 'tanh') return Math.tanh(x);
    if (kind === 'silu') return x / (1 + Math.exp(-x));
    // GELU approx
    return 0.5 * x * (1 + Math.tanh(Math.sqrt(2 / Math.PI) * (x + 0.044715 * x ** 3)));
  };

  const xs = Array.from({ length: 61 }, (_, i) => -3 + (i / 60) * 6);
  const pathVal = xs
    .map((x) => {
      const y = actFn(x * paramA, activeSub);
      const sx = 24 + ((x + 3) / 6) * 312;
      const sy = 155 - y * 42;
      return `${sx.toFixed(1)},${sy.toFixed(1)}`;
    })
    .join(' ');
  const pathGrad = xs
    .map((x) => {
      const h = 1e-3;
      const g = (actFn((x + h) * paramA, activeSub) - actFn((x - h) * paramA, activeSub)) / (2 * h);
      const sx = 24 + ((x + 3) / 6) * 312;
      const sy = 155 - g * 42;
      return `${sx.toFixed(1)},${sy.toFixed(1)}`;
    })
    .join(' ');

  return (
    <VizShell
      title="Neural Activation Functions & Their Gradients"
      whatToNotice="Compare ReLU's zero gradient for x < 0 against smooth GELU and SiLU/Swish used in modern LLMs."
      onReset={handleReset}
      legend={[
        { label: 'Activation f(x)', color: '#0072B2', shape: 'line' },
        { label: "Derivative f'(x)", color: '#D55E00', shape: 'line' },
      ]}
      controls={
        <div className="space-y-4">
          <Select
            label="Activation"
            value={activeSub}
            onValueChange={setActiveSub}
            options={[
              { value: 'gelu', label: 'GELU (Transformers)' },
              { value: 'silu', label: 'SiLU / Swish (SwiGLU)' },
              { value: 'relu', label: 'ReLU' },
              { value: 'tanh', label: 'Tanh' },
              { value: 'sigmoid', label: 'Sigmoid' },
            ]}
          />
          <Slider label="Input Gain (β)" value={paramA} min={0.4} max={2.5} step={0.1} formatValue={(v) => v.toFixed(1)} onValueChange={setParamA} />
        </div>
      }
    >
      <svg viewBox="0 0 360 240" className="h-auto max-h-[300px] w-full rounded-sm border border-hairline bg-canvas" role="img" aria-label="Activation function and derivative plot">
        <line x1="180" y1="15" x2="180" y2="225" stroke="var(--border-hairline)" />
        <line x1="24" y1="155" x2="336" y2="155" stroke="var(--border-hairline)" />
        <polyline fill="none" stroke="#D55E00" strokeWidth="1.8" strokeDasharray="4 3" points={pathGrad} />
        <polyline fill="none" stroke="#0072B2" strokeWidth="2.5" points={pathVal} />
      </svg>
    </VizShell>
  );
}

