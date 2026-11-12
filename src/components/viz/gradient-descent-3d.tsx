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

function toSurfaceHeight(loss: number): number {
  return Math.min(2.8, Math.max(0, loss) * 0.45);
}

function OptimizerTrail({ run }: { run: OptimizerRunState }) {
  const lineObject = React.useMemo(() => {
    const pts = run.trail.map((p) => new THREE.Vector3(p.x, toSurfaceHeight(p.loss) + 0.05, p.y));
    if (pts.length < 2) {
      const fallback = new THREE.BufferGeometry().setFromPoints([
        new THREE.Vector3(0, 0, 0),
        new THREE.Vector3(0, 0.01, 0),
      ]);
      const mat = new THREE.LineBasicMaterial({ color: run.color, transparent: true, opacity: 0 });
      return new THREE.Line(fallback, mat);
    }
    const geometry = new THREE.BufferGeometry().setFromPoints(pts);
    const material = new THREE.LineBasicMaterial({ color: run.color, linewidth: 2 });
    return new THREE.Line(geometry, material);
  }, [run.trail, run.color]);

  React.useEffect(() => {
    return () => {
      lineObject.geometry.dispose();
      (lineObject.material as THREE.Material).dispose();
    };
  }, [lineObject]);

  const last = run.trail[run.trail.length - 1];

  return (
    <group>
      <primitive object={lineObject} />
      {last && (
        <mesh position={[last.x, toSurfaceHeight(last.loss) + 0.11, last.y]}>
          <sphereGeometry args={[0.11, 18, 18]} />
          <meshStandardMaterial color={run.color} emissive={run.color} emissiveIntensity={0.45} />
        </mesh>
      )}
    </group>
  );
}

function LossSurfaceMesh({
  landscape,
  runs,
}: {
  landscape: LandscapeId;
  runs: OptimizerRunState[];
}) {
  const geometry = React.useMemo(() => {
    const seg = 48;
    const geo = new THREE.PlaneGeometry(5.6, 5.6, seg, seg);
    geo.rotateX(-Math.PI / 2);
    const pos = geo.attributes.position;
    const colors: number[] = [];
    if (pos) {
      for (let i = 0; i < pos.count; i++) {
        const px = pos.getX(i);
        const pz = pos.getZ(i);
        const rawLoss = evalLoss(landscape, px, pz);
        const h = toSurfaceHeight(rawLoss);
        pos.setY(i, h);
        const norm = Math.min(1, h / 2.6);
        colors.push(0.14 + norm * 0.72, 0.36 + (1 - norm) * 0.34, 0.88 - norm * 0.52);
      }
      geo.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
      geo.computeVertexNormals();
    }
    return geo;
  }, [landscape]);

  React.useEffect(() => {
    return () => {
      geometry.dispose();
    };
  }, [geometry]);

  return (
    <group>
      <mesh geometry={geometry}>
        <meshStandardMaterial vertexColors roughness={0.5} metalness={0.08} />
      </mesh>
      <mesh geometry={geometry} position={[0, 0.005, 0]}>
        <meshBasicMaterial color="#ffffff" wireframe transparent opacity={0.12} />
      </mesh>
      {runs.map((r) => (
        <OptimizerTrail key={r.id} run={r} />
      ))}
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
    <div className="relative h-[340px] w-full overflow-hidden rounded-sm border border-hairline bg-[#0B0E14]">
      <Canvas camera={{ position: [5.7, 4.9, 5.7], fov: 42 }}>
        <ambientLight intensity={0.75} />
        <directionalLight position={[5, 8, 5]} intensity={1.15} />
        <LossSurfaceMesh landscape={landscape} runs={runs} />
        <OrbitControls enablePan={false} maxDistance={13} minDistance={2.8} />
      </Canvas>
      <div className="pointer-events-none absolute bottom-2 right-2 rounded-sm bg-[#0B0E14]/80 px-2 py-1 font-mono text-[10px] text-[#A6B0C3]">
        Drag to orbit · Scroll to zoom
      </div>
    </div>
  );
}
