'use client';

import * as React from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Html } from '@react-three/drei';
import { VizShell } from './viz-shell';
import { Select } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { DataTable } from '@/components/ui/table';
import { cn } from '@/lib/utils';

type ProjectionId = 'pca' | 'tsne' | 'umap';

interface EmbedWord {
  word: string;
  cluster: 'Royalty' | 'Capitals' | 'ML Core' | 'Transformers';
  color: string;
  vec: [number, number, number, number]; // 4D semantic vector
  pca: [number, number, number];
  tsne: [number, number, number];
  umap: [number, number, number];
}

const WORDS: EmbedWord[] = [
  { word: 'king', cluster: 'Royalty', color: '#E69F00', vec: [1.0, 0.9, 0.1, 0.0], pca: [-1.4, 0.9, 0.4], tsne: [-1.7, 1.1, 0.5], umap: [-1.5, 1.0, 0.3] },
  { word: 'queen', cluster: 'Royalty', color: '#E69F00', vec: [1.0, -0.8, 0.1, 0.0], pca: [-1.2, 1.3, -0.5], tsne: [-1.4, 1.4, -0.4], umap: [-1.3, 1.2, -0.4] },
  { word: 'man', cluster: 'Royalty', color: '#E69F00', vec: [0.2, 0.9, 0.1, 0.0], pca: [-0.9, 0.4, 0.6], tsne: [-1.1, 0.6, 0.7], umap: [-1.0, 0.5, 0.5] },
  { word: 'woman', cluster: 'Royalty', color: '#E69F00', vec: [0.2, -0.8, 0.1, 0.0], pca: [-0.7, 0.8, -0.3], tsne: [-0.8, 0.9, -0.2], umap: [-0.8, 0.7, -0.2] },
  { word: 'paris', cluster: 'Capitals', color: '#009E73', vec: [0.0, 0.1, 1.0, 0.2], pca: [1.2, 1.1, 0.7], tsne: [1.5, 1.3, 0.8], umap: [1.4, 1.2, 0.6] },
  { word: 'france', cluster: 'Capitals', color: '#009E73', vec: [0.0, 0.1, 0.9, 0.1], pca: [1.0, 0.8, 0.9], tsne: [1.3, 1.0, 1.0], umap: [1.2, 0.9, 0.8] },
  { word: 'tokyo', cluster: 'Capitals', color: '#009E73', vec: [0.0, -0.1, 1.0, 0.8], pca: [1.5, 0.6, -0.6], tsne: [1.7, 0.8, -0.7], umap: [1.6, 0.7, -0.5] },
  { word: 'japan', cluster: 'Capitals', color: '#009E73', vec: [0.0, -0.1, 0.9, 0.7], pca: [1.3, 0.3, -0.4], tsne: [1.5, 0.5, -0.5], umap: [1.4, 0.4, -0.3] },
  { word: 'gradient', cluster: 'ML Core', color: '#0072B2', vec: [-0.8, 0.2, -0.4, 0.6], pca: [-1.2, -1.0, 0.3], tsne: [-1.5, -1.2, 0.4], umap: [-1.4, -1.1, 0.2] },
  { word: 'backprop', cluster: 'ML Core', color: '#0072B2', vec: [-0.9, 0.2, -0.3, 0.7], pca: [-1.4, -1.2, 0.6], tsne: [-1.7, -1.4, 0.7], umap: [-1.6, -1.3, 0.5] },
  { word: 'loss', cluster: 'ML Core', color: '#0072B2', vec: [-0.7, 0.1, -0.5, 0.5], pca: [-0.9, -0.8, 0.1], tsne: [-1.2, -1.0, 0.2], umap: [-1.1, -0.9, 0.0] },
  { word: 'attention', cluster: 'Transformers', color: '#CC79A7', vec: [-0.4, -0.5, -0.2, 1.0], pca: [0.7, -1.1, -0.4], tsne: [0.9, -1.3, -0.6], umap: [0.8, -1.2, -0.5] },
  { word: 'softmax', cluster: 'Transformers', color: '#CC79A7', vec: [-0.5, -0.4, -0.3, 0.9], pca: [0.4, -1.3, -0.2], tsne: [0.6, -1.5, -0.4], umap: [0.5, -1.4, -0.3] },
  { word: 'token', cluster: 'Transformers', color: '#CC79A7', vec: [-0.3, -0.6, -0.1, 0.95], pca: [1.0, -0.9, -0.7], tsne: [1.2, -1.1, -0.8], umap: [1.1, -1.0, -0.7] },
];

