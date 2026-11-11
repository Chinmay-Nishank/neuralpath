'use client';

import * as React from 'react';
import { Upload } from 'lucide-react';
import { VizShell } from './viz-shell';
import { Select } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { Toggle } from '@/components/ui/toggle';
import { DataTable } from '@/components/ui/table';
import { cn } from '@/lib/utils';

type ImagePresetId = 'digit7' | 'window' | 'checker';
type KernelPresetId = 'sobel-x' | 'sobel-y' | 'edge' | 'sharpen' | 'blur' | 'emboss';

const KERNEL_PRESETS: Record<KernelPresetId, { label: string; k: number[] }> = {
  'sobel-x': { label: 'Sobel Vertical Edge', k: [-1, 0, 1, -2, 0, 2, -1, 0, 1] },
  'sobel-y': { label: 'Sobel Horizontal Edge', k: [-1, -2, -1, 0, 0, 0, 1, 2, 1] },
  edge: { label: 'Laplacian Outline', k: [-1, -1, -1, -1, 8, -1, -1, -1, -1] },
  sharpen: { label: 'Sharpen', k: [0, -1, 0, -1, 5, -1, 0, -1, 0] },
  blur: { label: 'Box Blur (avg × 9)', k: [1, 1, 1, 1, 1, 1, 1, 1, 1] },
  emboss: { label: 'Emboss', k: [-2, -1, 0, -1, 1, 1, 0, 1, 2] },
};

function makePresetImage(id: ImagePresetId): number[][] {
  const size = 12;
  const grid = Array.from({ length: size }, () => Array(size).fill(20));
  if (id === 'digit7') {
    for (let c = 2; c <= 9; c++) grid[2]![c] = 240;
    for (let r = 3; r <= 9; r++) {
      const c = Math.max(2, Math.min(9, 11 - r));
      grid[r]![c] = 240;
      if (c > 2) grid[r]![c - 1] = 170;
    }
  } else if (id === 'window') {
    for (let r = 2; r < 10; r++) {
      for (let c = 2; c < 10; c++) {
        grid[r]![c] = r === 2 || r === 9 || c === 2 || c === 9 || r === 6 || c === 6 ? 235 : 80;
      }
    }
  } else {
    for (let r = 0; r < size; r++) {
      for (let c = 0; c < size; c++) {
        grid[r]![c] = (Math.floor(r / 3) + Math.floor(c / 3)) % 2 === 0 ? 230 : 30;
      }
    }
  }
  return grid;
}

