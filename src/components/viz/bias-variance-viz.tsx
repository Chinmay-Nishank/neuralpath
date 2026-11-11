'use client';

import * as React from 'react';
import { VizShell } from './viz-shell';
import { Slider } from '@/components/ui/slider';
import { DataTable } from '@/components/ui/table';

function trueFn(x: number): number {
  return Math.sin(1.4 * Math.PI * x);
}

function solveLinearSystem(A: number[][], b: number[]): number[] {
  const n = A.length;
  const M = A.map((row, i) => [...row, b[i] ?? 0]);
  for (let i = 0; i < n; i++) {
    let maxRow = i;
    for (let k = i + 1; k < n; k++) {
      if (Math.abs(M[k]?.[i] ?? 0) > Math.abs(M[maxRow]?.[i] ?? 0)) maxRow = k;
    }
    const tmp = M[i]!;
    M[i] = M[maxRow]!;
    M[maxRow] = tmp;

    const piv = M[i]![i] || 1e-8;
    for (let j = i; j <= n; j++) M[i]![j] = (M[i]![j] ?? 0) / piv;
    for (let k = 0; k < n; k++) {
      if (k === i) continue;
      const factor = M[k]![i] ?? 0;
      for (let j = i; j <= n; j++) {
        M[k]![j] = (M[k]![j] ?? 0) - factor * (M[i]![j] ?? 0);
      }
    }
  }
  return M.map((row) => row[n] ?? 0);
}

function fitPolyRidge(
  pts: Array<{ x: number; y: number }>,
  degree: number,
  lambda: number
): number[] {
  const d = degree + 1;
  const XtX = Array.from({ length: d }, () => Array(d).fill(0));
  const Xty = Array(d).fill(0);

  for (const p of pts) {
    const phi: number[] = [];
    let xp = 1;
    for (let j = 0; j < d; j++) {
      phi.push(xp);
      xp *= p.x;
    }
    for (let i = 0; i < d; i++) {
      Xty[i] = (Xty[i] ?? 0) + (phi[i] ?? 0) * p.y;
      for (let j = 0; j < d; j++) {
        XtX[i]![j] = (XtX[i]![j] ?? 0) + (phi[i] ?? 0) * (phi[j] ?? 0);
      }
    }
  }

  for (let i = 1; i < d; i++) {
    XtX[i]![i] = (XtX[i]![i] ?? 0) + lambda;
  }

  return solveLinearSystem(XtX, Xty);
}

function evalPoly(w: number[], x: number): number {
  let y = 0;
  let xp = 1;
  for (let i = 0; i < w.length; i++) {
    y += (w[i] ?? 0) * xp;
    xp *= x;
  }
  return Math.max(-2.6, Math.min(2.6, y));
}