function cosineSim(a: number[], b: number[]): number {
  let dot = 0;
  let na = 0;
  let nb = 0;
  for (let i = 0; i < a.length; i++) {
    const va = a[i] ?? 0;
    const vb = b[i] ?? 0;
    dot += va * vb;
    na += va * va;
    nb += vb * vb;
  }
  return dot / (Math.sqrt(na) * Math.sqrt(nb) || 1);
}

export function EmbeddingSpaceViz() {
  const [projection, setProjection] = React.useState<ProjectionId>('pca');
  const [viewMode, setViewMode] = React.useState<'3d' | '2d'>('3d');
  const [selectedWord, setSelectedWord] = React.useState('king');

  const activeItem = WORDS.find((w) => w.word === selectedWord) ?? WORDS[0]!;
  const neighbors = React.useMemo(() => {
    return WORDS.filter((w) => w.word !== activeItem.word)
      .map((w) => ({
        ...w,
        similarity: cosineSim(activeItem.vec, w.vec),
      }))
      .sort((a, b) => b.similarity - a.similarity)
      .slice(0, 4);
  }, [activeItem]);

  // Analogy check: king - man + woman
  const analogyResult = React.useMemo(() => {
    const k = WORDS.find((w) => w.word === 'king')!.vec;
    const m = WORDS.find((w) => w.word === 'man')!.vec;
    const wom = WORDS.find((w) => w.word === 'woman')!.vec;
    const target = k.map((val, idx) => val - (m[idx] ?? 0) + (wom[idx] ?? 0));
    const best = WORDS.filter((w) => !['king', 'man', 'woman'].includes(w.word))
      .map((w) => ({ word: w.word, sim: cosineSim(target, w.vec) }))
      .sort((a, b) => b.sim - a.sim)[0];
    return best;
  }, []);

  const handleReset = () => {
    setProjection('pca');
    setViewMode('3d');
    setSelectedWord('king');
  };

  return (
    <VizShell
      title="Embedding Space Explorer (3D / 2D + Nearest Neighbors)"
      whatToNotice="Toggle between PCA, t-SNE, and UMAP layouts or select a token to inspect its cosine nearest neighbors and vector analogy geometry (king − man + woman ≈ queen)."
      onReset={handleReset}
      shareParams={{ projection, viewMode, word: selectedWord }}
      legend={[
        { label: 'Royalty', color: '#E69F00' },
        { label: 'Capitals', color: '#009E73' },
        { label: 'ML Core', color: '#0072B2' },
        { label: 'Transformers', color: '#CC79A7' },
      ]}
      summaryText={`Selected token "${activeItem.word}" (${activeItem.cluster}). Closest neighbor: "${neighbors[0]?.word ?? ''}" (${(neighbors[0]?.similarity ?? 0).toFixed(3)}).`}
      summaryTable={
        <DataTable
          caption={`Nearest neighbors to ${activeItem.word}`}
          headers={['Token', 'Cluster', 'Cosine Similarity']}
          rows={neighbors.map((n) => [n.word, n.cluster, n.similarity.toFixed(3)])}
        />
      }
      controls={
        <div className="space-y-4">
          <div role="group" aria-label="Embedding view dimension" className="grid grid-cols-2 gap-1 rounded-sm border border-hairline bg-subtle p-1">
            <Button
              size="sm"
              variant={viewMode === '3d' ? 'outline' : 'ghost'}
              aria-pressed={viewMode === '3d'}
              onClick={() => setViewMode('3d')}
            >
              3D Space
            </Button>
            <Button
              size="sm"
              variant={viewMode === '2d' ? 'outline' : 'ghost'}
              aria-pressed={viewMode === '2d'}
              onClick={() => setViewMode('2d')}
            >
              2D Projection
            </Button>
          </div>

          <Select
            label="Dimensionality Reduction"
            value={projection}
            onValueChange={(v) => setProjection(v as ProjectionId)}
            options={[
              { value: 'pca', label: 'PCA (Linear Global)' },
              { value: 'tsne', label: 't-SNE (Local Clusters)' },
              { value: 'umap', label: 'UMAP (Topological)' },
            ]}
          />

          <Select
            label="Inspect Token"
            value={selectedWord}
            onValueChange={setSelectedWord}
            options={WORDS.map((w) => ({ value: w.word, label: `${w.word} (${w.cluster})` }))}
          />

          <div className="space-y-1.5 border-t border-hairline pt-3 text-xs">
            <div className="font-semibold text-primary">
              Nearest Neighbors to &ldquo;{activeItem.word}&rdquo;
            </div>
            {neighbors.map((n) => (
              <div key={n.word} className="flex items-center justify-between font-mono">
                <button
                  type="button"
                  onClick={() => setSelectedWord(n.word)}
                  className="text-accent hover:underline"
                >
                  {n.word}
                </button>
                <span className="tabular-nums text-primary-secondary">{n.similarity.toFixed(3)}</span>
              </div>
            ))}
          </div>

          {analogyResult && (
            <div className="rounded-sm border border-accent/30 bg-accent-soft/30 p-2.5 text-xs">
              <span className="font-semibold text-primary">Vector Arithmetic: </span>
              <span className="font-mono">king - man + woman → </span>
              <strong className="font-mono text-accent">{analogyResult.word}</strong>{' '}
              <span className="text-primary-muted">({analogyResult.sim.toFixed(2)})</span>
            </div>
          )}
        </div>
      }
    >
      {viewMode === '3d' ? (
        <div className="h-[320px] w-full overflow-hidden rounded-sm border border-hairline bg-slate-950">
          <Canvas camera={{ position: [3.2, 2.4, 3.6], fov: 45 }}>
            <ambientLight intensity={0.85} />
            <directionalLight position={[4, 6, 4]} intensity={1} />
            <gridHelper args={[4, 8, '#334155', '#1e293b']} />
            {WORDS.map((item) => {
              const pos = item[projection];
              const isSelected = item.word === activeItem.word;
              return (
                <group key={item.word} position={pos}>
                  <mesh onClick={() => setSelectedWord(item.word)}>
                    <sphereGeometry args={[isSelected ? 0.14 : 0.09, 16, 16]} />
                    <meshStandardMaterial
                      color={item.color}
                      emissive={isSelected ? item.color : '#000000'}
                      emissiveIntensity={isSelected ? 0.6 : 0}
                    />
                  </mesh>
                  <Html distanceFactor={7} style={{ pointerEvents: 'none' }}>
                    <span
                      className={cn(
                        'rounded px-1.5 py-0.5 font-mono text-[10px] shadow-sm',
                        isSelected
                          ? 'bg-blue-600 font-bold text-white'
                          : 'bg-slate-900/80 text-slate-200'
                      )}
                    >
                      {item.word}
                    </span>
                  </Html>
                </group>
              );
            })}
            <OrbitControls enablePan={false} maxDistance={8} minDistance={2} />
          </Canvas>
        </div>
      ) : (
        <div className="overflow-hidden rounded-sm border border-hairline bg-canvas p-2">
          <svg
            viewBox="0 0 360 280"
            className="h-auto max-h-[320px] w-full"
            role="img"
            aria-label="2D projection of semantic word embeddings"
          >
            <line x1="180" y1="15" x2="180" y2="265" stroke="var(--border-hairline)" strokeDasharray="3 3" />
            <line x1="20" y1="140" x2="340" y2="140" stroke="var(--border-hairline)" strokeDasharray="3 3" />
            {WORDS.map((item) => {
              const [px, py] = item[projection];
              const cx = 180 + px * 78;
              const cy = 140 - py * 68;
              const isSelected = item.word === activeItem.word;
              return (
                <g
                  key={item.word}
                  className="cursor-pointer"
                  onClick={() => setSelectedWord(item.word)}
                >
                  <circle
                    cx={cx}
                    cy={cy}
                    r={isSelected ? 8 : 5.5}
                    fill={item.color}
                    stroke="#ffffff"
                    strokeWidth="1.5"
                  />
                  <text
                    x={cx + 9}
                    y={cy + 3}
                    className={cn(
                      'font-mono text-[10px]',
                      isSelected ? 'fill-accent font-bold' : 'fill-primary'
                    )}
                  >
                    {item.word}
                  </text>
                </g>
              );
            })}
          </svg>
        </div>
      )}
    </VizShell>
  );
}

