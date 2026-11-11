'use client';

import * as React from 'react';
import * as tf from '@tensorflow/tfjs';
import { VizShell } from './viz-shell';
import { Select } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { Button } from '@/components/ui/button';
import { DataTable } from '@/components/ui/table';
import { usePrefersReducedMotion } from './use-reduced-motion';

type NnDatasetId = 'xor' | 'circle' | 'spiral';
type ActivationId = 'tanh' | 'relu' | 'sigmoid';

interface DataRow {
  x1: number;
  x2: number;
  y: 0 | 1;
}

function makeNnDataset(kind: NnDatasetId): DataRow[] {
  const rows: DataRow[] = [];
  if (kind === 'xor') {
    for (let i = 0; i < 80; i++) {
      const sx = i % 2 === 0 ? 1 : -1;
      const sy = i % 4 < 2 ? 1 : -1;
      const x1 = sx * (0.25 + ((i * 17) % 65) / 100);
      const x2 = sy * (0.25 + ((i * 29) % 65) / 100);
      rows.push({ x1, x2, y: x1 * x2 > 0 ? 1 : 0 });
    }
  } else if (kind === 'circle') {
    for (let i = 0; i < 80; i++) {
      const angle = (i / 40) * Math.PI * 2;
      const r = i < 40 ? 0.35 + (i % 5) * 0.04 : 0.78 + (i % 5) * 0.04;
      rows.push({ x1: r * Math.cos(angle), x2: r * Math.sin(angle), y: i < 40 ? 0 : 1 });
    }
  } else {
    for (let cls = 0; cls < 2; cls++) {
      for (let i = 0; i < 40; i++) {
        const r = (i / 40) * 0.92 + 0.06;
        const t = (i / 40) * 2.5 * Math.PI + cls * Math.PI;
        rows.push({ x1: r * Math.sin(t), x2: r * Math.cos(t), y: cls as 0 | 1 });
      }
    }
  }
  return rows;
}

