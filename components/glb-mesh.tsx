"use client";

import { useMemo, type RefObject } from "react";
import { useGLTF } from "@react-three/drei";
import { Box3, Vector3, type Mesh, type Object3D } from "three";

interface GLBMeshProps {
  url: string;
  wireframe?: boolean;
  meshRef?: RefObject<Object3D | null>;
}

export function GLBMesh({ url, wireframe = false, meshRef }: GLBMeshProps) {
  const { scene } = useGLTF(url);

  const clonedScene = useMemo(() => {
    const clone = scene.clone(true);

    clone.traverse((child) => {
      if ((child as Mesh).isMesh) {
        const mesh = child as Mesh;
        if (Array.isArray(mesh.material)) {
          mesh.material = mesh.material.map((mat) => mat.clone());
        } else if (mesh.material) {
          mesh.material = mesh.material.clone();
        }
      }
    });

    const box = new Box3().setFromObject(clone);
    const center = new Vector3();
    box.getCenter(center);
    clone.position.sub(center);

    const size = new Vector3();
    box.getSize(size);
    const maxDim = Math.max(size.x, size.y, size.z);
    if (maxDim > 0) {
      const scale = 2 / maxDim;
      clone.scale.set(scale, scale, scale);
    }

    return clone;
  }, [scene]);

  useMemo(() => {
    clonedScene.traverse((child) => {
      if ((child as Mesh).isMesh) {
        const mesh = child as Mesh;
        if (Array.isArray(mesh.material)) {
          mesh.material.forEach((mat) => {
            if ("wireframe" in mat) {
              (mat as any).wireframe = wireframe;
            }
          });
        } else if (mesh.material && "wireframe" in mesh.material) {
          (mesh.material as any).wireframe = wireframe;
        }
      }
    });
  }, [clonedScene, wireframe]);

  return <primitive object={clonedScene} ref={meshRef} />;
}
