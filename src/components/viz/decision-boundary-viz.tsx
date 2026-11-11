'use client';

import * as React from 'react';
import { VizShell } from './viz-shell';
import { Select } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { DataTable } from '@/components/ui/table';

type DatasetId = 'moons' | 'circles' | 'xor' | 'linear';
type ModelId = 'logistic' | 'knn' | 'rbf-svm' | 'tree' | 'mlp';

interface SamplePoint {
  x: number;
  y: number;
  label: 0 | 1;
}

function seededRandom(seed: number) {
  let s = seed % 2147483647;
  if (s <= 0) s += 2147483646;
  return () => {
    s = (s * 16807) % 2147483647;
    return (s - 1) / 2147483646;
  };
}

function generateDataset(dataset: DatasetId, noise: number, n = 90): SamplePoint[] {
  const rand = seededRandom(42 + Math.round(noise * 100));
  const gauss = () => {
    const u1 = Math.max(1e-6, rand());
    const u2 = rand();
    return Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
  };
  const pts: SamplePoint[] = [];

  for (let i = 0; i < n; i++) {
    const cls: 0 | 1 = i < n / 2 ? 0 : 1;
    let x = 0;
    let y = 0;
    if (dataset === 'moons') {
      const t = (Math.PI * (i % (n / 2))) / (n / 2);
      if (cls === 0) {
        x = Math.cos(t) * 0.85 - 0.35;
        y = Math.sin(t) * 0.85 - 0.15;
      } else {
        x = 0.35 - Math.cos(t) * 0.85;
        y = 0.25 - Math.sin(t) * 0.85;
      }
    } else if (dataset === 'circles') {
      const angle = rand() * 2 * Math.PI;
      const r = cls === 0 ? 0.42 : 1.05;
      x = r * Math.cos(angle);
      y = r * Math.sin(angle);
    } else if (dataset === 'xor') {
      const sx = rand() > 0.5 ? 1 : -1;
      const sy = cls === 0 ? sx : -sx;
      x = sx * (0.35 + rand() * 0.75);
      y = sy * (0.35 + rand() * 0.75);
    } else {
      const d = cls === 0 ? -0.55 : 0.55;
      x = d + gauss() * 0.35;
      y = d * 0.8 + gauss() * 0.35;
    }

    pts.push({
      x: x + gauss() * noise,
      y: y + gauss() * noise,
      label: cls,
    });
  }
  return pts;
}

