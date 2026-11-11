'use client';

import * as React from 'react';
import { VizShell } from './viz-shell';
import { Slider } from '@/components/ui/slider';
import { DataTable } from '@/components/ui/table';
import { usePrefersReducedMotion } from './use-reduced-motion';
import { cn } from '@/lib/utils';

type Action = 0 | 1 | 2 | 3; // 0: Up, 1: Right, 2: Down, 3: Left
const ARROWS = ['↑', '→', '↓', '←'] as const;
const DELTAS: Record<Action, [number, number]> = {
  0: [-1, 0],
  1: [0, 1],
  2: [1, 0],
  3: [0, -1],
};

const GRID_SIZE = 5;
const GOAL: [number, number] = [0, 4];
const PIT: [number, number] = [1, 3];
const WALLS = new Set(['1,1', '2,1', '3,3']);

function createEmptyQ(): number[][][] {
  return Array.from({ length: GRID_SIZE }, () =>
    Array.from({ length: GRID_SIZE }, () => [0, 0, 0, 0])
  );
}

export function RlGridworldViz() {
  const reducedMotion = usePrefersReducedMotion();
  const [alpha, setAlpha] = React.useState(0.3);
  const [gamma, setGamma] = React.useState(0.9);
  const [epsilon, setEpsilon] = React.useState(0.2);
  const [episodes, setEpisodes] = React.useState(0);
  const [lastReturn, setLastReturn] = React.useState(0);
  const [agentPos, setAgentPos] = React.useState<[number, number]>([4, 0]);
  const [qTable, setQTable] = React.useState<number[][][]>(() => createEmptyQ());
  const [playing, setPlaying] = React.useState(false);

  const runEpisode = React.useCallback(() => {
    setQTable((prevQ) => {
      const q = prevQ.map((row) => row.map((cell) => [...cell]));
      let r = 4;
      let c = 0;
      let totalReward = 0;

      for (let t = 0; t < 40; t++) {
        const qVals = q[r]![c]!;
        let action: Action;
        if (Math.random() < epsilon) {
          action = Math.floor(Math.random() * 4) as Action;
        } else {
          const maxQ = Math.max(...qVals);
          const bestActions = ([0, 1, 2, 3] as Action[]).filter((a) => qVals[a] === maxQ);
          action = bestActions[Math.floor(Math.random() * bestActions.length)] ?? 0;
        }

        const [dr, dc] = DELTAS[action];
        let nr = Math.max(0, Math.min(GRID_SIZE - 1, r + dr));
        let nc = Math.max(0, Math.min(GRID_SIZE - 1, c + dc));
        if (WALLS.has(`${nr},${nc}`)) {
          nr = r;
          nc = c;
        }

        const isGoal = nr === GOAL[0] && nc === GOAL[1];
        const isPit = nr === PIT[0] && nc === PIT[1];
        const reward = isGoal ? 10 : isPit ? -10 : -0.2;
        totalReward += reward;

        const nextMax = isGoal || isPit ? 0 : Math.max(...q[nr]![nc]!);
        const curQ = qVals[action] ?? 0;
        qVals[action] = curQ + alpha * (reward + gamma * nextMax - curQ);

        r = nr;
        c = nc;
        if (isGoal || isPit) break;
      }

      setAgentPos([r, c]);
      setLastReturn(Number(totalReward.toFixed(1)));
      setEpisodes((e) => e + 1);
      return q;
    });
  }, [alpha, gamma, epsilon]);

  React.useEffect(() => {
    if (!playing || reducedMotion) return;
    const id = window.setInterval(runEpisode, 120);
    return () => window.clearInterval(id);
  }, [playing, reducedMotion, runEpisode]);

  const handleReset = () => {
    setPlaying(false);
    setQTable(createEmptyQ());
    setEpisodes(0);
    setLastReturn(0);
    setAgentPos([4, 0]);
  };

  return (
    <VizShell
      title="RL Grid-World Q-Learning & Policy Explorer"
      whatToNotice="Step or Play episodes to watch Bellman temporal-difference updates propagate backward from the +10 Goal while avoiding the -10 Hazard."
      onReset={handleReset}
      playing={playing}
      onTogglePlay={() => setPlaying((p) => !p)}
      onStep={runEpisode}
      shareParams={{ alpha, gamma, epsilon }}
      legend={[
        { label: 'Goal (+10)', color: '#009E73', shape: 'square' },
        { label: 'Hazard (-10)', color: '#D55E00', shape: 'square' },
        { label: 'High Q-value', color: '#0072B2', shape: 'square' },
      ]}
      summaryText={`Completed ${episodes} Q-learning episodes. Latest episode return: ${lastReturn}.`}
      summaryTable={
        <DataTable
          caption="Maximum Q-value per grid row"
          headers={['Row', 'Col 0', 'Col 1', 'Col 2', 'Col 3', 'Col 4']}
          rows={qTable.map((row, r) => [
            `Row ${r}`,
            ...row.map((qVals, c) => {
              if (WALLS.has(`${r},${c}`)) return 'WALL';
              if (r === GOAL[0] && c === GOAL[1]) return 'GOAL (+10)';
              if (r === PIT[0] && c === PIT[1]) return 'PIT (-10)';
              return Math.max(...qVals).toFixed(2);
            }),
          ])}
        />
      }
      controls={
        <div className="space-y-4">
          <Slider label="Learning Rate (α)" value={alpha} min={0.05} max={0.8} step={0.05} formatValue={(v) => v.toFixed(2)} onValueChange={setAlpha} />
          <Slider label="Discount Factor (γ)" value={gamma} min={0.5} max={0.99} step={0.01} formatValue={(v) => v.toFixed(2)} onValueChange={setGamma} />
          <Slider label="Exploration (ε)" value={epsilon} min={0.0} max={0.6} step={0.05} formatValue={(v) => v.toFixed(2)} onValueChange={setEpsilon} />

          <div className="grid grid-cols-2 gap-2 text-xs">
            <div className="rounded-sm border border-hairline bg-surface p-2.5">
              <div className="text-primary-muted">Episodes</div>
              <div className="font-mono text-lg font-semibold tabular-nums">{episodes}</div>
            </div>
            <div className="rounded-sm border border-hairline bg-surface p-2.5">
              <div className="text-primary-muted">Last Return</div>
              <div className="font-mono text-lg font-semibold tabular-nums">{lastReturn}</div>
            </div>
          </div>
        </div>
      }
    >
      <div
        className="grid gap-1.5 rounded-sm border border-hairline bg-canvas p-3"
        style={{ gridTemplateColumns: `repeat(${GRID_SIZE}, minmax(0, 1fr))` }}
      >
        {qTable.map((row, r) =>
          row.map((qVals, c) => {
            const isWall = WALLS.has(`${r},${c}`);
            const isGoal = r === GOAL[0] && c === GOAL[1];
            const isPit = r === PIT[0] && c === PIT[1];
            const isStart = r === 4 && c === 0;
            const isAgent = agentPos[0] === r && agentPos[1] === c;
            const maxQ = Math.max(...qVals);
            const bestIdx = qVals.indexOf(maxQ) as Action;

            return (
              <div
                key={`${r}-${c}`}
                className={cn(
                  'relative flex aspect-square flex-col items-center justify-center rounded-sm border text-xs',
                  isWall && 'border-strong bg-slate-700 text-slate-100',
                  isGoal && 'border-success bg-success-soft text-success font-semibold',
                  isPit && 'border-danger bg-danger-soft text-danger font-semibold',
                  !isWall && !isGoal && !isPit && 'border-hairline bg-surface'
                )}
                style={
                  !isWall && !isGoal && !isPit && maxQ > 0
                    ? { backgroundColor: `rgba(0, 114, 178, ${Math.min(0.45, maxQ / 16).toFixed(2)})` }
                    : undefined
                }
              >
                {isWall ? (
                  <span className="font-mono text-[10px]">WALL</span>
                ) : isGoal ? (
                  <span>+10</span>
                ) : isPit ? (
                  <span>-10</span>
                ) : (
                  <>
                    <span className="text-base font-bold text-primary" aria-hidden="true">
                      {maxQ === 0 ? '·' : ARROWS[bestIdx]}
                    </span>
                    <span className="font-mono text-[10px] tabular-nums text-primary-secondary">
                      {maxQ.toFixed(1)}
                    </span>
                    {isStart && (
                      <span className="absolute left-1 top-0.5 font-mono text-[9px] text-primary-muted">
                        S
                      </span>
                    )}
                  </>
                )}
                {isAgent && (
                  <span
                    className="absolute right-1 bottom-1 h-2.5 w-2.5 rounded-full bg-accent ring-2 ring-surface"
                    title="Agent terminal position"
                  />
                )}
              </div>
            );
          })
        )}
      </div>
    </VizShell>
  );
}

