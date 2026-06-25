"use client";

import {
  forwardRef,
  Suspense,
  useEffect,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  Canvas,
  type ThreeEvent,
  useLoader,
  useThree,
} from "@react-three/fiber";
import {
  Edges,
  OrbitControls,
  PerspectiveCamera,
  useProgress,
} from "@react-three/drei";
import {
  DoubleSide,
  BufferAttribute,
  BufferGeometry,
  Color,
  Float32BufferAttribute,
  Mesh,
  Quaternion,
  Vector3,
} from "three";
import { PLYLoader } from "three/examples/jsm/loaders/PLYLoader.js";
import { CanvasErrorBoundary } from "@/components/canvas-error-boundary";
import {
  buildAdjacency,
  curvatureColors,
  smoothVertices,
  VertexSpatialHash,
  type MeshStats,
  type RenderMode,
  type SculptTool,
} from "@/lib/graphics-lab";

export interface GraphicsLabHandle {
  undo: () => void;
  reset: () => void;
  smoothGlobal: () => void;
  addNoise: () => void;
  recomputeNormals: () => void;
  exportPly: () => void;
}

interface GraphicsLabCanvasProps {
  modelUrl: string;
  renderMode: RenderMode;
  sculptTool: SculptTool;
  brushRadius: number;
  brushStrength: number;
  wireframe: boolean;
  outline: boolean;
  onStatsChange: (stats: MeshStats) => void;
}

type EditableMeshProps = GraphicsLabCanvasProps;

function prepareGeometry(rawGeometry: BufferGeometry) {
  const geometry = rawGeometry.clone();
  geometry.computeVertexNormals();
  geometry.center();
  geometry.computeBoundingBox();
  const size = geometry.boundingBox!.getSize(new Vector3());
  const maxDimension = Math.max(size.x, size.y, size.z);
  if (maxDimension > 0) {
    geometry.scale(2 / maxDimension, 2 / maxDimension, 2 / maxDimension);
  }
  geometry.computeBoundingSphere();
  return geometry;
}

