"use client";

import { useMemo } from "react";
import { useLoader } from "@react-three/fiber";
import { PLYLoader } from "three/examples/jsm/loaders/PLYLoader.js";

interface PLYMeshProps {
  url: string;
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
export function PLYMesh({ url }: PLYMeshProps) {
  const rawGeometry = useLoader(PLYLoader, url);

  const geometry = useMemo(() => {
    rawGeometry.computeVertexNormals();
    return rawGeometry;
  }, [rawGeometry]);

  return (
    <mesh geometry={geometry} castShadow receiveShadow>
      {/*
       * vertexColors must be true — FaceDNeRF bakes RGB directly into
       * vertex color attributes, NOT into texture maps.
       */}
      <meshStandardMaterial vertexColors />
    </mesh>
  );
}