export function ConvolutionExplorerViz() {
  const [imagePreset, setImagePreset] = React.useState<ImagePresetId>('digit7');
  const [inputGrid, setInputGrid] = React.useState<number[][]>(() => makePresetImage('digit7'));
  const [kernelPreset, setKernelPreset] = React.useState<KernelPresetId>('sobel-x');
  const [kernel, setKernel] = React.useState<number[]>(KERNEL_PRESETS['sobel-x'].k);
  const [zeroPadding, setZeroPadding] = React.useState(true);
  const [stride, setStride] = React.useState(1);
  const [selectedCell, setSelectedCell] = React.useState<[number, number]>([2, 4]);

  const handleImageSelect = (id: ImagePresetId) => {
    setImagePreset(id);
    setInputGrid(makePresetImage(id));
  };

  const handleKernelSelect = (id: KernelPresetId) => {
    setKernelPreset(id);
    setKernel([...KERNEL_PRESETS[id].k]);
  };

  const handleUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = 12;
        canvas.height = 12;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;
        ctx.drawImage(img, 0, 0, 12, 12);
        const raw = ctx.getImageData(0, 0, 12, 12).data;
        const nextGrid: number[][] = [];
        for (let r = 0; r < 12; r++) {
          const row: number[] = [];
          for (let c = 0; c < 12; c++) {
            const idx = (r * 12 + c) * 4;
            const gray = Math.round(
              0.299 * (raw[idx] ?? 0) + 0.587 * (raw[idx + 1] ?? 0) + 0.114 * (raw[idx + 2] ?? 0)
            );
            row.push(gray);
          }
          nextGrid.push(row);
        }
        setInputGrid(nextGrid);
      };
      if (typeof reader.result === 'string') {
        img.src = reader.result;
      }
    };
    reader.readAsDataURL(file);
  };

  const { featureMap, maxAbs } = React.useMemo(() => {
    const H = inputGrid.length;
    const W = inputGrid[0]?.length ?? 12;
    const pad = zeroPadding ? 1 : 0;
    const outH = Math.floor((H + 2 * pad - 3) / stride) + 1;
    const outW = Math.floor((W + 2 * pad - 3) / stride) + 1;
    const out: number[][] = [];
    let peak = 1;
    const div = kernelPreset === 'blur' ? 9 : 1;

    for (let r = 0; r < outH; r++) {
      const row: number[] = [];
      for (let c = 0; c < outW; c++) {
        let sum = 0;
        const r0 = r * stride - pad;
        const c0 = c * stride - pad;
        for (let kr = 0; kr < 3; kr++) {
          for (let kc = 0; kc < 3; kc++) {
            const ir = r0 + kr;
            const ic = c0 + kc;
            const pix = ir >= 0 && ir < H && ic >= 0 && ic < W ? inputGrid[ir]?.[ic] ?? 0 : 0;
            sum += pix * (kernel[kr * 3 + kc] ?? 0);
          }
        }
        const val = sum / div;
        peak = Math.max(peak, Math.abs(val));
        row.push(val);
      }
      out.push(row);
    }
    return { featureMap: out, maxAbs: peak };
  }, [inputGrid, kernel, zeroPadding, stride, kernelPreset]);

  const padOffset = zeroPadding ? 1 : 0;
  const recRow = (selectedCell[0] ?? 0) * stride - padOffset;
  const recCol = (selectedCell[1] ?? 0) * stride - padOffset;
  const selectedVal = featureMap[selectedCell[0]]?.[selectedCell[1]] ?? 0;

  const handleReset = () => {
    setImagePreset('digit7');
    setInputGrid(makePresetImage('digit7'));
    setKernelPreset('sobel-x');
    setKernel([...KERNEL_PRESETS['sobel-x'].k]);
    setZeroPadding(true);
    setStride(1);
    setSelectedCell([2, 4]);
  };

  return (
    <VizShell
      title="2D Convolution & Receptive Field Explorer"
      whatToNotice="Click any pixel in the Feature Map to highlight its 3×3 receptive field in the input image. Try Sobel Vertical vs Horizontal kernels to see how CNN filters specialize."
      onReset={handleReset}
      shareParams={{ imagePreset, kernelPreset, zeroPadding, stride }}
      summaryText={`Output feature map dimensions: ${featureMap.length}×${featureMap[0]?.length ?? 0}. Selected output (${selectedCell[0]}, ${selectedCell[1]}) = ${selectedVal.toFixed(1)}.`}
      summaryTable={
        <DataTable
          caption="3x3 Convolution Kernel Weights"
          headers={['Col 0', 'Col 1', 'Col 2']}
          rows={[
            [kernel[0] ?? 0, kernel[1] ?? 0, kernel[2] ?? 0],
            [kernel[3] ?? 0, kernel[4] ?? 0, kernel[5] ?? 0],
            [kernel[6] ?? 0, kernel[7] ?? 0, kernel[8] ?? 0],
          ]}
        />
      }
      controls={
        <div className="space-y-4">
          <Select
            label="Sample Input"
            value={imagePreset}
            onValueChange={(v) => handleImageSelect(v as ImagePresetId)}
            options={[
              { value: 'digit7', label: 'Handwritten Digit 7' },
              { value: 'window', label: 'Window Frame' },
              { value: 'checker', label: 'Checkerboard' },
            ]}
          />

          <label className="flex cursor-pointer items-center justify-center gap-2 rounded-sm border border-dashed border-strong bg-surface px-3 py-2 text-xs font-medium text-primary hover:bg-subtle">
            <Upload className="h-3.5 w-3.5 text-accent" aria-hidden="true" />
            <span>Upload custom image</span>
            <input type="file" accept="image/*" onChange={handleUpload} className="sr-only" />
          </label>

          <Select
            label="Kernel Preset"
            value={kernelPreset}
            onValueChange={(v) => handleKernelSelect(v as KernelPresetId)}
            options={Object.entries(KERNEL_PRESETS).map(([id, item]) => ({
              value: id,
              label: item.label,
            }))}
          />

          <div>
            <div className="mb-1.5 text-xs font-medium text-primary">Custom 3×3 Kernel Weights</div>
            <div className="grid grid-cols-3 gap-1.5">
              {kernel.map((val, idx) => (
                <input
                  key={idx}
                  type="number"
                  aria-label={`Kernel weight row ${Math.floor(idx / 3) + 1} col ${(idx % 3) + 1}`}
                  value={val}
                  onChange={(e) => {
                    const num = Number(e.target.value) || 0;
                    setKernel((prev) => prev.map((k, i) => (i === idx ? num : k)));
                  }}
                  className="h-8 w-full rounded-sm border border-strong bg-surface text-center font-mono text-xs text-primary"
                />
              ))}
            </div>
          </div>

          <Toggle label="Zero Padding (p=1)" checked={zeroPadding} onCheckedChange={setZeroPadding} />
          <Slider label="Stride" value={stride} min={1} max={2} step={1} onValueChange={setStride} />
        </div>
      }
    >
      <div className="grid gap-4 sm:grid-cols-2">
        {/* Input Image Grid */}
        <div className="space-y-2">
          <div className="text-xs font-medium text-primary-secondary">
            Input Image (12×12 grayscale)
          </div>
          <div
            className="grid gap-0.5 rounded-sm border border-hairline bg-canvas p-2"
            style={{ gridTemplateColumns: 'repeat(12, minmax(0, 1fr))' }}
          >
            {inputGrid.map((row, r) =>
              row.map((pix, c) => {
                const inReceptiveField =
                  r >= recRow && r < recRow + 3 && c >= recCol && c < recCol + 3;
                return (
                  <div
                    key={`${r}-${c}`}
                    title={`(${r},${c}) = ${pix}`}
                    className={cn(
                      'aspect-square rounded-[2px]',
                      inReceptiveField && 'ring-2 ring-accent z-10'
                    )}
                    style={{ backgroundColor: `rgb(${pix},${pix},${pix})` }}
                  />
                );
              })
            )}
          </div>
        </div>

        {/* Output Feature Map */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs text-primary-secondary">
            <span>
              Feature Map ({featureMap.length}×{featureMap[0]?.length ?? 0})
            </span>
            <span className="font-mono text-primary">
              Val: {selectedVal.toFixed(1)}
            </span>
          </div>
          <div
            className="grid gap-0.5 rounded-sm border border-hairline bg-canvas p-2"
            style={{
              gridTemplateColumns: `repeat(${featureMap[0]?.length ?? 10}, minmax(0, 1fr))`,
            }}
          >
            {featureMap.map((row, r) =>
              row.map((val, c) => {
                const intensity = Math.min(1, Math.abs(val) / maxAbs);
                const isSelected = selectedCell[0] === r && selectedCell[1] === c;
                const bg =
                  val >= 0
                    ? `rgba(0, 114, 178, ${(0.08 + intensity * 0.9).toFixed(2)})`
                    : `rgba(213, 94, 0, ${(0.08 + intensity * 0.9).toFixed(2)})`;
                return (
                  <button
                    key={`${r}-${c}`}
                    type="button"
                    onClick={() => setSelectedCell([r, c])}
                    aria-label={`Feature map cell ${r}, ${c}, value ${val.toFixed(1)}`}
                    className={cn(
                      'aspect-square rounded-[2px] border border-hairline/40 transition-transform',
                      isSelected && 'ring-2 ring-primary z-10 scale-105'
                    )}
                    style={{ backgroundColor: bg }}
                  />
                );
              })
            )}
          </div>
        </div>
      </div>
    </VizShell>
  );
}

