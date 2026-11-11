'use client';

import * as React from 'react';
import { VizShell } from './viz-shell';
import { Slider } from '@/components/ui/slider';
import { Button } from '@/components/ui/button';
import { DataTable } from '@/components/ui/table';
import { cn } from '@/lib/utils';

type Stage = 0 | 1 | 2 | 3 | 4;

export function BackpropGraphViz() {
  const [x, setX] = React.useState(1.5);
  const [w, setW] = React.useState(0.8);
  const [b, setB] = React.useState(-0.2);
  const [yTarget, setYTarget] = React.useState(1.0);
  const [stage, setStage] = React.useState<Stage>(4);

  const handleReset = () => {
    setX(1.5);
    setW(0.8);
    setB(-0.2);
    setYTarget(1.0);
    setStage(4);
  };

  // Forward pass: u = w*x, z = u + b, a = sigmoid(z), L = 0.5*(a - y)^2
  const u = w * x;
  const z = u + b;
  const a = 1 / (1 + Math.exp(-z));
  const err = a - yTarget;
  const loss = 0.5 * err * err;

  // Backward pass (chain rule)
  const dL_da = err;
  const da_dz = a * (1 - a);
  const dL_dz = dL_da * da_dz;
  const dL_du = dL_dz;
  const dL_db = dL_dz;
  const dL_dw = dL_du * x;
  const dL_dx = dL_du * w;

  const nodes = [
    { id: 'x', label: 'x (input)', cx: 55, cy: 70, val: x, grad: dL_dx, activeStage: 0 },
    { id: 'w', label: 'w (weight)', cx: 55, cy: 170, val: w, grad: dL_dw, activeStage: 0 },
    { id: 'mul', label: 'u = w·x', cx: 185, cy: 120, val: u, grad: dL_du, activeStage: 1 },
    { id: 'b', label: 'b (bias)', cx: 185, cy: 215, val: b, grad: dL_db, activeStage: 1 },
    { id: 'add', label: 'z = u + b', cx: 315, cy: 145, val: z, grad: dL_dz, activeStage: 2 },
    { id: 'sig', label: 'a = σ(z)', cx: 445, cy: 145, val: a, grad: dL_da, activeStage: 3 },
    { id: 'loss', label: 'L = ½(a-y)²', cx: 575, cy: 145, val: loss, grad: 1.0, activeStage: 4 },
  ];

  const edges: Array<[string, string]> = [
    ['x', 'mul'],
    ['w', 'mul'],
    ['mul', 'add'],
    ['b', 'add'],
    ['add', 'sig'],
    ['sig', 'loss'],
  ];

  const nodeMap = new Map(nodes.map((n) => [n.id, n]));

  return (
    <VizShell
      title="Backpropagation Computational Graph (Forward & Reverse Mode)"
      whatToNotice="Step through the graph or adjust weight w: forward values flow left-to-right (blue), while gradients ∂L/∂v flow right-to-left (amber) via the chain rule."
      onReset={handleReset}
      onStep={() => setStage((s) => ((s + 1) % 5) as Stage)}
      legend={[
        { label: 'Forward Value (v)', color: '#0072B2', shape: 'square' },
        { label: 'Backward Gradient (∂L/∂v)', color: '#D55E00', shape: 'square' },
      ]}
      summaryText={`Current loss L=${loss.toFixed(4)}, output a=${a.toFixed(4)}, weight gradient ∂L/∂w=${dL_dw.toFixed(4)}.`}
      summaryTable={
        <DataTable
          caption="Computational graph node values and gradients"
          headers={['Node', 'Forward Value', 'Gradient ∂L/∂node']}
          rows={nodes.map((n) => [n.label, n.val.toFixed(4), n.grad.toFixed(4)])}
        />
      }
      controls={
        <div className="space-y-4">
          <Slider label="Input x" value={x} min={-3} max={3} step={0.1} formatValue={(v) => v.toFixed(1)} onValueChange={setX} />
          <Slider label="Weight w" value={w} min={-3} max={3} step={0.1} formatValue={(v) => v.toFixed(1)} onValueChange={setW} />
          <Slider label="Bias b" value={b} min={-3} max={3} step={0.1} formatValue={(v) => v.toFixed(1)} onValueChange={setB} />
          <Slider label="Target y" value={yTarget} min={0} max={1} step={0.1} formatValue={(v) => v.toFixed(1)} onValueChange={setYTarget} />
          <div className="flex flex-wrap gap-1.5 pt-1">
            {([0, 1, 2, 3, 4] as Stage[]).map((s) => (
              <Button
                key={s}
                size="sm"
                variant={stage === s ? 'primary' : 'outline'}
                onClick={() => setStage(s)}
              >
                Stage {s + 1}
              </Button>
            ))}
          </div>
        </div>
      }
    >
      <div className="overflow-x-auto rounded-sm border border-hairline bg-canvas p-3">
        <svg
          viewBox="0 0 640 260"
          className="h-auto min-w-[560px] w-full"
          role="img"
          aria-label="Computational graph showing forward values and backward gradients"
        >
          {edges.map(([fromId, toId]) => {
            const from = nodeMap.get(fromId);
            const to = nodeMap.get(toId);
            if (!from || !to) return null;
            return (
              <line
                key={`${fromId}-${toId}`}
                x1={from.cx + 38}
                y1={from.cy}
                x2={to.cx - 38}
                y2={to.cy}
                stroke="var(--border-strong)"
                strokeWidth="2"
              />
            );
          })}

          {nodes.map((node) => {
            const showForward = stage >= node.activeStage;
            const showGrad = stage === 4 || 4 - stage <= node.activeStage;
            return (
              <g key={node.id} transform={`translate(${node.cx}, ${node.cy})`}>
                <rect
                  x="-42"
                  y="-28"
                  width="84"
                  height="56"
                  rx="8"
                  className={cn(
                    'fill-surface stroke-2',
                    stage === node.activeStage ? 'stroke-accent' : 'stroke-strong'
                  )}
                />
                <text
                  x="0"
                  y="-11"
                  textAnchor="middle"
                  className="fill-primary text-[10px] font-semibold"
                >
                  {node.label}
                </text>
                <text
                  x="0"
                  y="4"
                  textAnchor="middle"
                  className="fill-[#0072B2] dark:fill-[#38BDF8] font-mono text-[10px]"
                >
                  {showForward ? `v=${node.val.toFixed(2)}` : 'v=—'}
                </text>
                <text
                  x="0"
                  y="19"
                  textAnchor="middle"
                  className="fill-[#D55E00] dark:fill-[#FB923C] font-mono text-[10px]"
                >
                  {showGrad ? `∇=${node.grad.toFixed(3)}` : '∇=—'}
                </text>
              </g>
            );
          })}
        </svg>
      </div>
    </VizShell>
  );
}

