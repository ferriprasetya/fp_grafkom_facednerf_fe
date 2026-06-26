"use client";

import { useEffect, useMemo, type RefObject } from "react";
import { useLoader } from "@react-three/fiber";
import { PLYLoader } from "three/examples/jsm/loaders/PLYLoader.js";
import { Vector3, type Object3D } from "three";
import {
  reverseGeometryWinding,
  sideModeToThreeSide,
  type MeshSideMode,
} from "@/lib/mesh-analysis";

export type MaterialMode = "vertex" | "skin";

interface PLYMeshProps {
  url: string;
  wireframe?: boolean;
  materialMode?: MaterialMode;
  sideMode?: MeshSideMode;
  flipNormals?: boolean;
  rotation?: [number, number, number];
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
  sideMode = "double",
  flipNormals = false,
  rotation = [0, 0, 0],
  meshRef,
}: PLYMeshProps) {
  const rawGeometry = useLoader(PLYLoader, url);

  const geometry = useMemo(() => {
    const preparedGeometry = rawGeometry.clone();
    if (flipNormals) reverseGeometryWinding(preparedGeometry);
    preparedGeometry.computeVertexNormals();
    preparedGeometry.center();
    preparedGeometry.computeBoundingBox();
    const size = preparedGeometry.boundingBox!.getSize(new Vector3());
    const maxDim = Math.max(size.x, size.y, size.z);
    if (maxDim > 0) {
      preparedGeometry.scale(2 / maxDim, 2 / maxDim, 2 / maxDim);
    }
    return preparedGeometry;
  }, [flipNormals, rawGeometry]);

  useEffect(() => () => geometry.dispose(), [geometry]);
  const side = sideModeToThreeSide(sideMode);

  return (
    <mesh ref={meshRef} geometry={geometry} rotation={rotation}>
      {materialMode === "skin" ? (
        /*
         * Classic Phong shading with a neutral skin base color.
         * Demonstrates shading without vertex color data.
         */
        <meshPhongMaterial
          color='#e8b89a'
          specular='#ffffff'
          shininess={30}
          side={side}
          wireframe={wireframe}
        />
      ) : (
        /*
         * vertexColors must be true — FaceDNeRF bakes RGB directly into
         * vertex color attributes, NOT into texture maps.
         */
        <meshStandardMaterial
          vertexColors
          side={side}
          wireframe={wireframe}
        />
      )}
    </mesh>
  );
}

