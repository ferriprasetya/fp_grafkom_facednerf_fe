import {
  BackSide,
  BufferAttribute,
  BufferGeometry,
  Box3,
  DoubleSide,
  FrontSide,
  Vector3,
  type Side,
} from "three";
import { PLYLoader } from "three/examples/jsm/loaders/PLYLoader.js";

export type MeshSideMode = "double" | "front" | "back";

export interface MeshAnalysis {
  vertices: number;
  faces: number;
  fileSizeBytes?: number;
  hasVertexColor: boolean;
  degenerateFaces: number;
  signedVolume: number;
  winding: "outward" | "inward" | "open/flat";
  bounds: {
    x: number;
    y: number;
    z: number;
  };
}

export function sideModeToThreeSide(mode: MeshSideMode): Side {
  if (mode === "front") return FrontSide;
  if (mode === "back") return BackSide;
  return DoubleSide;
}

export function formatFileSize(bytes?: number) {
  if (!bytes) return "—";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

export function formatMs(ms?: number | null) {
  if (ms == null) return "—";
  if (ms < 1000) return `${ms} ms`;
  return `${(ms / 1000).toFixed(2)} s`;
}

export async function loadPlyGeometry(url: string) {
  const response = await fetch(url, { cache: "force-cache" });
  if (!response.ok) {
    throw new Error(`Failed to load mesh (${response.status})`);
  }
  const buffer = await response.arrayBuffer();
  const geometry = new PLYLoader().parse(buffer);
  return { geometry, fileSizeBytes: buffer.byteLength };
}

export function reverseGeometryWinding(geometry: BufferGeometry) {
  const index = geometry.getIndex();
  if (index) {
    for (let offset = 0; offset < index.count; offset += 3) {
      const b = index.getX(offset + 1);
      const c = index.getX(offset + 2);
      index.setX(offset + 1, c);
      index.setX(offset + 2, b);
    }
    index.needsUpdate = true;
  } else {
    for (const attribute of Object.values(geometry.attributes)) {
      if (!(attribute instanceof BufferAttribute)) continue;
      for (let offset = 0; offset < attribute.count; offset += 3) {
        swapAttributeItems(attribute, offset + 1, offset + 2);
      }
      attribute.needsUpdate = true;
    }
  }
  geometry.computeVertexNormals();
  geometry.computeBoundingSphere();
}

export function analyzeGeometry(
  geometry: BufferGeometry,
  fileSizeBytes?: number,
): MeshAnalysis {
  const position = geometry.getAttribute("position");
  const index = geometry.getIndex();
  const faces = index ? index.count / 3 : position.count / 3;
  const a = new Vector3();
  const b = new Vector3();
  const c = new Vector3();
  const ab = new Vector3();
  const ac = new Vector3();
  let degenerateFaces = 0;
  let signedVolume = 0;

  for (let face = 0; face < faces; face += 1) {
    const offset = face * 3;
    readVertex(geometry, index ? index.getX(offset) : offset, a);
    readVertex(geometry, index ? index.getX(offset + 1) : offset + 1, b);
    readVertex(geometry, index ? index.getX(offset + 2) : offset + 2, c);
    ab.subVectors(b, a);
    ac.subVectors(c, a);
    if (ab.cross(ac).lengthSq() < 1e-18) degenerateFaces += 1;
    signedVolume += a.dot(b.clone().cross(c)) / 6;
  }

  geometry.computeBoundingBox();
  const box = geometry.boundingBox ?? new Box3();
  const size = box.getSize(new Vector3());
  const absVolume = Math.abs(signedVolume);

  return {
    vertices: position.count,
    faces,
    fileSizeBytes,
    hasVertexColor: geometry.hasAttribute("color"),
    degenerateFaces,
    signedVolume,
    winding:
      absVolume < 1e-8 ? "open/flat" : signedVolume < 0 ? "inward" : "outward",
    bounds: {
      x: size.x,
      y: size.y,
      z: size.z,
    },
  };
}

function readVertex(
  geometry: BufferGeometry,
  index: number,
  target: Vector3,
) {
  const position = geometry.getAttribute("position");
  target.set(position.getX(index), position.getY(index), position.getZ(index));
}

function swapAttributeItems(
  attribute: BufferAttribute,
  left: number,
  right: number,
) {
  const itemSize = attribute.itemSize;
  for (let component = 0; component < itemSize; component += 1) {
    const leftValue = attribute.getComponent(left, component);
    attribute.setComponent(left, component, attribute.getComponent(right, component));
    attribute.setComponent(right, component, leftValue);
  }
}
