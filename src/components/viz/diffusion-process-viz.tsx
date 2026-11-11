'use client';

import * as React from 'react';
import { VizShell } from './viz-shell';
import { Slider } from '@/components/ui/slider';
import { Button } from '@/components/ui/button';
import { DataTable } from '@/components/ui/table';
import { usePrefersReducedMotion } from './use-reduced-motion';

type MethodId = 'ddpm' | 'flow';

interface Particle {
  x0: number;
  y0: number;
  nx: number;
  ny: number;
  color: string;
}

function generateManifoldParticles(): Particle[] {
  const pts: Particle[] = [];
  for (let i = 0; i < 64; i++) {
    const t = (i / 63) * Math.PI * 2;
    const arm = i % 2 === 0 ? 1 : -1;
    // Spiral / double-crescent clean data manifold
    const radius = 0.25 + (i / 63) * 0.65;
    const x0 = arm * radius * Math.cos(t * 1.15);
    const y0 = arm * radius * Math.sin(t * 1.15);
    // Deterministic Gaussian-like noise target
    const u1 = ((i * 37 + 11) % 97) / 97 + 0.01;
    const u2 = ((i * 53 + 29) % 89) / 89;
    const mag = Math.sqrt(-2 * Math.log(u1)) * 0.45;
    const nx = mag * Math.cos(2 * Math.PI * u2);
    const ny = mag * Math.sin(2 * Math.PI * u2);
    pts.push({
      x0,
      y0,
      nx,
      ny,
      color: arm === 1 ? '#0072B2' : '#E69F00',
    });
  }
  return pts;
}

