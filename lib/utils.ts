import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import * as THREE from 'three';
import { SimplifyModifier } from 'three/examples/jsm/modifiers/SimplifyModifier.js';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function simplifyGeometry(originalGeometry: THREE.BufferGeometry, targetVertexCount: number): THREE.BufferGeometry {
  const currentVertexCount = originalGeometry.attributes.position.count;
  if (currentVertexCount <= targetVertexCount) return originalGeometry;

  const modifier = new SimplifyModifier();
  let geometryToProcess = originalGeometry.clone();
  
  if (geometryToProcess.index !== null) {
    geometryToProcess = geometryToProcess.toNonIndexed();
  }

  const verticesToRemove = currentVertexCount - targetVertexCount;
  const simplifiedGeometry = modifier.modify(geometryToProcess, Math.floor(verticesToRemove));
  simplifiedGeometry.computeVertexNormals();
  
  return simplifiedGeometry;
}