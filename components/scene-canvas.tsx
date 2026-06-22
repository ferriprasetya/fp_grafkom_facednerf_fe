"use client";

import { Suspense } from "react";
import { Canvas } from "@react-three/fiber";
import { OrbitControls, PerspectiveCamera } from "@react-three/drei";
import { PLYMesh } from "@/components/ply-mesh";
import { CanvasErrorBoundary } from "@/components/canvas-error-boundary";
import { MousePointLight } from "@/components/mouse-point-light";

interface SceneCanvasProps {
  plyUrl: string | null;
}

function MeshLoadingFallback() {
  return (
    <mesh>
      <sphereGeometry args={[0.6, 16, 16]} />
      <meshStandardMaterial color='#3a3a3a' wireframe />
    </mesh>
  );
}

export function SceneCanvas({ plyUrl }: SceneCanvasProps) {
  return (
    <div
      className='absolute inset-0'
      id='ply-viewer-mount'
      data-ply-url={plyUrl ?? ""}
    >
      <CanvasErrorBoundary>
        <Canvas
          frameloop='demand'
          gl={{ antialias: true, alpha: false }}
          shadows
        >
          <PerspectiveCamera
            makeDefault
            fov={45}
            position={[0, 0, 4]}
            near={0.01}
            far={100}
          />

          {/* Static fill light — kept low so mouse light reads clearly */}
          <ambientLight intensity={0.3} />
          <directionalLight position={[5, 8, 5]} intensity={0.5} castShadow />

          {/* Dynamic point light that follows the cursor */}
          <MousePointLight />

          <OrbitControls
            enableDamping
            dampingFactor={0.06}
            minDistance={0.5}
            maxDistance={20}
            makeDefault
          />

          <Suspense fallback={<MeshLoadingFallback />}>
            {plyUrl ? <PLYMesh url={plyUrl} /> : <MeshLoadingFallback />}
          </Suspense>
        </Canvas>
      </CanvasErrorBoundary>

      {!plyUrl && (
        <div className='pointer-events-none absolute bottom-4 left-1/2 -translate-x-1/2'>
          <span className='rounded-full bg-background/70 px-3 py-1 text-xs text-muted-foreground backdrop-blur-sm'>
            Move cursor to relight — drag to orbit
          </span>
        </div>
      )}
    </div>
  );
}