export function DiffusionProcessViz() {
  const reducedMotion = usePrefersReducedMotion();
  const [step, setStep] = React.useState(0); // 0 = clean data, 50 = pure Gaussian noise
  const [method, setMethod] = React.useState<MethodId>('flow');
  const [playing, setPlaying] = React.useState(false);
  const [direction, setDirection] = React.useState<1 | -1>(1);
  const [speed, setSpeed] = React.useState(1);

  const particles = React.useMemo(() => generateManifoldParticles(), []);
  const T = 50;

  React.useEffect(() => {
    if (!playing || reducedMotion) return;
    const ms = Math.max(35, Math.round(90 / speed));
    const id = window.setInterval(() => {
      setStep((prev) => {
        const next = prev + direction;
        if (next >= T) {
          setDirection(-1);
          return T;
        }
        if (next <= 0) {
          setDirection(1);
          return 0;
        }
        return next;
      });
    }, ms);
    return () => window.clearInterval(id);
  }, [playing, reducedMotion, direction, speed]);

  const tFrac = step / T; // 0 = clean, 1 = pure noise
  // Cosine schedule alpha_bar for DDPM vs straight-line linear interpolation for Rectified Flow
  const alphaBar = Math.cos(((tFrac + 0.008) / 1.008) * (Math.PI / 2)) ** 2;
  const signalCoeff = method === 'ddpm' ? Math.sqrt(alphaBar) : 1 - tFrac;
  const noiseCoeff = method === 'ddpm' ? Math.sqrt(Math.max(0, 1 - alphaBar)) : tFrac;

  const toSvgX = (x: number) => 180 + x * 110;
  const toSvgY = (y: number) => 130 - y * 95;

  const handleReset = () => {
    setPlaying(false);
    setStep(0);
    setDirection(1);
  };

  return (
    <VizShell
      title="Diffusion (DDPM) vs. Rectified Flow Matching"
      whatToNotice="Scrub timestep t between 0 (clean spiral manifold) and 50 (Gaussian noise). Notice how Flow Matching follows straight linear ODE paths from noise to data, enabling fast 4–10 step sampling."
      onReset={handleReset}
      playing={playing}
      onTogglePlay={() => setPlaying((p) => !p)}
      onStep={() => setStep((s) => (s + 5) % (T + 5))}
      speed={speed}
      onSpeedChange={setSpeed}
      shareParams={{ step, method }}
      legend={[
        { label: 'Spiral Arm A', color: '#0072B2' },
        { label: 'Spiral Arm B', color: '#E69F00' },
      ]}
      summaryText={`Timestep t=${step}/${T} using ${method === 'flow' ? 'Rectified Flow Matching' : 'DDPM Cosine Schedule'}. Signal weight=${signalCoeff.toFixed(2)}, Noise weight=${noiseCoeff.toFixed(2)}.`}
      summaryTable={
        <DataTable
          caption="Diffusion / Flow Matching noise schedule coefficients"
          headers={['Parameter', 'Value']}
          rows={[
            ['Method', method === 'flow' ? 'Rectified Flow Matching' : 'DDPM Cosine'],
            ['Timestep t', `${step} / ${T}`],
            ['Signal Coefficient', signalCoeff.toFixed(3)],
            ['Noise Coefficient', noiseCoeff.toFixed(3)],
          ]}
        />
      }
      controls={
        <div className="space-y-4">
          <div role="group" aria-label="Generative noise schedule" className="grid grid-cols-2 gap-1 rounded-sm border border-hairline bg-subtle p-1">
            <Button
              size="sm"
              variant={method === 'flow' ? 'outline' : 'ghost'}
              aria-pressed={method === 'flow'}
              onClick={() => setMethod('flow')}
            >
              Flow Matching
            </Button>
            <Button
              size="sm"
              variant={method === 'ddpm' ? 'outline' : 'ghost'}
              aria-pressed={method === 'ddpm'}
              onClick={() => setMethod('ddpm')}
            >
              DDPM Cosine
            </Button>
          </div>

          <Slider
            label="Timestep t (0=Data, 50=Noise)"
            value={step}
            min={0}
            max={T}
            step={1}
            onValueChange={(v) => {
              setPlaying(false);
              setStep(v);
            }}
          />

          <div className="space-y-2 rounded-sm border border-hairline bg-surface p-3 font-mono text-xs">
            <div className="flex justify-between">
              <span className="text-primary-secondary">Signal coeff:</span>
              <strong>{signalCoeff.toFixed(3)}</strong>
            </div>
            <div className="flex justify-between">
              <span className="text-primary-secondary">Noise coeff:</span>
              <strong>{noiseCoeff.toFixed(3)}</strong>
            </div>
          </div>
        </div>
      }
    >
      <div className="overflow-hidden rounded-sm border border-hairline bg-canvas p-2">
        <svg viewBox="0 0 360 260" className="h-auto max-h-[320px] w-full" role="img" aria-label="2D particle manifold transitioning between clean distribution and Gaussian noise">
          <line x1="180" y1="15" x2="180" y2="245" stroke="var(--border-hairline)" strokeDasharray="3 3" />
          <line x1="20" y1="130" x2="340" y2="130" stroke="var(--border-hairline)" strokeDasharray="3 3" />
          {particles.map((p, idx) => {
            const px = signalCoeff * p.x0 + noiseCoeff * p.nx;
            const py = signalCoeff * p.y0 + noiseCoeff * p.ny;
            const sx0 = toSvgX(p.x0);
            const sy0 = toSvgY(p.y0);
            const sx1 = toSvgX(px);
            const sy1 = toSvgY(py);
            return (
              <g key={idx}>
                <line x1={sx0} y1={sy0} x2={sx1} y2={sy1} stroke="var(--border-strong)" strokeWidth="0.7" opacity="0.45" />
                <circle cx={sx1} cy={sy1} r="3.6" fill={p.color} stroke="#ffffff" strokeWidth="1" />
              </g>
            );
          })}
          <text x="180" y="252" textAnchor="middle" className="fill-primary-secondary font-mono text-[10px]">
            x_t = {signalCoeff.toFixed(2)}·x₀ + {noiseCoeff.toFixed(2)}·ε
          </text>
        </svg>
      </div>
    </VizShell>
  );
}

