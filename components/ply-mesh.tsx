"use client";

import { useMemo, type RefObject } from "react";
import { useLoader } from "@react-three/fiber";
import { PLYLoader } from "three/examples/jsm/loaders/PLYLoader.js";
import { Vector3, type Mesh, type Object3D } from "three";

export type MaterialMode = "vertex" | "skin";

interface PLYMeshProps {
  url: string;
  wireframe?: boolean;
  materialMode?: MaterialMode;
  /** Forwarded ref so parent effects (e.g. Outline) can target this mesh. */
  meshRef?: RefObject<Object3D | null>;
}

/**
 * Loads a .ply file and renders it as a mesh.
 *
 * useLoader suspends while the file is in-flight — the parent <Suspense>
 * catches this and shows the fallback spinner.
 *
 * computeVertexNormals() is essential: FaceDNeRF outputs often lack
 * pre-computed normals, causing flat / broken shading without it.
 */
export function PLYMesh({
  url,
  wireframe = false,
  materialMode = "vertex",
  meshRef,
}: PLYMeshProps) {
  const rawGeometry = useLoader(PLYLoader, url);

  const geometry = useMemo(() => {
    rawGeometry.computeVertexNormals();
    // Center so the bounding box midpoint sits at the world origin
    rawGeometry.center();
    rawGeometry.computeBoundingBox();
    const size = rawGeometry.boundingBox!.getSize(new Vector3());
    const maxDim = Math.max(size.x, size.y, size.z);
    // Normalize to ~2 world units so it always fits the default camera
    if (maxDim > 0) rawGeometry.scale(2 / maxDim, 2 / maxDim, 2 / maxDim);
    return rawGeometry;
  }, [rawGeometry]);

  return (
    <mesh ref={meshRef} geometry={geometry} castShadow receiveShadow>
      {materialMode === "skin" ? (
        /*
         * Classic Phong shading with a neutral skin base color.
         * Demonstrates shading without vertex color data.
         */
        <meshPhongMaterial
          color='#e8b89a'
          specular='#ffffff'
          shininess={30}
          wireframe={wireframe}
        />
      ) : (
        /*
         * vertexColors must be true — FaceDNeRF bakes RGB directly into
         * vertex color attributes, NOT into texture maps.
         */
        <meshStandardMaterial vertexColors wireframe={wireframe} />
      )}
    </mesh>
  );
}

