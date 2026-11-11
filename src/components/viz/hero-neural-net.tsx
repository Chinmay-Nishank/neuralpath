'use client';

import * as React from 'react';
import { usePrefersReducedMotion } from './use-reduced-motion';

interface NodePos {
  x: number;
  y: number;
  layer: number;
}

export function HeroNeuralNet() {
  const canvasRef = React.useRef<HTMLCanvasElement | null>(null);
  const reducedMotion = usePrefersReducedMotion();

  React.useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const layers = [3, 5, 5, 2];
    const width = 440;
    const height = 260;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = width * dpr;
    canvas.height = height * dpr;
    ctx.scale(dpr, dpr);

    const nodes: NodePos[] = [];
    layers.forEach((count, lIdx) => {
      const x = 52 + (lIdx / (layers.length - 1)) * (width - 104);
      for (let i = 0; i < count; i++) {
        const y = height / 2 + (i - (count - 1) / 2) * 42;
        nodes.push({ x, y, layer: lIdx });
      }
    });

    const edges: Array<{ from: NodePos; to: NodePos; phase: number }> = [];
    for (let i = 0; i < nodes.length; i++) {
      for (let j = 0; j < nodes.length; j++) {
        const a = nodes[i]!;
        const b = nodes[j]!;
        if (b.layer === a.layer + 1) {
          edges.push({ from: a, to: b, phase: ((i * 7 + j * 13) % 100) / 100 });
        }
      }
    }

    let rafId = 0;
    let isVisible = true;
    let t = 0;

    const draw = () => {
      ctx.clearRect(0, 0, width, height);

      // Draw edges
      for (const edge of edges) {
        ctx.beginPath();
        ctx.moveTo(edge.from.x, edge.from.y);
        ctx.lineTo(edge.to.x, edge.to.y);
        ctx.strokeStyle = 'rgba(100, 116, 139, 0.25)';
        ctx.lineWidth = 1.2;
        ctx.stroke();

        if (!reducedMotion) {
          const p = (t * 0.45 + edge.phase) % 1;
          const px = edge.from.x + (edge.to.x - edge.from.x) * p;
          const py = edge.from.y + (edge.to.y - edge.from.y) * p;
          ctx.beginPath();
          ctx.arc(px, py, 2.3, 0, Math.PI * 2);
          ctx.fillStyle = edge.from.layer % 2 === 0 ? '#38BDF8' : '#E69F00';
          ctx.fill();
        }
      }

      // Draw nodes
      for (let i = 0; i < nodes.length; i++) {
        const n = nodes[i]!;
        const pulse = reducedMotion ? 0 : 0.5 + 0.5 * Math.sin(t * 2.5 + i);
        ctx.beginPath();
        ctx.arc(n.x, n.y, 9 + pulse * 1.5, 0, Math.PI * 2);
        ctx.fillStyle =
          n.layer === 0
            ? '#0072B2'
            : n.layer === layers.length - 1
            ? '#009E73'
            : '#1D4ED8';
        ctx.fill();
        ctx.lineWidth = 2;
        ctx.strokeStyle = '#FFFFFF';
        ctx.stroke();
      }
    };

    let lastFrame = 0;
    const loop = (now: number) => {
      if (isVisible && !reducedMotion) {
        if (now - lastFrame >= 40) {
          lastFrame = now;
          t += 0.04;
          draw();
        }
        rafId = window.requestAnimationFrame(loop);
      }
    };

    draw();
    let delayTimer = 0;
    if (!reducedMotion) {
      delayTimer = window.setTimeout(() => {
        delayTimer = 0;
        if (isVisible) {
          rafId = window.requestAnimationFrame(loop);
        }
      }, 600);
    }

    const observer = new IntersectionObserver(
      (entries) => {
        const first = entries[0];
        isVisible = Boolean(first?.isIntersecting);
        if (isVisible && !reducedMotion && !rafId && !delayTimer) {
          rafId = window.requestAnimationFrame(loop);
        } else if (!isVisible && rafId) {
          window.cancelAnimationFrame(rafId);
          rafId = 0;
        }
      },
      { threshold: 0.1 }
    );
    observer.observe(canvas);

    return () => {
      observer.disconnect();
      if (delayTimer) window.clearTimeout(delayTimer);
      if (rafId) window.cancelAnimationFrame(rafId);
    };
  }, [reducedMotion]);

  return (
    <div className="relative overflow-hidden rounded-lg border border-hairline bg-surface p-4 shadow-sm">
      <div className="mb-2 flex items-center justify-between text-xs text-primary-secondary">
        <span className="font-medium text-primary">Forward Pass Signal Flow</span>
        <span className="text-[11px] font-medium tabular-nums">3 → 5 → 5 → 2</span>
      </div>
      <canvas
        ref={canvasRef}
        width={440}
        height={260}
        className="h-[220px] w-full max-w-[440px]"
        role="img"
        aria-label="Animated multi-layer neural network showing forward activation signals from 3 inputs through two hidden layers to 2 outputs"
      />
    </div>
  );
}

