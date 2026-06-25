import fs from "node:fs";
import path from "node:path";
import {
  BufferGeometry,
  Float32BufferAttribute,
  Mesh,
  Uint32BufferAttribute,
  Vector3,
} from "three";
import { PLYExporter } from "three/examples/jsm/exporters/PLYExporter.js";
import { PLYLoader } from "three/examples/jsm/loaders/PLYLoader.js";

const root = process.cwd();
const targetVertexCount = Number(process.argv[2] ?? 15000);
const subjects = ["subject-1", "subject-2"];
const methods = ["facednerf", "triposr"];

function clusterGeometry(source, cellSize) {
  const position = source.getAttribute("position");
  const color = source.getAttribute("color");
  const index = source.getIndex();
  const clusters = new Map();
  const remap = new Uint32Array(position.count);

  for (let vertexIndex = 0; vertexIndex < position.count; vertexIndex += 1) {
    const x = position.getX(vertexIndex);
    const y = position.getY(vertexIndex);
    const z = position.getZ(vertexIndex);
    const key = `${Math.floor(x / cellSize)},${Math.floor(y / cellSize)},${Math.floor(z / cellSize)}`;
    let cluster = clusters.get(key);

    if (!cluster) {
      cluster = {
        id: clusters.size,
        count: 0,
        x: 0,
        y: 0,
        z: 0,
        r: 0,
        g: 0,
        b: 0,
      };
      clusters.set(key, cluster);
    }

    cluster.count += 1;
    cluster.x += x;
    cluster.y += y;
    cluster.z += z;
    if (color) {
      cluster.r += color.getX(vertexIndex);
      cluster.g += color.getY(vertexIndex);
      cluster.b += color.getZ(vertexIndex);
    }
    remap[vertexIndex] = cluster.id;
  }

  const positions = new Float32Array(clusters.size * 3);
  const colors = color ? new Float32Array(clusters.size * 3) : null;

  for (const cluster of clusters.values()) {
    const offset = cluster.id * 3;
    positions[offset] = cluster.x / cluster.count;
    positions[offset + 1] = cluster.y / cluster.count;
    positions[offset + 2] = cluster.z / cluster.count;
    if (colors) {
      colors[offset] = cluster.r / cluster.count;
      colors[offset + 1] = cluster.g / cluster.count;
      colors[offset + 2] = cluster.b / cluster.count;
    }
  }

  const sourceIndices = index?.array;
  const triangleCount = index ? index.count / 3 : position.count / 3;
  const faces = [];

  for (let triangle = 0; triangle < triangleCount; triangle += 1) {
    const offset = triangle * 3;
    const a = remap[sourceIndices ? sourceIndices[offset] : offset];
    const b = remap[sourceIndices ? sourceIndices[offset + 1] : offset + 1];
    const c = remap[sourceIndices ? sourceIndices[offset + 2] : offset + 2];
    if (a !== b && b !== c && c !== a) faces.push(a, b, c);
  }

  const geometry = new BufferGeometry();
  geometry.setAttribute("position", new Float32BufferAttribute(positions, 3));
  if (colors) {
    geometry.setAttribute("color", new Float32BufferAttribute(colors, 3));
  }
  geometry.setIndex(new Uint32BufferAttribute(faces, 1));
  geometry.computeVertexNormals();
  geometry.computeBoundingSphere();
  return geometry;
}

function optimizeGeometry(source) {
  source.computeBoundingBox();
  const size = source.boundingBox.getSize(new Vector3());
  const maxDimension = Math.max(size.x, size.y, size.z);
  let low = maxDimension / 4096;
  let high = maxDimension;
  let best = source;

  for (let iteration = 0; iteration < 18; iteration += 1) {
    const cellSize = (low + high) / 2;
    const candidate = clusterGeometry(source, cellSize);
    const count = candidate.getAttribute("position").count;

    if (
      Math.abs(count - targetVertexCount) <
      Math.abs(best.getAttribute("position").count - targetVertexCount)
    ) {
      best = candidate;
    }

    if (count > targetVertexCount) low = cellSize;
    else high = cellSize;
  }

  return best;
}

const loader = new PLYLoader();
const exporter = new PLYExporter();

for (const subject of subjects) {
  for (const method of methods) {
    const originalPath = path.join(
      root,
      "public",
      "comparison-original",
      subject,
      `${method}.ply`,
    );
    const outputPath = path.join(
      root,
      "public",
      "comparison",
      subject,
      `${method}.ply`,
    );

    const file = fs.readFileSync(originalPath);
    const source = loader.parse(
      file.buffer.slice(file.byteOffset, file.byteOffset + file.byteLength),
    );
    const optimized = optimizeGeometry(source);
    const result = exporter.parse(new Mesh(optimized), undefined, {
      binary: true,
      littleEndian: true,
    });
    fs.writeFileSync(outputPath, Buffer.from(result));

    console.log(
      `${subject}/${method}: ${source.getAttribute("position").count} -> ${optimized.getAttribute("position").count} vertices, ${Math.round(fs.statSync(outputPath).size / 1024)} KiB`,
    );
  }
}
