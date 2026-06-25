import {
  BufferAttribute,
  BufferGeometry,
  Color,
  Float32BufferAttribute,
  Vector3,
  type InterleavedBufferAttribute,
} from "three";

export type RenderMode =
  | "vertex"
  | "toon"
  | "normal"
  | "depth"
  | "curvature";

export type SculptTool = "select" | "grab" | "inflate" | "deflate" | "smooth";

export interface MeshStats {
  vertices: number;
  faces: number;
  selected: number;
}

export class VertexSpatialHash {
  private readonly cells = new Map<string, number[]>();

  constructor(
    private readonly position: BufferAttribute | InterleavedBufferAttribute,
    private readonly cellSize = 0.08,
  ) {
    for (let index = 0; index < position.count; index += 1) {
      const key = this.key(
        position.getX(index),
        position.getY(index),
        position.getZ(index),
      );
      const cell = this.cells.get(key);
      if (cell) cell.push(index);
      else this.cells.set(key, [index]);
    }
  }

  query(center: Vector3, radius: number) {
    const result: number[] = [];
    const range = Math.ceil(radius / this.cellSize);
    const baseX = Math.floor(center.x / this.cellSize);
    const baseY = Math.floor(center.y / this.cellSize);
    const baseZ = Math.floor(center.z / this.cellSize);
    const radiusSquared = radius * radius;

    for (let x = -range; x <= range; x += 1) {
      for (let y = -range; y <= range; y += 1) {
        for (let z = -range; z <= range; z += 1) {
          const cell = this.cells.get(
            `${baseX + x},${baseY + y},${baseZ + z}`,
          );
          if (!cell) continue;
          for (const index of cell) {
            const dx = this.position.getX(index) - center.x;
            const dy = this.position.getY(index) - center.y;
            const dz = this.position.getZ(index) - center.z;
            if (dx * dx + dy * dy + dz * dz <= radiusSquared) {
              result.push(index);
            }
          }
        }
      }
    }
    return result;
  }

  private key(x: number, y: number, z: number) {
    return `${Math.floor(x / this.cellSize)},${Math.floor(y / this.cellSize)},${Math.floor(z / this.cellSize)}`;
  }
}

export function buildAdjacency(geometry: BufferGeometry) {
  const position = geometry.getAttribute("position");
  const index = geometry.getIndex();
  const adjacency = Array.from(
    { length: position.count },
    () => new Set<number>(),
  );
  const triangleCount = index ? index.count / 3 : position.count / 3;

  for (let triangle = 0; triangle < triangleCount; triangle += 1) {
    const offset = triangle * 3;
    const a = index ? index.getX(offset) : offset;
    const b = index ? index.getX(offset + 1) : offset + 1;
    const c = index ? index.getX(offset + 2) : offset + 2;
    adjacency[a].add(b).add(c);
    adjacency[b].add(a).add(c);
    adjacency[c].add(a).add(b);
  }
  return adjacency;
}

export function curvatureColors(
  geometry: BufferGeometry,
  adjacency: Set<number>[],
) {
  geometry.computeVertexNormals();
  const normal = geometry.getAttribute("normal");
  const values = new Float32Array(normal.count);
  let maximum = 0;

  for (let index = 0; index < normal.count; index += 1) {
    const neighbors = adjacency[index];
    if (!neighbors?.size) continue;
    let value = 0;
    for (const neighbor of neighbors) {
      const dot =
        normal.getX(index) * normal.getX(neighbor) +
        normal.getY(index) * normal.getY(neighbor) +
        normal.getZ(index) * normal.getZ(neighbor);
      value += 1 - Math.max(-1, Math.min(1, dot));
    }
    values[index] = value / neighbors.size;
    maximum = Math.max(maximum, values[index]);
  }

  const colors = new Float32Array(normal.count * 3);
  const color = new Color();
  for (let index = 0; index < values.length; index += 1) {
    const normalized =
      maximum > 0 ? Math.min(1, (values[index] / maximum) * 2.5) : 0;
    color.setHSL((1 - normalized) * 0.66, 1, 0.5);
    colors[index * 3] = color.r;
    colors[index * 3 + 1] = color.g;
    colors[index * 3 + 2] = color.b;
  }
  return new Float32BufferAttribute(colors, 3);
}

export function smoothVertices(
  geometry: BufferGeometry,
  adjacency: Set<number>[],
  indices: Iterable<number>,
  strength: number,
) {
  const position = geometry.getAttribute("position");
  const next = new Map<number, Vector3>();

  for (const index of indices) {
    const neighbors = adjacency[index];
    if (!neighbors?.size) continue;
    const average = new Vector3();
    for (const neighbor of neighbors) {
      average.x += position.getX(neighbor);
      average.y += position.getY(neighbor);
      average.z += position.getZ(neighbor);
    }
    average.divideScalar(neighbors.size);
    const current = new Vector3(
      position.getX(index),
      position.getY(index),
      position.getZ(index),
    );
    next.set(index, current.lerp(average, strength));
  }

  for (const [index, value] of next) {
    position.setXYZ(index, value.x, value.y, value.z);
  }
  position.needsUpdate = true;
}
