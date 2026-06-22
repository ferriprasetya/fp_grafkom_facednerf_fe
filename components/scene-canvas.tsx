"use client";

import React, { Suspense, useRef } from "react";
import { Canvas } from "@react-three/fiber";
import { OrbitControls, PerspectiveCamera } from "@react-three/drei";
import { EffectComposer, Outline } from "@react-three/postprocessing";
import { BlendFunction } from "postprocessing";
import type { Mesh, Object3D } from "three";
import { PLYMesh, type MaterialMode } from "@/components/ply-mesh";
import { CanvasErrorBoundary } from "@/components/canvas-error-boundary";
import { MousePointLight } from "@/components/mouse-point-light";

interface SceneCanvasProps {
  plyUrl: string | null;
  wireframe?: boolean;
  materialMode?: MaterialMode;
  outline?: boolean;
}

function MeshLoadingFallback() {
  return (
    <mesh>
      <sphereGeometry args={[0.6, 16, 16]} />
      <meshStandardMaterial color='#3a3a3a' wireframe />
    </mesh>
  );
}

export function SceneCanvas({
  plyUrl,
  wireframe = false,
  materialMode = "vertex",
  outline = false,
}: SceneCanvasProps) {
  /*
   * meshRef lets <Outline> select exactly this mesh for edge detection
   * without relying on layers or scene-wide selection lists.
   */
  const meshRef = useRef<Mesh>(null);

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
            {plyUrl ? (
              <PLYMesh
                url={plyUrl}
                wireframe={wireframe}
                materialMode={materialMode}
                meshRef={meshRef}
              />
            ) : (
              <MeshLoadingFallback />
            )}
          </Suspense>

          {/*
           * EffectComposer only mounts when outline is enabled AND a mesh
           * is loaded. Keeping it conditional avoids the extra render pass
           * cost when the feature is off.
           */}
          {outline && plyUrl && (
            <EffectComposer autoClear={false}>
              <Outline
                selection={meshRef as React.RefObject<Object3D>}
                blendFunction={BlendFunction.ALPHA}
                edgeStrength={4}
                visibleEdgeColor={0xffffff}
                hiddenEdgeColor={0x888888}
                /*
                 * xRay=false means hidden edges are drawn differently
                 * (dimmed) rather than completely invisible — gives a
                 * clean edge-detection look without occlusion clipping.
                 */
                xRay={false}
              />
            </EffectComposer>
          )}
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

