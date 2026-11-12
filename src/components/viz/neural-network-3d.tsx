'use client';

import * as React from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Html } from '@react-three/drei';
import * as THREE from 'three';

export interface NnSamplePoint {
  x1: number;
  x2: number;
  y: 0 | 1;
}

function ProbabilityManifold3D({
  gridProbs,
  data,
}: {
  gridProbs: number[];
  data: NnSamplePoint[];
}) {
  const surfaceGeometry = React.useMemo(() => {
    const n = 16;
    const geo = new THREE.PlaneGeometry(2.4, 2.4, n - 1, n - 1);
    geo.rotateX(-Math.PI / 2);
    const pos = geo.attributes.position;
    const colors: number[] = [];

    if (pos) {
      for (let idx = 0; idx < pos.count; idx++) {
        const prob = gridProbs[idx] ?? 0.5;
        const elevation = (prob - 0.5) * 1.6;
        pos.setY(idx, elevation);

        // Smooth interpolation between Amber (#E69F00) for p=0 and Deep Blue (#0072B2) for p=1
        const r = (1 - prob) * 0.9 + prob * 0.0;
        const g = (1 - prob) * 0.62 + prob * 0.45;
        const b = (1 - prob) * 0.0 + prob * 0.7;
        colors.push(r, g, b);
      }
      geo.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
      geo.computeVertexNormals();
    }
    return geo;
  }, [gridProbs]);

  React.useEffect(() => {
    return () => surfaceGeometry.dispose();
  }, [surfaceGeometry]);

  return (
    <group position={[1.35, 0, 0]}>
      {/* Live probability surface */}
      <mesh geometry={surfaceGeometry}>
        <meshStandardMaterial vertexColors side={THREE.DoubleSide} roughness={0.5} metalness={0.05} />
      </mesh>
      <mesh geometry={surfaceGeometry} position={[0, 0.004, 0]}>
        <meshBasicMaterial color="#ffffff" wireframe transparent opacity={0.14} />
      </mesh>

      {/* P = 0.5 Decision boundary plane */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]}>
        <planeGeometry args={[2.5, 2.5]} />
        <meshBasicMaterial color="#94a3b8" transparent opacity={0.16} side={THREE.DoubleSide} />
      </mesh>

      {/* Training samples */}
      {data.map((pt, i) => (
        <mesh
          key={i}
          position={[pt.x1 * 1.05, pt.y === 1 ? 0.52 : -0.52, -pt.x2 * 1.05]}
        >
          <sphereGeometry args={[0.045, 10, 10]} />
          <meshStandardMaterial color={pt.y === 1 ? '#38BDF8' : '#FBBF24'} />
        </mesh>
      ))}

      <Html position={[0, 1.05, 0]} center distanceFactor={6}>
        <div className="pointer-events-none whitespace-nowrap rounded-sm border border-[#242D3F] bg-[#121722]/90 px-2 py-0.5 font-mono text-[10px] text-[#EEF1F6]">
          3D P(y=1 | x₁, x₂) Manifold
        </div>
      </Html>
    </group>
  );
}

function NetworkArchitecture3D({ layerCounts }: { layerCounts: number[] }) {
  const { nodes, edgeGeo } = React.useMemo(() => {
    const positions: Array<{ x: number; y: number; z: number; layer: number }> = [];
    const totalLayers = Math.max(2, layerCounts.length);

    layerCounts.forEach((count, lIdx) => {
      const lx = -1.1 + (lIdx / (totalLayers - 1)) * 2.1;
      for (let i = 0; i < count; i++) {
        const ly = (i - (count - 1) / 2) * 0.42;
        const lz = ((i % 2 === 0 ? 1 : -1) * (lIdx > 0 && lIdx < totalLayers - 1 ? 0.22 : 0));
        positions.push({ x: lx, y: ly, z: lz, layer: lIdx });
      }
    });

    const linePoints: number[] = [];
    for (const a of positions) {
      for (const b of positions) {
        if (b.layer === a.layer + 1) {
          linePoints.push(a.x, a.y, a.z, b.x, b.y, b.z);
        }
      }
    }

    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.Float32BufferAttribute(linePoints, 3));
    return { nodes: positions, edgeGeo: geo };
  }, [layerCounts]);

  const linesObj = React.useMemo(() => {
    const mat = new THREE.LineBasicMaterial({ color: '#64748B', transparent: true, opacity: 0.45 });
    return new THREE.LineSegments(edgeGeo, mat);
  }, [edgeGeo]);

  React.useEffect(() => {
    return () => {
      edgeGeo.dispose();
      (linesObj.material as THREE.Material).dispose();
    };
  }, [edgeGeo, linesObj]);

  return (
    <group position={[-1.65, 0, 0]}>
      <primitive object={linesObj} />
      {nodes.map((node, idx) => {
        const color =
          node.layer === 0
            ? '#56B4E9'
            : node.layer === layerCounts.length - 1
              ? '#0072B2'
              : '#E69F00';
        return (
          <mesh key={idx} position={[node.x, node.y, node.z]}>
            <sphereGeometry args={[0.1, 16, 16]} />
            <meshStandardMaterial color={color} emissive={color} emissiveIntensity={0.25} />
          </mesh>
        );
      })}
      <Html position={[0, 1.05, 0]} center distanceFactor={6}>
        <div className="pointer-events-none whitespace-nowrap rounded-sm border border-[#242D3F] bg-[#121722]/90 px-2 py-0.5 font-mono text-[10px] text-[#EEF1F6]">
          3D Network ({layerCounts.join('→')})
        </div>
      </Html>
    </group>
  );
}

export function NeuralNetwork3DCanvas({
  layerCounts,
  gridProbs,
  data,
}: {
  layerCounts: number[];
  gridProbs: number[];
  data: NnSamplePoint[];
}) {
  return (
    <div className="relative h-[340px] w-full overflow-hidden rounded-sm border border-hairline bg-[#0B0E14]">
      <Canvas camera={{ position: [0.1, 2.2, 5.2], fov: 42 }}>
        <ambientLight intensity={0.8} />
        <directionalLight position={[4, 7, 5]} intensity={1.15} />
        <NetworkArchitecture3D layerCounts={layerCounts} />
        <ProbabilityManifold3D gridProbs={gridProbs} data={data} />
        <OrbitControls enablePan={false} maxDistance={9} minDistance={2.5} />
      </Canvas>
      <div className="pointer-events-none absolute bottom-2 right-2 rounded-sm bg-[#0B0E14]/80 px-2 py-1 font-mono text-[10px] text-[#A6B0C3]">
        Drag to orbit · Scroll to zoom
      </div>
    </div>
  );
}

