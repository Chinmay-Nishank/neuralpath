'use client';

import * as React from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import * as THREE from 'three';
import {
  evalLoss,
  type LandscapeId,
  type OptimizerRunState,
} from './gradient-descent-math';

function LossSurfaceMesh({
  landscape,
  runs,
}: {
  landscape: LandscapeId;
  runs: OptimizerRunState[];
}) {
  const geometry = React.useMemo(() => {
    const seg = 44;
    const geo = new THREE.PlaneGeometry(5.6, 5.6, seg, seg);
    geo.rotateX(-Math.PI / 2);
    const pos = geo.attributes.position;
    const colors: number[] = [];
    if (pos) {
      for (let i = 0; i < pos.count; i++) {
        const px = pos.getX(i);
        const pz = pos.getZ(i);
        const rawLoss = evalLoss(landscape, px, pz);
        const h = Math.min(2.8, rawLoss * 0.45);
        pos.setY(i, h);
        const norm = Math.min(1, h / 2.6);
        colors.push(0.18 + norm * 0.65, 0.38 + (1 - norm) * 0.32, 0.85 - norm * 0.48);
      }
      geo.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
      geo.computeVertexNormals();
    }
    return geo;
  }, [landscape]);

  return (
    <group>
      <mesh geometry={geometry}>
        <meshStandardMaterial vertexColors roughness={0.55} metalness={0.08} wireframe={false} />
      </mesh>
      {runs.map((r) => {
        const last = r.trail[r.trail.length - 1];
        if (!last) return null;
        const h = Math.min(2.8, last.loss * 0.45) + 0.08;
        return (
          <mesh key={r.id} position={[last.x, h, last.y]}>
            <sphereGeometry args={[0.11, 16, 16]} />
            <meshStandardMaterial color={r.color} emissive={r.color} emissiveIntensity={0.4} />
          </mesh>
        );
      })}
    </group>
  );
}

export function LossSurfaceCanvas({
  landscape,
  runs,
}: {
  landscape: LandscapeId;
  runs: OptimizerRunState[];
}) {
  return (
    <div className="h-[320px] w-full overflow-hidden rounded-sm border border-hairline bg-slate-950">
      <Canvas camera={{ position: [4.2, 3.8, 4.2], fov: 45 }}>
        <ambientLight intensity={0.7} />
        <directionalLight position={[5, 8, 5]} intensity={1.1} />
        <LossSurfaceMesh landscape={landscape} runs={runs} />
        <OrbitControls enablePan={false} maxDistance={10} minDistance={2.5} />
      </Canvas>
    </div>
  );
}

