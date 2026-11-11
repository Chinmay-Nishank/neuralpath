'use client';

import * as React from 'react';
import dynamic from 'next/dynamic';
import { VizShell } from './viz-shell';
import { Slider } from '@/components/ui/slider';
import { Select } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { DataTable } from '@/components/ui/table';
import { usePrefersReducedMotion } from './use-reduced-motion';
import {
  evalLoss,
  createInitialRuns,
  stepOptimizer,
  type LandscapeId,
  type OptimizerRunState,
} from './gradient-descent-math';

const LossSurfaceCanvas = dynamic(
  () => import('./gradient-descent-3d').then((m) => m.LossSurfaceCanvas),
  {
    ssr: false,
    loading: () => (
      <div className="flex h-[320px] w-full items-center justify-center rounded-sm border border-hairline bg-slate-950 font-mono text-xs text-slate-300">
        Loading 3D WebGL surface...
      </div>
    ),
  }
);

export interface GradientDescentVizProps {
  preset?: LandscapeId;
}

export function GradientDescentViz({ preset = 'bowl' }: GradientDescentVizProps) {
  const reducedMotion = usePrefersReducedMotion();
  const [landscape, setLandscape] = React.useState<LandscapeId>(preset);
  const [viewMode, setViewMode] = React.useState<'2d' | '3d'>('2d');
  const [lr, setLr] = React.useState(0.14);
  const [momentum, setMomentum] = React.useState(0.85);
  const [playing, setPlaying] = React.useState(false);
  const [speed, setSpeed] = React.useState(1);
  const [runs, setRuns] = React.useState<OptimizerRunState[]>(() => createInitialRuns(preset));

  const handleReset = React.useCallback(() => {
    setPlaying(false);
    setRuns(createInitialRuns(landscape));
  }, [landscape]);

  React.useEffect(() => {
    setPlaying(false);
    setRuns(createInitialRuns(landscape));
  }, [landscape]);

  const stepAll = React.useCallback(() => {
    setRuns((prev) => prev.map((r) => stepOptimizer(r, landscape, lr, momentum)));
  }, [landscape, lr, momentum]);

  React.useEffect(() => {
    if (!playing || reducedMotion) return;
    const ms = Math.max(40, Math.round(140 / speed));
    const id = window.setInterval(stepAll, ms);
    return () => window.clearInterval(id);
  }, [playing, reducedMotion, speed, stepAll]);

  const bgCanvasRef = React.useRef<HTMLCanvasElement | null>(null);

  React.useEffect(() => {
    const canvas = bgCanvasRef.current;
    if (!canvas || viewMode !== '2d') return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const w = canvas.width;
    const h = canvas.height;
    const img = ctx.createImageData(w, h);
    const min = -2.8;
    const span = 5.6;
    for (let j = 0; j < h; j++) {
      const cy = min + ((j + 0.5) / h) * span;
      for (let i = 0; i < w; i++) {
        const cx = min + ((i + 0.5) / w) * span;
        const val = Math.min(1, evalLoss(landscape, cx, cy) / 5.5);
        const idx = (j * w + i) * 4;
        img.data[idx] = Math.round(239 - val * 185);
        img.data[idx + 1] = Math.round(246 - val * 170);
        img.data[idx + 2] = Math.round(255 - val * 120);
        img.data[idx + 3] = 255;
      }
    }
    ctx.putImageData(img, 0, 0);
  }, [landscape, viewMode]);

  const toSvgX = (x: number) => ((x + 2.8) / 5.6) * 360;
  const toSvgY = (y: number) => ((y + 2.8) / 5.6) * 280;

  return (
    <VizShell
      title="Gradient Descent & Optimizer Trajectories"
      whatToNotice="Notice how plain SGD oscillates across steep ravines in the anisotropic bowl, while Momentum dampens oscillation and Adam adapts step sizes per axis."
      onReset={handleReset}
      playing={playing}
      onTogglePlay={() => setPlaying((p) => !p)}
      onStep={stepAll}
      speed={speed}
      onSpeedChange={setSpeed}
      shareParams={{ landscape, lr, momentum, viewMode }}
      legend={runs.map((r) => ({ label: r.label, color: r.color, shape: 'line' }))}
      summaryText={`Step ${runs[0]?.step ?? 0} on the ${landscape} loss surface with learning rate η=${lr}.`}
      summaryTable={
        <DataTable
          caption="Optimizer current position and loss"
          headers={['Optimizer', 'Step', 'θ₁ (x)', 'θ₂ (y)', 'Loss L(θ)']}
          rows={runs.map((r) => {
            const last = r.trail[r.trail.length - 1];
            return [
              r.label,
              r.step,
              (last?.x ?? 0).toFixed(3),
              (last?.y ?? 0).toFixed(3),
              (last?.loss ?? 0).toFixed(4),
            ];
          })}
        />
      }
      controls={
        <div className="space-y-4">
          <div role="group" aria-label="Surface visualization mode" className="grid grid-cols-2 gap-1 rounded-sm border border-hairline bg-subtle p-1">
            <Button
              size="sm"
              variant={viewMode === '2d' ? 'outline' : 'ghost'}
              aria-pressed={viewMode === '2d'}
              onClick={() => setViewMode('2d')}
            >
              2D Contour
            </Button>
            <Button
              size="sm"
              variant={viewMode === '3d' ? 'outline' : 'ghost'}
              aria-pressed={viewMode === '3d'}
              onClick={() => setViewMode('3d')}
            >
              3D Surface
            </Button>
          </div>

          <Select
            label="Loss Landscape"
            value={landscape}
            onValueChange={(v) => setLandscape(v as LandscapeId)}
            options={[
              { value: 'bowl', label: 'Anisotropic Bowl (Ravine)' },
              { value: 'saddle', label: 'Saddle Point' },
              { value: 'nonconvex', label: 'Non-Convex Twin Basins' },
              { value: 'rosenbrock', label: 'Rosenbrock Curved Valley' },
            ]}
          />

          <Slider
            label="Learning Rate (η)"
            value={lr}
            min={0.02}
            max={0.45}
            step={0.01}
            formatValue={(v) => v.toFixed(2)}
            onValueChange={setLr}
          />

          <Slider
            label="Momentum (β₁)"
            value={momentum}
            min={0.1}
            max={0.95}
            step={0.05}
            formatValue={(v) => v.toFixed(2)}
            onValueChange={setMomentum}
          />

          <div className="space-y-1.5 border-t border-hairline pt-3 text-xs">
            <div className="font-semibold text-primary">Live Loss Readout (Step {runs[0]?.step ?? 0})</div>
            {runs.map((r) => {
              const last = r.trail[r.trail.length - 1];
              return (
                <div key={r.id} className="flex items-center justify-between font-mono tabular-nums">
                  <span className="flex items-center gap-1.5">
                    <span className="h-2 w-2 rounded-full" style={{ backgroundColor: r.color }} />
                    {r.label}
                  </span>
                  <span>{(last?.loss ?? 0).toFixed(4)}</span>
                </div>
              );
            })}
          </div>
        </div>
      }
    >
      {viewMode === '2d' ? (
        <div className="relative overflow-hidden rounded-sm border border-hairline bg-[#dbeafe]">
          <canvas
            ref={bgCanvasRef}
            width={72}
            height={56}
            aria-hidden="true"
            className="absolute inset-0 h-full w-full"
          />
          <svg
            viewBox="0 0 360 280"
            className="relative h-auto w-full max-h-[340px]"
            role="img"
            aria-label="2D contour plot of loss surface showing optimizer trajectories"
          >
            {/* Axis labels */}
            <text x="180" y="273" textAnchor="middle" className="fill-slate-800 text-[10px] font-medium">
              Parameter θ₁
            </text>
            <text
              x="12"
              y="140"
              textAnchor="middle"
              transform="rotate(-90 12 140)"
              className="fill-slate-800 text-[10px] font-medium"
            >
              Parameter θ₂
            </text>

            {/* Optimizer trajectories */}
            {runs.map((r) => {
              const pts = r.trail.map((p) => `${toSvgX(p.x).toFixed(1)},${toSvgY(p.y).toFixed(1)}`).join(' ');
              const head = r.trail[r.trail.length - 1];
              return (
                <g key={r.id}>
                  <polyline
                    fill="none"
                    stroke={r.color}
                    strokeWidth="2.2"
                    strokeLinejoin="round"
                    points={pts}
                  />
                  {head && (
                    <circle
                      cx={toSvgX(head.x)}
                      cy={toSvgY(head.y)}
                      r="5"
                      fill={r.color}
                      stroke="#ffffff"
                      strokeWidth="1.5"
                    />
                  )}
                </g>
              );
            })}
          </svg>
        </div>
      ) : (
        <LossSurfaceCanvas landscape={landscape} runs={runs} />
      )}
    </VizShell>
  );
}