export function NeuralNetworkPlaygroundViz() {
  const reducedMotion = usePrefersReducedMotion();
  const [dataset, setDataset] = React.useState<NnDatasetId>('xor');
  const [activation, setActivation] = React.useState<ActivationId>('tanh');
  const [hiddenLayers, setHiddenLayers] = React.useState<number[]>([4, 3]);
  const [learningRate, setLearningRate] = React.useState(0.06);
  const [epoch, setEpoch] = React.useState(0);
  const [lossHistory, setLossHistory] = React.useState<number[]>([]);
  const [accuracy, setAccuracy] = React.useState(50);
  const [playing, setPlaying] = React.useState(false);
  const [gridProbs, setGridProbs] = React.useState<number[]>(() => Array(256).fill(0.5));

  const modelRef = React.useRef<tf.LayersModel | null>(null);
  const data = React.useMemo(() => makeNnDataset(dataset), [dataset]);

  const rebuildModel = React.useCallback(() => {
    if (modelRef.current) {
      modelRef.current.dispose();
    }
    const model = tf.sequential();
    hiddenLayers.forEach((units, idx) => {
      model.add(
        tf.layers.dense({
          units,
          activation,
          inputShape: idx === 0 ? [2] : undefined,
        })
      );
    });
    model.add(tf.layers.dense({ units: 1, activation: 'sigmoid' }));
    model.compile({
      optimizer: tf.train.adam(learningRate),
      loss: 'binaryCrossentropy',
      metrics: ['accuracy'],
    });
    modelRef.current = model;
    setEpoch(0);
    setLossHistory([]);
    setAccuracy(50);
    setGridProbs(Array(256).fill(0.5));
  }, [hiddenLayers, activation, learningRate]);

  React.useEffect(() => {
    setPlaying(false);
    rebuildModel();
    return () => {
      modelRef.current?.dispose();
      modelRef.current = null;
    };
  }, [rebuildModel, dataset]);

  const trainOneStep = React.useCallback(async () => {
    const model = modelRef.current;
    if (!model) return;
    const xs = tf.tensor2d(data.map((d) => [d.x1, d.x2]));
    const ys = tf.tensor2d(data.map((d) => [d.y]));

    const history = await model.fit(xs, ys, { epochs: 4, batchSize: 32, verbose: 0 });
    const latestLoss = Number(history.history.loss?.slice(-1)[0] ?? 0);
    const latestAcc = Number(history.history.acc?.slice(-1)[0] ?? history.history.accuracy?.slice(-1)[0] ?? 0.5);

    // Evaluate 16x16 decision surface
    const gridPts: number[][] = [];
    for (let j = 0; j < 16; j++) {
      for (let i = 0; i < 16; i++) {
        const px = -1.1 + ((i + 0.5) / 16) * 2.2;
        const py = 1.1 - ((j + 0.5) / 16) * 2.2;
        gridPts.push([px, py]);
      }
    }
    const gridTensor = tf.tensor2d(gridPts);
    const predTensor = model.predict(gridTensor) as tf.Tensor;
    const predArr = Array.from(await predTensor.data());

    xs.dispose();
    ys.dispose();
    gridTensor.dispose();
    predTensor.dispose();

    setEpoch((e) => e + 4);
    setLossHistory((prev) => [...prev.slice(-39), latestLoss]);
    setAccuracy(Math.round(latestAcc * 100));
    setGridProbs(predArr);
  }, [data]);

  React.useEffect(() => {
    if (!playing || reducedMotion) return;
    let active = true;
    const tick = async () => {
      if (!active) return;
      await trainOneStep();
      if (active) {
        window.setTimeout(tick, 90);
      }
    };
    void tick();
    return () => {
      active = false;
    };
  }, [playing, reducedMotion, trainOneStep]);

  const handleReset = () => {
    setPlaying(false);
    rebuildModel();
  };

  const layerCounts = [2, ...hiddenLayers, 1];
  const latestLoss = lossHistory[lossHistory.length - 1] ?? 0.693;

  return (
    <VizShell
      title="Neural Network Playground (Live TensorFlow.js Training)"
      whatToNotice="Add hidden layers or neurons and press Play to train a real neural network inside your browser. Watch how a 1-neuron linear model fails on XOR while 3+ hidden neurons bend the decision boundary."
      onReset={handleReset}
      playing={playing}
      onTogglePlay={() => setPlaying((p) => !p)}
      onStep={() => void trainOneStep()}
      legend={[
        { label: 'Class 0 (Amber)', color: '#E69F00', shape: 'circle' },
        { label: 'Class 1 (Blue)', color: '#0072B2', shape: 'circle' },
      ]}
      summaryText={`Architecture [${layerCounts.join(' → ')}] with ${activation} activation at epoch ${epoch}. Loss: ${latestLoss.toFixed(3)}, Accuracy: ${accuracy}%.`}
      summaryTable={
        <DataTable
          caption="Neural network training state"
          headers={['Metric', 'Value']}
          rows={[
            ['Architecture', layerCounts.join(' - ')],
            ['Activation', activation],
            ['Epoch', epoch],
            ['Binary Cross-Entropy Loss', latestLoss.toFixed(4)],
            ['Training Accuracy', `${accuracy}%`],
          ]}
        />
      }
      controls={
        <div className="space-y-4">
          <Select
            label="Dataset"
            value={dataset}
            onValueChange={(v) => setDataset(v as NnDatasetId)}
            options={[
              { value: 'xor', label: 'XOR Quadrants' },
              { value: 'circle', label: 'Concentric Circles' },
              { value: 'spiral', label: 'Two Spirals' },
            ]}
          />

          <Select
            label="Hidden Activation"
            value={activation}
            onValueChange={(v) => setActivation(v as ActivationId)}
            options={[
              { value: 'tanh', label: 'Tanh' },
              { value: 'relu', label: 'ReLU' },
              { value: 'sigmoid', label: 'Sigmoid' },
            ]}
          />

          <Slider
            label="Learning Rate"
            value={learningRate}
            min={0.01}
            max={0.2}
            step={0.01}
            formatValue={(v) => v.toFixed(2)}
            onValueChange={setLearningRate}
          />

          <div className="space-y-2 border-t border-hairline pt-3">
            <div className="flex items-center justify-between text-xs">
              <span className="font-medium text-primary">Hidden Layers ({hiddenLayers.length})</span>
              <div className="flex gap-1">
                <Button
                  size="sm"
                  variant="outline"
                  disabled={hiddenLayers.length <= 1}
                  onClick={() => setHiddenLayers((prev) => prev.slice(0, -1))}
                >
                  - Layer
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  disabled={hiddenLayers.length >= 3}
                  onClick={() => setHiddenLayers((prev) => [...prev, 3])}
                >
                  + Layer
                </Button>
              </div>
            </div>
            {hiddenLayers.map((units, idx) => (
              <div key={idx} className="flex items-center justify-between rounded-sm bg-surface px-2.5 py-1.5 text-xs border border-hairline">
                <span>Layer {idx + 1}: {units} neurons</span>
                <div className="flex gap-1">
                  <Button
                    size="sm"
                    variant="ghost"
                    disabled={units <= 1}
                    onClick={() =>
                      setHiddenLayers((prev) =>
                        prev.map((u, i) => (i === idx ? Math.max(1, u - 1) : u))
                      )
                    }
                    aria-label={`Decrease neurons in layer ${idx + 1}`}
                  >
                    -
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    disabled={units >= 6}
                    onClick={() =>
                      setHiddenLayers((prev) =>
                        prev.map((u, i) => (i === idx ? Math.min(6, u + 1) : u))
                      )
                    }
                    aria-label={`Increase neurons in layer ${idx + 1}`}
                  >
                    +
                  </Button>
                </div>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-2 gap-2 text-xs">
            <div className="rounded-sm border border-hairline bg-surface p-2">
              <div className="text-primary-muted">Epoch</div>
              <div className="font-mono text-base font-semibold tabular-nums">{epoch}</div>
            </div>
            <div className="rounded-sm border border-hairline bg-surface p-2">
              <div className="text-primary-muted">Accuracy</div>
              <div className="font-mono text-base font-semibold tabular-nums">{accuracy}%</div>
            </div>
          </div>
        </div>
      }
    >
      <div className="grid gap-4 md:grid-cols-2">
        {/* Network Topology SVG */}
        <div className="rounded-sm border border-hairline bg-canvas p-3">
          <div className="mb-1 text-xs font-medium text-primary-secondary">
            Network Topology ({layerCounts.join(' → ')})
          </div>
          <svg viewBox="0 0 260 220" className="h-auto w-full" role="img" aria-label="Neural network layer diagram">
            {layerCounts.map((count, lIdx) => {
              const x = 30 + (lIdx / (layerCounts.length - 1)) * 200;
              const nextCount = layerCounts[lIdx + 1];
              const nextX = nextCount !== undefined ? 30 + ((lIdx + 1) / (layerCounts.length - 1)) * 200 : 0;

              return (
                <g key={lIdx}>
                  {nextCount !== undefined &&
                    Array.from({ length: count }).map((_, nIdx) => {
                      const y1 = 110 + (nIdx - (count - 1) / 2) * 32;
                      return Array.from({ length: nextCount }).map((__, mIdx) => {
                        const y2 = 110 + (mIdx - (nextCount - 1) / 2) * 32;
                        return (
                          <line
                            key={`${nIdx}-${mIdx}`}
                            x1={x}
                            y1={y1}
                            x2={nextX}
                            y2={y2}
                            stroke="var(--border-strong)"
                            strokeWidth="1.2"
                            opacity="0.7"
                          />
                        );
                      });
                    })}

                  {Array.from({ length: count }).map((_, nIdx) => {
                    const y = 110 + (nIdx - (count - 1) / 2) * 32;
                    return (
                      <circle
                        key={`node-${lIdx}-${nIdx}`}
                        cx={x}
                        cy={y}
                        r="10"
                        fill={
                          lIdx === 0
                            ? '#56B4E9'
                            : lIdx === layerCounts.length - 1
                            ? '#0072B2'
                            : '#E69F00'
                        }
                        stroke="#ffffff"
                        strokeWidth="1.5"
                      />
                    );
                  })}
                </g>
              );
            })}
          </svg>
        </div>

        {/* Decision Heatmap */}
        <div className="rounded-sm border border-hairline bg-canvas p-3">
          <div className="mb-1 flex items-center justify-between text-xs text-primary-secondary">
            <span>Decision Output</span>
            <span className="font-mono">Loss: {latestLoss.toFixed(3)}</span>
          </div>
          <svg viewBox="0 0 220 220" className="h-auto w-full" role="img" aria-label="Neural network classification surface">
            {gridProbs.map((prob, idx) => {
              const i = idx % 16;
              const j = Math.floor(idx / 16);
              const fill =
                prob >= 0.5
                  ? `rgba(0, 114, 178, ${(0.14 + (prob - 0.5) * 0.6).toFixed(2)})`
                  : `rgba(230, 159, 0, ${(0.14 + (0.5 - prob) * 0.6).toFixed(2)})`;
              return (
                <rect
                  key={idx}
                  x={(i / 16) * 220}
                  y={(j / 16) * 220}
                  width={220 / 16 + 0.5}
                  height={220 / 16 + 0.5}
                  fill={fill}
                />
              );
            })}
            {data.map((pt, idx) => (
              <circle
                key={idx}
                cx={((pt.x1 + 1.1) / 2.2) * 220}
                cy={((1.1 - pt.x2) / 2.2) * 220}
                r="3.5"
                fill={pt.y === 1 ? '#0072B2' : '#E69F00'}
                stroke="#ffffff"
                strokeWidth="1"
              />
            ))}
          </svg>
        </div>
      </div>
    </VizShell>
  );
}