function buildPredictor(
  model: ModelId,
  data: SamplePoint[],
  k: number,
  gamma: number,
  maxDepth: number
): (x: number, y: number) => number {
  if (model === 'knn') {
    const kk = Math.max(1, Math.min(15, Math.round(k)));
    return (x, y) => {
      const dists = data
        .map((p) => ({ d: (p.x - x) ** 2 + (p.y - y) ** 2, label: p.label }))
        .sort((a, b) => a.d - b.d)
        .slice(0, kk);
      const sum = dists.reduce((acc, item) => acc + item.label, 0);
      return sum / kk;
    };
  }

  if (model === 'logistic') {
    let w1 = 0;
    let w2 = 0;
    let b = 0;
    for (let epoch = 0; epoch < 140; epoch++) {
      let g1 = 0;
      let g2 = 0;
      let gb = 0;
      for (const p of data) {
        const prob = 1 / (1 + Math.exp(-(w1 * p.x + w2 * p.y + b)));
        const diff = prob - p.label;
        g1 += diff * p.x;
        g2 += diff * p.y;
        gb += diff;
      }
      w1 -= (0.25 * g1) / data.length;
      w2 -= (0.25 * g2) / data.length;
      b -= (0.25 * gb) / data.length;
    }
    return (x, y) => 1 / (1 + Math.exp(-(w1 * x + w2 * y + b)));
  }

  if (model === 'rbf-svm') {
    // Kernel ridge / smooth RBF boundary using class prototypes
    const pos = data.filter((d) => d.label === 1);
    const neg = data.filter((d) => d.label === 0);
    return (x, y) => {
      let scorePos = 0;
      for (const p of pos) {
        scorePos += Math.exp(-gamma * ((p.x - x) ** 2 + (p.y - y) ** 2));
      }
      let scoreNeg = 0;
      for (const n of neg) {
        scoreNeg += Math.exp(-gamma * ((n.x - x) ** 2 + (n.y - y) ** 2));
      }
      const total = scorePos + scoreNeg || 1e-6;
      return scorePos / total;
    };
  }

  if (model === 'tree') {
    // Recursive axis-aligned decision tree built by Gini impurity
    interface TreeNode {
      leafVal?: number;
      axis?: 'x' | 'y';
      thresh?: number;
      left?: TreeNode;
      right?: TreeNode;
    }

    const gini = (pts: SamplePoint[]) => {
      if (pts.length === 0) return 0;
      const p1 = pts.filter((p) => p.label === 1).length / pts.length;
      return 1 - p1 * p1 - (1 - p1) * (1 - p1);
    };

    const buildNode = (pts: SamplePoint[], depth: number): TreeNode => {
      const mean = pts.reduce((a, b) => a + b.label, 0) / Math.max(1, pts.length);
      if (depth >= maxDepth || pts.length < 6 || mean === 0 || mean === 1) {
        return { leafVal: mean };
      }
      let bestGain = -1;
      let bestAxis: 'x' | 'y' = 'x';
      let bestThresh = 0;
      const parentGini = gini(pts);

      for (const axis of ['x', 'y'] as const) {
        const vals = pts.map((p) => p[axis]).sort((a, b) => a - b);
        for (let i = 2; i < vals.length - 2; i += Math.max(1, Math.floor(vals.length / 12))) {
          const thresh = vals[i] ?? 0;
          const left = pts.filter((p) => p[axis] <= thresh);
          const right = pts.filter((p) => p[axis] > thresh);
          if (left.length === 0 || right.length === 0) continue;
          const g =
            parentGini -
            (left.length / pts.length) * gini(left) -
            (right.length / pts.length) * gini(right);
          if (g > bestGain) {
            bestGain = g;
            bestAxis = axis;
            bestThresh = thresh;
          }
        }
      }

      if (bestGain <= 0.005) return { leafVal: mean };
      const leftPts = pts.filter((p) => p[bestAxis] <= bestThresh);
      const rightPts = pts.filter((p) => p[bestAxis] > bestThresh);
      return {
        axis: bestAxis,
        thresh: bestThresh,
        left: buildNode(leftPts, depth + 1),
        right: buildNode(rightPts, depth + 1),
      };
    };

    const root = buildNode(data, 0);
    const evalTree = (node: TreeNode, x: number, y: number): number => {
      if (node.leafVal !== undefined) return node.leafVal;
      const v = node.axis === 'x' ? x : y;
      return v <= (node.thresh ?? 0)
        ? evalTree(node.left!, x, y)
        : evalTree(node.right!, x, y);
    };
    return (x, y) => evalTree(root, x, y);
  }

  // Lightweight 2-layer tanh MLP (8 hidden units) trained with gradient descent
  const hidden = 8;
  const rand = seededRandom(7);
  const w1 = Array.from({ length: hidden }, () => [(rand() - 0.5) * 2.2, (rand() - 0.5) * 2.2]);
  const b1 = Array.from({ length: hidden }, () => (rand() - 0.5) * 0.5);
  const w2 = Array.from({ length: hidden }, () => (rand() - 0.5) * 1.4);
  let b2 = 0;

  for (let epoch = 0; epoch < 140; epoch++) {
    for (const p of data) {
      const h = w1.map((weights, i) => Math.tanh((weights[0] ?? 0) * p.x + (weights[1] ?? 0) * p.y + (b1[i] ?? 0)));
      const logit = h.reduce((acc, hv, i) => acc + hv * (w2[i] ?? 0), b2);
      const pred = 1 / (1 + Math.exp(-logit));
      const err = pred - p.label;

      for (let i = 0; i < hidden; i++) {
        const hv = h[i] ?? 0;
        const w2i = w2[i] ?? 0;
        const dh = err * w2i * (1 - hv * hv);
        w2[i] = w2i - 0.08 * err * hv;
        const row = w1[i];
        if (row) {
          row[0] = (row[0] ?? 0) - 0.08 * dh * p.x;
          row[1] = (row[1] ?? 0) - 0.08 * dh * p.y;
        }
        b1[i] = (b1[i] ?? 0) - 0.08 * dh;
      }
      b2 -= 0.08 * err;
    }
  }

  return (x, y) => {
    const h = w1.map((weights, i) => Math.tanh((weights[0] ?? 0) * x + (weights[1] ?? 0) * y + (b1[i] ?? 0)));
    const logit = h.reduce((acc, hv, i) => acc + hv * (w2[i] ?? 0), b2);
    return 1 / (1 + Math.exp(-logit));
  };
}

