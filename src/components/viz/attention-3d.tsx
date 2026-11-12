'use client';

import * as React from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Html } from '@react-three/drei';
import * as THREE from 'three';

function AttentionSkylineMesh({
  tokens,
  probs,
  causalMask,
  selectedQueryIdx,
  onSelectQuery,
}: {
  tokens: string[];
  probs: number[][];
  causalMask: boolean;
  selectedQueryIdx: number;
  onSelectQuery: (idx: number) => void;
}) {
  const n = tokens.length;
  const spacing = 0.56;
  const offset = ((n - 1) * spacing) / 2;

  const arcLine = React.useMemo(() => {
    const qRow = probs[selectedQueryIdx] ?? [];
    const linePts: number[] = [];
    const qx = -offset - 0.65;
    const qz = selectedQueryIdx * spacing - offset;

    for (let j = 0; j < n; j++) {
      const w = qRow[j] ?? 0;
      if (w < 0.08) continue;
      const kx = j * spacing - offset;
      const kz = -offset - 0.65;
      const peakH = Math.max(0.25, w * 2.2) + 0.35;
      linePts.push(qx, 0.15, qz, (qx + kx) / 2, peakH, (qz + kz) / 2);
      linePts.push((qx + kx) / 2, peakH, (qz + kz) / 2, kx, 0.15, kz);
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.Float32BufferAttribute(linePts, 3));
    const mat = new THREE.LineBasicMaterial({ color: '#FBBF24', transparent: true, opacity: 0.7 });
    return new THREE.LineSegments(geo, mat);
  }, [n, offset, probs, selectedQueryIdx, spacing]);

  React.useEffect(() => {
    return () => {
      arcLine.geometry.dispose();
      (arcLine.material as THREE.Material).dispose();
    };
  }, [arcLine]);

  return (
    <group>
      {/* Subtle base floor grid */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.02, 0]}>
        <planeGeometry args={[n * spacing + 0.8, n * spacing + 0.8]} />
        <meshStandardMaterial color="#121722" roughness={0.85} />
      </mesh>

      <primitive object={arcLine} />

      {/* Query axis labels */}
      {tokens.map((tok, i) => {
        const z = i * spacing - offset;
        const active = i === selectedQueryIdx;
        return (
          <Html key={`q-lbl-${i}`} position={[-offset - 0.85, 0.1, z]} center distanceFactor={7.2}>
            <button
              type="button"
              onClick={() => onSelectQuery(i)}
              className={`whitespace-nowrap rounded-sm px-1.5 py-0.5 font-mono text-[10px] transition-colors ${
                active
                  ? 'bg-[#FBBF24] font-bold text-[#0B0E14]'
                  : 'border border-[#242D3F] bg-[#121722]/90 text-[#EEF1F6] hover:border-[#60A5FA]'
              }`}
            >
              {tok}
            </button>
          </Html>
        );
      })}

      {/* Key axis labels */}
      {tokens.map((tok, j) => {
        const x = j * spacing - offset;
        return (
          <Html key={`k-lbl-${j}`} position={[x, 0.1, -offset - 0.85]} center distanceFactor={7.2}>
            <div className="pointer-events-none whitespace-nowrap rounded-sm border border-[#242D3F] bg-[#1A2130]/90 px-1.5 py-0.5 font-mono text-[10px] text-[#A6B0C3]">
              {tok}
            </div>
          </Html>
        );
      })}

      {/* 3D Attention Probability Columns */}
      {tokens.map((_, i) =>
        tokens.map((__, j) => {
          const weight = probs[i]?.[j] ?? 0;
          const masked = causalMask && j > i;
          const isSelectedRow = i === selectedQueryIdx;
          const height = masked ? 0.03 : Math.max(0.05, weight * 2.4);
          const x = j * spacing - offset;
          const z = i * spacing - offset;

          const color = masked
            ? '#242D3F'
            : isSelectedRow
              ? weight > 0.22
                ? '#FBBF24'
                : '#38BDF8'
              : weight > 0.25
                ? '#1D4ED8'
                : '#475569';

          return (
            <mesh
              key={`bar-${i}-${j}`}
              position={[x, height / 2, z]}
              onClick={(e) => {
                e.stopPropagation();
                onSelectQuery(i);
              }}
            >
              <boxGeometry args={[0.38, height, 0.38]} />
              <meshStandardMaterial
                color={color}
                emissive={isSelectedRow && !masked ? color : '#000000'}
                emissiveIntensity={isSelectedRow ? 0.25 : 0}
                roughness={0.4}
              />
            </mesh>
          );
        })
      )}
    </group>
  );
}

export function Attention3DCanvas({
  tokens,
  probs,
  causalMask,
  selectedQueryIdx,
  onSelectQuery,
}: {
  tokens: string[];
  probs: number[][];
  causalMask: boolean;
  selectedQueryIdx: number;
  onSelectQuery: (idx: number) => void;
}) {
  return (
    <div className="relative h-[360px] w-full overflow-hidden rounded-sm border border-hairline bg-[#0B0E14]">
      <Canvas camera={{ position: [4.8, 4.3, 5.2], fov: 42 }}>
        <ambientLight intensity={0.85} />
        <directionalLight position={[5, 9, 5]} intensity={1.15} />
        <AttentionSkylineMesh
          tokens={tokens}
          probs={probs}
          causalMask={causalMask}
          selectedQueryIdx={selectedQueryIdx}
          onSelectQuery={onSelectQuery}
        />
        <OrbitControls enablePan={false} maxDistance={11} minDistance={2.8} />
      </Canvas>
      <div className="pointer-events-none absolute bottom-2 right-2 rounded-sm bg-[#0B0E14]/80 px-2 py-1 font-mono text-[10px] text-[#A6B0C3]">
        Gold row = Query &ldquo;{tokens[selectedQueryIdx] ?? ''}&rdquo; · Drag to orbit
      </div>
    </div>
  );
}