export function BiasVarianceViz() {
  const [degree, setDegree] = React.useState(3);
  const [sampleSize, setSampleSize] = React.useState(14);
  const [noise, setNoise] = React.useState(0.25);
  const [lambda, setLambda] = React.useState(0.0);

  const { samples, ensembleFits, meanFit, bias2, variance, totalErr } = React.useMemo(() => {
    const numTrials = 5;
    const allTrials: Array<Array<{ x: number; y: number }>> = [];
    const weightsPerTrial: number[][] = [];

    for (let t = 0; t < numTrials; t++) {
      const pts: Array<{ x: number; y: number }> = [];
      for (let i = 0; i < sampleSize; i++) {
        const x = -0.92 + (i / Math.max(1, sampleSize - 1)) * 1.84;
        const pseudoNoise = Math.sin((t + 1) * 19.3 + i * 7.7) * noise;
        pts.push({ x, y: trueFn(x) + pseudoNoise });
      }
      allTrials.push(pts);
      weightsPerTrial.push(fitPolyRidge(pts, degree, lambda));
    }

    const xs = Array.from({ length: 45 }, (_, i) => -1 + (i / 44) * 2);
    const curves = weightsPerTrial.map((w) => xs.map((x) => ({ x, y: evalPoly(w, x) })));
    const meanCurve = xs.map((x, idx) => {
      const avg = curves.reduce((acc, c) => acc + (c[idx]?.y ?? 0), 0) / curves.length;
      return { x, y: avg };
    });

    let b2 = 0;
    let varSum = 0;
    xs.forEach((x, idx) => {
      const truth = trueFn(x);
      const meanY = meanCurve[idx]?.y ?? 0;
      b2 += (meanY - truth) ** 2;
      const v =
        curves.reduce((acc, c) => acc + ((c[idx]?.y ?? 0) - meanY) ** 2, 0) / curves.length;
      varSum += v;
    });
    const meanBias2 = b2 / xs.length;
    const meanVar = varSum / xs.length;
    const irreducible = noise * noise * 0.5;

    return {
      samples: allTrials[0] ?? [],
      ensembleFits: curves,
      meanFit: meanCurve,
      bias2: meanBias2,
      variance: meanVar,
      totalErr: meanBias2 + meanVar + irreducible,
    };
  }, [degree, sampleSize, noise, lambda]);

  const toX = (x: number) => 24 + ((x + 1) / 2) * 312;
  const toY = (y: number) => 125 - y * 52;

  const truePath = Array.from({ length: 45 }, (_, i) => {
    const x = -1 + (i / 44) * 2;
    return `${toX(x).toFixed(1)},${toY(trueFn(x)).toFixed(1)}`;
  }).join(' ');

  const meanPath = meanFit.map((p) => `${toX(p.x).toFixed(1)},${toY(p.y).toFixed(1)}`).join(' ');

  const handleReset = () => {
    setDegree(3);
    setSampleSize(14);
    setNoise(0.25);
    setLambda(0.0);
  };

  return (
    <VizShell
      title="Bias-Variance Tradeoff & Regularization Explorer"
      whatToNotice="Increase polynomial degree toward 12+ with small sample size N to see gray ensemble curves wiggle wildly (high variance). Increase L2 penalty λ to damp variance smoothly."
      onReset={handleReset}
      shareParams={{ degree, n: sampleSize, noise, lambda }}
      legend={[
        { label: 'True Signal sin(1.4πx)', color: '#009E73', shape: 'line' },
        { label: 'Mean Model Fit', color: '#0072B2', shape: 'line' },
        { label: 'Resampled Fits (Variance)', color: '#94A3B8', shape: 'line' },
        { label: 'Sample Points', color: '#E69F00', shape: 'circle' },
      ]}
      summaryText={`Degree ${degree}, N=${sampleSize}, λ=${lambda.toFixed(2)}. Bias²=${bias2.toFixed(3)}, Variance=${variance.toFixed(3)}, Total Error=${totalErr.toFixed(3)}.`}
      summaryTable={
        <DataTable
          caption="Bias-Variance error decomposition"
          headers={['Component', 'Value']}
          rows={[
            ['Polynomial Degree', degree],
            ['L2 Penalty (λ)', lambda.toFixed(2)],
            ['Bias²', bias2.toFixed(4)],
            ['Variance', variance.toFixed(4)],
            ['Total Expected Error', totalErr.toFixed(4)],
          ]}
        />
      }
      controls={
        <div className="space-y-4">
          <Slider label="Polynomial Degree" value={degree} min={1} max={12} step={1} onValueChange={setDegree} />
          <Slider label="Training Samples (N)" value={sampleSize} min={8} max={30} step={2} onValueChange={setSampleSize} />
          <Slider label="Noise Level (σ)" value={noise} min={0.05} max={0.6} step={0.05} formatValue={(v) => v.toFixed(2)} onValueChange={setNoise} />
          <Slider label="Ridge L2 Penalty (λ)" value={lambda} min={0} max={2} step={0.05} formatValue={(v) => v.toFixed(2)} onValueChange={setLambda} />

          <div className="space-y-2 border-t border-hairline pt-3 text-xs">
            <div className="flex justify-between font-mono">
              <span className="text-primary-secondary">Bias² (Underfitting)</span>
              <strong>{bias2.toFixed(3)}</strong>
            </div>
            <div className="flex justify-between font-mono">
              <span className="text-primary-secondary">Variance (Overfitting)</span>
              <strong>{variance.toFixed(3)}</strong>
            </div>
            <div className="flex justify-between border-t border-hairline pt-1.5 font-mono text-primary">
              <span>Total Test Error</span>
              <strong>{totalErr.toFixed(3)}</strong>
            </div>
          </div>
        </div>
      }
    >
      <div className="overflow-hidden rounded-sm border border-hairline bg-canvas p-2">
        <svg viewBox="0 0 360 250" className="h-auto max-h-[320px] w-full" role="img" aria-label="Polynomial regression fits demonstrating bias and variance">
          <line x1="24" y1="125" x2="336" y2="125" stroke="var(--border-hairline)" strokeDasharray="3 3" />
          {ensembleFits.map((curve, idx) => (
            <polyline
              key={idx}
              fill="none"
              stroke="#94A3B8"
              strokeWidth="1.2"
              opacity="0.65"
              points={curve.map((p) => `${toX(p.x).toFixed(1)},${toY(p.y).toFixed(1)}`).join(' ')}
            />
          ))}
          <polyline fill="none" stroke="#009E73" strokeWidth="2.2" strokeDasharray="5 3" points={truePath} />
          <polyline fill="none" stroke="#0072B2" strokeWidth="2.6" points={meanPath} />
          {samples.map((p, idx) => (
            <circle key={idx} cx={toX(p.x)} cy={toY(p.y)} r="3.6" fill="#E69F00" stroke="#ffffff" strokeWidth="1" />
          ))}
          <text x="180" y="242" textAnchor="middle" className="fill-primary-secondary text-[10px]">Input Feature x ∈ [-1, 1]</text>
        </svg>
      </div>
    </VizShell>
  );
}

