"use client";

import React, { Suspense, useEffect, useRef, type RefObject } from "react";
import { Canvas, useThree } from "@react-three/fiber";
import { OrbitControls, PerspectiveCamera } from "@react-three/drei";
import { EffectComposer, Outline } from "@react-three/postprocessing";
import { BlendFunction } from "postprocessing";
import { Color, type Object3D } from "three";
import { PLYMesh, type MaterialMode } from "@/components/ply-mesh";
import { GLBMesh } from "@/components/glb-mesh";
import { CanvasErrorBoundary } from "@/components/canvas-error-boundary";
import { MousePointLight } from "@/components/mouse-point-light";
import { getModelFormat } from "@/lib/model-url";
import type { MeshSideMode } from "@/lib/mesh-analysis";

export interface CameraSnapshot {
  position: [number, number, number];
  target: [number, number, number];
}

interface SceneCanvasProps {
  modelUrl: string | null;
  wireframe?: boolean;
  materialMode?: MaterialMode;
  outline?: boolean;
  sideMode?: MeshSideMode;
  flipNormals?: boolean;
  meshRotation?: [number, number, number];
  lockTarget?: boolean;
  cameraSnapshot?: CameraSnapshot | null;
  onCameraChange?: (snapshot: CameraSnapshot) => void;
}

function MeshLoadingFallback() {
  return (
    <mesh>
      <sphereGeometry args={[0.6, 16, 16]} />
      <meshStandardMaterial color='#3a3a3a' wireframe />
    </mesh>
  );
}

function CameraSync({
  snapshot,
  controlsRef,
  applyingRef,
}: {
  snapshot: CameraSnapshot | null | undefined;
  controlsRef: RefObject<any>;
  applyingRef: RefObject<boolean>;
}) {
  const { camera, invalidate } = useThree();

  useEffect(() => {
    const controls = controlsRef.current;
    if (!snapshot || !controls) return;
    applyingRef.current = true;
    camera.position.set(...snapshot.position);
    controls.target.set(...snapshot.target);
    controls.update();
    invalidate();
    queueMicrotask(() => {
      applyingRef.current = false;
    });
  }, [applyingRef, camera, controlsRef, invalidate, snapshot]);

  return null;
}

export function SceneCanvas({
  modelUrl,
  wireframe = false,
  materialMode = "vertex",
  outline = false,
  sideMode = "double",
  flipNormals = false,
  meshRotation = [0, 0, 0],
  lockTarget = false,
  cameraSnapshot,
  onCameraChange,
}: SceneCanvasProps) {
  /*
   * meshRef lets <Outline> select exactly this mesh for edge detection
   * without relying on layers or scene-wide selection lists.
   */
  const meshRef = useRef<Object3D>(null);
  const controlsRef = useRef<any>(null);
  const applyingCameraRef = useRef(false);

  const format = getModelFormat(modelUrl);

  useEffect(() => {
    const controls = controlsRef.current;
    if (!controls || !lockTarget) return;
    controls.target.set(0, 0, 0);
    controls.update();
  }, [lockTarget]);

  return (
    <div
      className='absolute inset-0'
      data-model-url={modelUrl ?? ""}
    >
      <CanvasErrorBoundary>
        <Canvas
          dpr={[1, 1.5]}
          frameloop='demand'
          gl={{
            antialias: true,
            alpha: true,
            powerPreference: "high-performance",
            preserveDrawingBuffer: true,
          }}
        >
          <PerspectiveCamera
            makeDefault
            fov={45}
            position={[0, 0, 4]}
            near={0.01}
            far={100}
          />

          {/*
           * scene.background via attach so it renders behind the mesh but
           * stays independent of the CSS layer. Neutral dark-blue-grey gives
           * enough contrast for both light and dark vertex-color meshes.
           */}
          <color attach='background' args={[new Color("#1c1f2e")]} />

          {/* Boosted ambient so PBR meshStandardMaterial vertex colors read correctly */}
          <ambientLight intensity={1.2} />
          <directionalLight position={[5, 8, 5]} intensity={0.8} />

          {/* Dynamic point light that follows the cursor */}
          <MousePointLight />

          <OrbitControls
            ref={controlsRef}
            enableDamping
            dampingFactor={0.06}
            minDistance={0.5}
            maxDistance={20}
            enablePan={!lockTarget}
            makeDefault
            onChange={() => {
              const controls = controlsRef.current;
              if (!controls) {
                return;
              }
              if (lockTarget) {
                controls.target.set(0, 0, 0);
              }
              if (!onCameraChange || applyingCameraRef.current) {
                return;
              }
              onCameraChange({
                position: [
                  controls.object.position.x,
                  controls.object.position.y,
                  controls.object.position.z,
                ],
                target: [
                  controls.target.x,
                  controls.target.y,
                  controls.target.z,
                ],
              });
            }}
          />
          <CameraSync
            snapshot={cameraSnapshot}
            controlsRef={controlsRef}
            applyingRef={applyingCameraRef}
          />

          <Suspense fallback={<MeshLoadingFallback />}>
            {modelUrl ? (
              format === "glb" ? (
                <GLBMesh
                  url={modelUrl}
                  wireframe={wireframe}
                  rotation={meshRotation}
                  meshRef={meshRef}
                />
              ) : (
                <PLYMesh
                  url={modelUrl}
                  wireframe={wireframe}
                  materialMode={materialMode}
                  sideMode={sideMode}
                  flipNormals={flipNormals}
                  rotation={meshRotation}
                  meshRef={meshRef}
                />
              )
            ) : (
              <MeshLoadingFallback />
            )}
          </Suspense>

          {/*
           * EffectComposer only mounts when outline is enabled AND a mesh
           * is loaded. Keeping it conditional avoids the extra render pass
           * cost when the feature is off.
           */}
          {outline && modelUrl && (
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

      {!modelUrl && (
        <div className='pointer-events-none absolute bottom-4 left-1/2 -translate-x-1/2'>
          <span className='rounded-full bg-background/70 px-3 py-1 text-xs text-muted-foreground backdrop-blur-sm'>
            Move cursor to relight — drag to orbit
          </span>
        </div>
      )}
    </div>
  );
}


