"use client";

import { useEffect, useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";

/**
 * Light radius in world units — how far the point light travels
 * from center as the cursor reaches the viewport edge.
 */
const RADIUS_X = 4;
const RADIUS_Y = 3;
/** Fixed Z keeps the light in front of the face at all times. */
const LIGHT_Z = 3;

export function MousePointLight() {
  const lightRef = useRef<THREE.PointLight>(null);
  /**
   * Plain ref instead of state — mutations here are imperatively synced
   * by useFrame every tick, so React re-renders are never triggered.
   */
  const mouse = useRef({ x: 0, y: 0 });
  const { gl, invalidate } = useThree();

  useEffect(() => {
    const canvas = gl.domElement;

    function onPointerMove(e: PointerEvent) {
      const rect = canvas.getBoundingClientRect();
      // Normalize to NDC range [-1, 1]; Y is inverted (positive up in 3D)
      mouse.current.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      mouse.current.y = -(((e.clientY - rect.top) / rect.height) * 2 - 1);
      // frameloop="demand" requires explicit invalidation per interaction
      invalidate();
    }

    canvas.addEventListener("pointermove", onPointerMove);
    return () => canvas.removeEventListener("pointermove", onPointerMove);
  }, [gl.domElement, invalidate]);

  useFrame(() => {
    if (!lightRef.current) return;
    lightRef.current.position.x = mouse.current.x * RADIUS_X;
    lightRef.current.position.y = mouse.current.y * RADIUS_Y;
    lightRef.current.position.z = LIGHT_Z;
  });

  return (
    <pointLight
      ref={lightRef}
      intensity={3}
      distance={12}
      decay={2}
      color='#ffffff'
      castShadow
    />
  );
}