const EditableMesh = forwardRef<GraphicsLabHandle, EditableMeshProps>(
  function EditableMesh(
    {
      modelUrl,
      renderMode,
      sculptTool,
      brushRadius,
      brushStrength,
      wireframe,
      outline,
      onStatsChange,
    },
    forwardedRef,
  ) {
    const rawGeometry = useLoader(PLYLoader, modelUrl);
    const initialGeometry = useMemo(
      () => prepareGeometry(rawGeometry),
      [rawGeometry],
    );
    const geometryRef = useRef(initialGeometry.clone());
    const originalColorsRef = useRef<BufferAttribute | null>(
      initialGeometry.getAttribute("color")?.clone() ?? null,
    );
    const historyRef = useRef<BufferGeometry[]>([]);
    const spatialHashRef = useRef<VertexSpatialHash | null>(null);
    const adjacencyRef = useRef<Set<number>[]>([]);
    const meshRef = useRef<Mesh>(null);
    const brushRef = useRef<Mesh>(null);
    const selectionGeometryRef = useRef<BufferGeometry>(null);
    const draggingRef = useRef(false);
    const previousPointRef = useRef(new Vector3());
    const selectedRef = useRef<number[]>([]);
    const selectedCountRef = useRef(0);
    const [revision, setRevision] = useState(0);
    const { invalidate } = useThree();

    const rebuildCaches = () => {
      const geometry = geometryRef.current;
      spatialHashRef.current = new VertexSpatialHash(
        geometry.getAttribute("position"),
      );
      adjacencyRef.current = buildAdjacency(geometry);
      onStatsChange({
        vertices: geometry.getAttribute("position").count,
        faces: geometry.getIndex()
          ? geometry.getIndex()!.count / 3
          : geometry.getAttribute("position").count / 3,
        selected: selectedRef.current.length,
      });
    };

    const replaceGeometry = (geometry: BufferGeometry) => {
      geometryRef.current.dispose();
      geometryRef.current = geometry;
      originalColorsRef.current =
        geometry.getAttribute("color")?.clone() ?? null;
      selectedRef.current = [];
      selectedCountRef.current = 0;
      rebuildCaches();
      setRevision((value) => value + 1);
      invalidate();
    };

    const pushHistory = () => {
      const snapshot = geometryRef.current.clone();
      if (originalColorsRef.current) {
        snapshot.setAttribute("color", originalColorsRef.current.clone());
      }
      historyRef.current.push(snapshot);
      if (historyRef.current.length > 8) {
        historyRef.current.shift()?.dispose();
      }
    };

    const finishGeometryUpdate = () => {
      const geometry = geometryRef.current;
      geometry.computeVertexNormals();
      geometry.computeBoundingSphere();
      rebuildCaches();
      if (renderMode === "curvature") {
        geometry.setAttribute(
          "color",
          curvatureColors(geometry, adjacencyRef.current),
        );
        geometry.getAttribute("color").needsUpdate = true;
      }
      setRevision((value) => value + 1);
      invalidate();
    };

    useEffect(() => {
      replaceGeometry(initialGeometry.clone());
      historyRef.current.forEach((geometry) => geometry.dispose());
      historyRef.current = [];
      return () => {
        geometryRef.current.dispose();
        historyRef.current.forEach((geometry) => geometry.dispose());
        initialGeometry.dispose();
      };
      // replaceGeometry intentionally follows source changes only.
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [initialGeometry]);

    useEffect(() => {
      const geometry = geometryRef.current;
      if (renderMode === "curvature") {
        geometry.setAttribute(
          "color",
          curvatureColors(geometry, adjacencyRef.current),
        );
      } else if (originalColorsRef.current) {
        geometry.setAttribute("color", originalColorsRef.current.clone());
      }
      geometry.getAttribute("color") &&
        (geometry.getAttribute("color").needsUpdate = true);
      invalidate();
    }, [invalidate, renderMode, revision]);

    useImperativeHandle(
      forwardedRef,
      () => ({
        undo() {
          const previous = historyRef.current.pop();
          if (previous) replaceGeometry(previous);
        },
        reset() {
          pushHistory();
          replaceGeometry(initialGeometry.clone());
        },
        smoothGlobal() {
          pushHistory();
          const indices = Array.from(
            { length: geometryRef.current.getAttribute("position").count },
            (_, index) => index,
          );
          smoothVertices(
            geometryRef.current,
            adjacencyRef.current,
            indices,
            0.25,
          );
          finishGeometryUpdate();
        },
        addNoise() {
          pushHistory();
          const geometry = geometryRef.current;
          geometry.computeVertexNormals();
          const position = geometry.getAttribute("position");
          const normal = geometry.getAttribute("normal");
          for (let index = 0; index < position.count; index += 1) {
            const amount = (Math.random() - 0.5) * 0.012;
            position.setXYZ(
              index,
              position.getX(index) + normal.getX(index) * amount,
              position.getY(index) + normal.getY(index) * amount,
              position.getZ(index) + normal.getZ(index) * amount,
            );
          }
          position.needsUpdate = true;
          finishGeometryUpdate();
        },
        recomputeNormals() {
          geometryRef.current.computeVertexNormals();
          geometryRef.current.getAttribute("normal").needsUpdate = true;
          invalidate();
        },
        exportPly() {
          void import("three/examples/jsm/exporters/PLYExporter.js").then(
            ({ PLYExporter }) => {
              const exporter = new PLYExporter();
              const result = exporter.parse(
                new Mesh(geometryRef.current),
                () => undefined,
                { binary: true, littleEndian: true },
              );
              if (!result) return;
              const blob = new Blob([result as ArrayBuffer], {
                type: "application/octet-stream",
              });
              const url = URL.createObjectURL(blob);
              const anchor = document.createElement("a");
              anchor.href = url;
              anchor.download = "graphics-lab-edited.ply";
              anchor.click();
              URL.revokeObjectURL(url);
            },
          );
        },
      }),
      // Methods read current values from refs.
      // eslint-disable-next-line react-hooks/exhaustive-deps
      [initialGeometry, invalidate, renderMode],
    );

    const updateBrush = (event: ThreeEvent<PointerEvent>) => {
      if (!brushRef.current || !meshRef.current) return;
      const point = meshRef.current.worldToLocal(event.point.clone());
      const normal = event.face?.normal.clone() ?? new Vector3(0, 0, 1);
      brushRef.current.position.copy(point);
      brushRef.current.quaternion.copy(
        new Quaternion().setFromUnitVectors(new Vector3(0, 0, 1), normal),
      );
      brushRef.current.scale.setScalar(brushRadius);
      brushRef.current.visible = true;

      const selected =
        spatialHashRef.current?.query(point, brushRadius) ?? [];
      selectedRef.current = selected;
      if (selectionGeometryRef.current) {
        const position = geometryRef.current.getAttribute("position");
        const selectedPositions = new Float32Array(selected.length * 3);
        for (let offset = 0; offset < selected.length; offset += 1) {
          const index = selected[offset];
          selectedPositions[offset * 3] = position.getX(index);
          selectedPositions[offset * 3 + 1] = position.getY(index);
          selectedPositions[offset * 3 + 2] = position.getZ(index);
        }
        selectionGeometryRef.current.setAttribute(
          "position",
          new Float32BufferAttribute(selectedPositions, 3),
        );
        selectionGeometryRef.current.computeBoundingSphere();
      }
      if (selectedCountRef.current !== selected.length) {
        selectedCountRef.current = selected.length;
        onStatsChange({
          vertices: geometryRef.current.getAttribute("position").count,
          faces: geometryRef.current.getIndex()
            ? geometryRef.current.getIndex()!.count / 3
            : geometryRef.current.getAttribute("position").count / 3,
          selected: selected.length,
        });
      }
      return { point, normal, selected };
    };

    const applyBrush = (
      point: Vector3,
      normal: Vector3,
      selected: number[],
    ) => {
      const geometry = geometryRef.current;
      const position = geometry.getAttribute("position");
      const vertexNormal = geometry.getAttribute("normal");

      if (sculptTool === "smooth") {
        smoothVertices(
          geometry,
          adjacencyRef.current,
          selected,
          brushStrength * 0.2,
        );
      } else {
        const dragDelta = point.clone().sub(previousPointRef.current);
        for (const index of selected) {
          const vertex = new Vector3(
            position.getX(index),
            position.getY(index),
            position.getZ(index),
          );
          const distance = vertex.distanceTo(point);
          const falloff = Math.max(0, 1 - distance / brushRadius) ** 2;
          if (sculptTool === "grab") {
            vertex.addScaledVector(dragDelta, falloff);
          } else {
            const direction = sculptTool === "deflate" ? -1 : 1;
            vertex.x +=
              vertexNormal.getX(index) *
              brushStrength *
              0.015 *
              falloff *
              direction;
            vertex.y +=
              vertexNormal.getY(index) *
              brushStrength *
              0.015 *
              falloff *
              direction;
            vertex.z +=
              vertexNormal.getZ(index) *
              brushStrength *
              0.015 *
              falloff *
              direction;
          }
          position.setXYZ(index, vertex.x, vertex.y, vertex.z);
        }
        position.needsUpdate = true;
      }
      previousPointRef.current.copy(point);
      geometry.computeVertexNormals();
      geometry.computeBoundingSphere();
      invalidate();
    };

    const vertexColors = geometryRef.current.hasAttribute("color");
    const material =
      renderMode === "toon" ? (
        <meshToonMaterial vertexColors={vertexColors} wireframe={wireframe} />
      ) : renderMode === "normal" ? (
        <meshNormalMaterial wireframe={wireframe} />
      ) : renderMode === "depth" ? (
        <meshDepthMaterial wireframe={wireframe} />
      ) : renderMode === "curvature" ? (
        <meshBasicMaterial vertexColors wireframe={wireframe} />
      ) : (
        <meshStandardMaterial
          vertexColors={vertexColors}
          wireframe={wireframe}
          roughness={0.75}
        />
      );

    return (
      <group key={revision} dispose={null}>
        <mesh
          ref={meshRef}
          geometry={geometryRef.current}
          onPointerMove={(event) => {
            event.stopPropagation();
            const brush = updateBrush(event);
            if (
              draggingRef.current &&
              brush &&
              sculptTool !== "select"
            ) {
              applyBrush(brush.point, brush.normal, brush.selected);
            }
          }}
          onPointerDown={(event) => {
            event.stopPropagation();
            const brush = updateBrush(event);
            if (!brush) return;
            previousPointRef.current.copy(brush.point);
            if (sculptTool !== "select") {
              pushHistory();
              draggingRef.current = true;
              (event.target as Element).setPointerCapture?.(event.pointerId);
            }
          }}
          onPointerUp={(event) => {
            event.stopPropagation();
            if (draggingRef.current) finishGeometryUpdate();
            draggingRef.current = false;
            (event.target as Element).releasePointerCapture?.(event.pointerId);
          }}
          onPointerOut={() => {
            if (!draggingRef.current && brushRef.current) {
              brushRef.current.visible = false;
              selectedRef.current = [];
              selectedCountRef.current = 0;
              selectionGeometryRef.current?.deleteAttribute("position");
              onStatsChange({
                vertices: geometryRef.current.getAttribute("position").count,
                faces: geometryRef.current.getIndex()
                  ? geometryRef.current.getIndex()!.count / 3
                  : geometryRef.current.getAttribute("position").count / 3,
                selected: 0,
              });
              invalidate();
            }
          }}
        >
          {material}
          {outline && <Edges threshold={18} color='#ffffff' />}
        </mesh>

        <mesh ref={brushRef} visible={false}>
          <ringGeometry args={[0.92, 1, 64]} />
          <meshBasicMaterial
            color='#ffffff'
            side={DoubleSide}
            transparent
            opacity={0.9}
            depthTest={false}
          />
        </mesh>

        <points>
          <bufferGeometry ref={selectionGeometryRef} />
          <pointsMaterial
            color='#ffffff'
            size={0.018}
            sizeAttenuation
            depthTest={false}
          />
        </points>
      </group>
    );
  },
);

export const GraphicsLabCanvas = forwardRef<
  GraphicsLabHandle,
  GraphicsLabCanvasProps
>(function GraphicsLabCanvas(props, ref) {
  const sculpting = props.sculptTool !== "select";
  const { active, progress } = useProgress();

  return (
    <div className='absolute inset-0'>
      <CanvasErrorBoundary>
        <Canvas
          dpr={[1, 1.5]}
          frameloop='demand'
          gl={{
            antialias: true,
            alpha: true,
            powerPreference: "high-performance",
          }}
        >
          <PerspectiveCamera makeDefault fov={45} position={[0, 0, 4]} />
          <color attach='background' args={[new Color("#171923")]} />
          <ambientLight intensity={1.4} />
          <directionalLight position={[4, 6, 5]} intensity={1.2} />
          <OrbitControls
            makeDefault
            enabled={!sculpting}
            enableDamping
            dampingFactor={0.08}
          />
          <Suspense fallback={null}>
          <EditableMesh {...props} ref={ref} />
          </Suspense>
        </Canvas>
      </CanvasErrorBoundary>
      {active && (
        <div className='pointer-events-none absolute inset-0 flex items-center justify-center bg-background/60 text-sm text-muted-foreground backdrop-blur-sm'>
          Loading mesh {Math.round(progress)}%
        </div>
      )}
    </div>
  );
});