export function DecisionBoundaryViz({ defaultModel = 'rbf-svm' }: { defaultModel?: ModelId }) {
  const [dataset, setDataset] = React.useState<DatasetId>('moons');
  const [model, setModel] = React.useState<ModelId>(defaultModel);
  const [noise, setNoise] = React.useState(0.14);
  const [kNeighbors, setKNeighbors] = React.useState(5);
  const [gamma, setGamma] = React.useState(3.0);
  const [maxDepth, setMaxDepth] = React.useState(3);

  const points = React.useMemo(() => generateDataset(dataset, noise), [dataset, noise]);
  const predictor = React.useMemo(
    () => buildPredictor(model, points, kNeighbors, gamma, maxDepth),
    [model, points, kNeighbors, gamma, maxDepth]
  );

  const accuracy = React.useMemo(() => {
    const correct = points.filter((p) => (predictor(p.x, p.y) >= 0.5 ? 1 : 0) === p.label).length;
    return Math.round((correct / points.length) * 100);
  }, [points, predictor]);

  const gridCells = React.useMemo(() => {
    const res = 28;
    const cells: Array<{ x: number; y: number; w: number; h: number; fill: string }> = [];
    for (let i = 0; i < res; i++) {
      for (let j = 0; j < res; j++) {
        const px = -1.6 + ((i + 0.5) / res) * 3.2;
        const py = 1.6 - ((j + 0.5) / res) * 3.2;
        const prob = predictor(px, py);
        // Okabe-Ito Blue (#0072B2) vs Amber (#E69F00) soft background wash
        const fill =
          prob >= 0.5
            ? `rgba(0, 114, 178, ${(0.14 + (prob - 0.5) * 0.55).toFixed(2)})`
            : `rgba(230, 159, 0, ${(0.14 + (0.5 - prob) * 0.55).toFixed(2)})`;
        cells.push({
          x: (i / res) * 340,
          y: (j / res) * 280,
          w: 340 / res + 0.5,
          h: 280 / res + 0.5,
          fill,
        });
      }
    }
    return cells;
  }, [predictor]);

  const toSvgX = (x: number) => ((x + 1.6) / 3.2) * 340;
  const toSvgY = (y: number) => ((1.6 - y) / 3.2) * 280;

  const handleReset = () => {
    setDataset('moons');
    setModel(defaultModel);
    setNoise(0.14);
    setKNeighbors(5);
    setGamma(3.0);
    setMaxDepth(3);
  };

  return (
    <VizShell
      title="Decision Boundary Playground"
      whatToNotice="Compare linear Logistic Regression against non-linear RBF SVM, k-NN, axis-aligned Decision Trees, and an MLP on non-linear datasets like Moons and Concentric Circles."
      onReset={handleReset}
      shareParams={{ dataset, model, noise, k: kNeighbors, gamma, maxDepth }}
      legend={[
        { label: 'Class 0 (Amber)', color: '#E69F00', shape: 'circle' },
        { label: 'Class 1 (Blue)', color: '#0072B2', shape: 'circle' },
      ]}
      summaryText={`Dataset: ${dataset}, Model: ${model}, Training accuracy: ${accuracy}%.`}
      summaryTable={
        <DataTable
          caption="Decision boundary configuration and accuracy"
          headers={['Dataset', 'Model', 'Noise σ', 'Accuracy']}
          rows={[[dataset, model, noise.toFixed(2), `${accuracy}%`]]}
        />
      }
      controls={
        <div className="space-y-4">
          <Select
            label="Dataset"
            value={dataset}
            onValueChange={(v) => setDataset(v as DatasetId)}
            options={[
              { value: 'moons', label: 'Two Moons' },
              { value: 'circles', label: 'Concentric Circles' },
              { value: 'xor', label: 'XOR Quadrants' },
              { value: 'linear', label: 'Linearly Separable' },
            ]}
          />

          <Select
            label="Classifier"
            value={model}
            onValueChange={(v) => setModel(v as ModelId)}
            options={[
              { value: 'logistic', label: 'Logistic Regression (Linear)' },
              { value: 'knn', label: 'k-Nearest Neighbors' },
              { value: 'rbf-svm', label: 'RBF Kernel SVM' },
              { value: 'tree', label: 'Decision Tree (Axis-aligned)' },
              { value: 'mlp', label: '2-Layer Neural Net (MLP)' },
            ]}
          />

          <Slider
            label="Dataset Noise (σ)"
            value={noise}
            min={0.04}
            max={0.35}
            step={0.02}
            formatValue={(v) => v.toFixed(2)}
            onValueChange={setNoise}
          />

          {model === 'knn' && (
            <Slider label="Neighbors (k)" value={kNeighbors} min={1} max={15} step={2} onValueChange={setKNeighbors} />
          )}
          {model === 'rbf-svm' && (
            <Slider label="RBF Gamma (γ)" value={gamma} min={0.5} max={10} step={0.5} formatValue={(v) => v.toFixed(1)} onValueChange={setGamma} />
          )}
          {model === 'tree' && (
            <Slider label="Max Tree Depth" value={maxDepth} min={1} max={6} step={1} onValueChange={setMaxDepth} />
          )}

          <div className="rounded-sm border border-hairline bg-surface p-3 text-xs">
            <span className="text-primary-secondary">Train Accuracy: </span>
            <strong className="font-mono text-sm text-primary">{accuracy}%</strong>
          </div>
        </div>
      }
    >
      <div className="overflow-hidden rounded-sm border border-hairline bg-surface">
        <svg
          viewBox="0 0 340 280"
          className="h-auto max-h-[340px] w-full"
          role="img"
          aria-label="2D classification decision boundary and sample points"
        >
          {gridCells.map((c, i) => (
            <rect key={i} x={c.x} y={c.y} width={c.w} height={c.h} fill={c.fill} />
          ))}
          {points.map((p, idx) => (
            <circle
              key={idx}
              cx={toSvgX(p.x)}
              cy={toSvgY(p.y)}
              r="4.2"
              fill={p.label === 1 ? '#0072B2' : '#E69F00'}
              stroke="#ffffff"
              strokeWidth="1.2"
            />
          ))}
          <text x="170" y="272" textAnchor="middle" className="fill-slate-800 dark:fill-slate-200 text-[10px]">
            Feature x₁
          </text>
          <text
            x="12"
            y="140"
            textAnchor="middle"
            transform="rotate(-90 12 140)"
            className="fill-slate-800 dark:fill-slate-200 text-[10px]"
          >
            Feature x₂
          </text>
        </svg>
      </div>
    </VizShell>
  );
}

