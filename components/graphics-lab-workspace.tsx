"use client";

import { useMemo, useRef, useState } from "react";
import {
  Download,
  FileUp,
  RotateCcw,
  Sparkles,
  Undo2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import {
  GraphicsLabCanvas,
  type GraphicsLabHandle,
} from "@/components/graphics-lab-canvas";
import {
  type MeshStats,
  type RenderMode,
  type SculptTool,
} from "@/lib/graphics-lab";
import { useMeshLibrary } from "@/src/context/mesh-library";

const RENDER_MODES: { value: RenderMode; label: string }[] = [
  { value: "vertex", label: "Vertex" },
  { value: "toon", label: "Toon" },
  { value: "normal", label: "Normal" },
  { value: "depth", label: "Depth" },
  { value: "curvature", label: "Curvature" },
];

const SCULPT_TOOLS: { value: SculptTool; label: string }[] = [
  { value: "select", label: "Select" },
  { value: "grab", label: "Grab" },
  { value: "inflate", label: "Inflate" },
  { value: "deflate", label: "Deflate" },
  { value: "smooth", label: "Smooth" },
];

export function GraphicsLabWorkspace() {
  const { entries, addEntry } = useMeshLibrary();
  const [selectedId, setSelectedId] = useState(entries[0]?.id ?? "");
  const [renderMode, setRenderMode] = useState<RenderMode>("vertex");
  const [sculptTool, setSculptTool] = useState<SculptTool>("select");
  const [brushRadius, setBrushRadius] = useState(0.16);
  const [brushStrength, setBrushStrength] = useState(0.45);
  const [wireframe, setWireframe] = useState(false);
  const [outline, setOutline] = useState(false);
  const [stats, setStats] = useState<MeshStats>({
    vertices: 0,
    faces: 0,
    selected: 0,
  });
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [isDraggingFile, setIsDraggingFile] = useState(false);
  const labRef = useRef<GraphicsLabHandle>(null);

  const selectedEntry = useMemo(
    () => entries.find((entry) => entry.id === selectedId) ?? entries[0],
    [entries, selectedId],
  );

  function addUploadedMesh(file: File | undefined) {
    if (!file) return;
    if (!file.name.toLowerCase().endsWith(".ply")) {
      setUploadError("Only .ply files are supported.");
      return;
    }
    if (file.size > 50 * 1024 * 1024) {
      setUploadError("PLY exceeds the 50 MB browser limit.");
      return;
    }

    setUploadError(null);
    const id = addEntry({
      label: `${file.name} · ${(file.size / 1024 / 1024).toFixed(1)} MB`,
      url: URL.createObjectURL(file),
      source: "upload",
    });
    setSelectedId(id);
  }

  function uploadMesh(event: React.ChangeEvent<HTMLInputElement>) {
    addUploadedMesh(event.target.files?.[0]);
    event.target.value = "";
  }

  return (
    <div className='grid min-h-[calc(100vh-65px)] xl:grid-cols-[340px_1fr]'>
      <aside className='flex max-h-[calc(100vh-65px)] flex-col gap-6 overflow-y-auto border-b p-5 xl:border-r xl:border-b-0'>
        <section className='flex flex-col gap-2'>
          <div>
            <h2 className='text-sm font-medium'>Graphics Lab</h2>
            <p className='text-xs text-muted-foreground'>
              NPR · sculpting · geometry processing
            </p>
          </div>
          <select
            value={selectedEntry?.id ?? ""}
            onChange={(event) => setSelectedId(event.target.value)}
            className='h-9 rounded-md border bg-background px-2 text-sm outline-none focus-visible:ring-3 focus-visible:ring-ring/50'
          >
            {entries.map((entry) => (
              <option key={entry.id} value={entry.id}>
                {entry.label}
              </option>
            ))}
          </select>
          <label
            className={`flex min-h-20 cursor-pointer flex-col items-center justify-center gap-1 rounded-lg border border-dashed px-3 text-center text-sm transition-colors ${
              isDraggingFile ? "bg-muted" : "bg-muted/30 hover:bg-muted/60"
            }`}
            onDragEnter={(event) => {
              event.preventDefault();
              setIsDraggingFile(true);
            }}
            onDragOver={(event) => event.preventDefault()}
            onDragLeave={(event) => {
              event.preventDefault();
              setIsDraggingFile(false);
            }}
            onDrop={(event) => {
              event.preventDefault();
              setIsDraggingFile(false);
              addUploadedMesh(event.dataTransfer.files[0]);
            }}
          >
            <input
              type='file'
              accept='.ply'
              className='hidden'
              onChange={uploadMesh}
            />
            <FileUp className='size-5 text-muted-foreground' />
            <span>Drop PLY or click to browse</span>
            <span className='text-xs text-muted-foreground'>Maximum 50 MB</span>
          </label>
          {uploadError && (
            <p className='text-xs text-destructive'>{uploadError}</p>
          )}
        </section>

        <section className='flex flex-col gap-2'>
          <p className='text-xs font-medium uppercase tracking-wider text-muted-foreground'>
            NPR rendering
          </p>
          <div className='grid grid-cols-3 gap-1.5'>
            {RENDER_MODES.map((mode) => (
              <Button
                key={mode.value}
                size='sm'
                variant={renderMode === mode.value ? "default" : "outline"}
                onClick={() => setRenderMode(mode.value)}
              >
                {mode.label}
              </Button>
            ))}
            <Button
              size='sm'
              variant={wireframe ? "default" : "outline"}
              onClick={() => setWireframe((value) => !value)}
            >
              Wireframe
            </Button>
            <Button
              size='sm'
              variant={outline ? "default" : "outline"}
              onClick={() => setOutline((value) => !value)}
            >
              Outline
            </Button>
          </div>
        </section>

        <section className='flex flex-col gap-3'>
          <p className='text-xs font-medium uppercase tracking-wider text-muted-foreground'>
            Vertex brush
          </p>
          <div className='grid grid-cols-3 gap-1.5'>
            {SCULPT_TOOLS.map((tool) => (
              <Button
                key={tool.value}
                size='sm'
                variant={sculptTool === tool.value ? "default" : "outline"}
                onClick={() => setSculptTool(tool.value)}
              >
                {tool.label}
              </Button>
            ))}
          </div>

          <div className='flex flex-col gap-2'>
            <div className='flex justify-between text-xs'>
              <span>Radius</span>
              <span className='text-muted-foreground'>
                {brushRadius.toFixed(2)}
              </span>
            </div>
            <Slider
              aria-label='Brush radius'
              value={brushRadius}
              min={0.04}
              max={0.35}
              step={0.01}
              onValueChange={setBrushRadius}
            />
          </div>

          <div className='flex flex-col gap-2'>
            <div className='flex justify-between text-xs'>
              <span>Strength</span>
              <span className='text-muted-foreground'>
                {brushStrength.toFixed(2)}
              </span>
            </div>
            <Slider
              aria-label='Brush strength'
              value={brushStrength}
              min={0.05}
              max={1}
              step={0.05}
              onValueChange={setBrushStrength}
            />
          </div>
        </section>

        <section className='flex flex-col gap-2'>
          <p className='text-xs font-medium uppercase tracking-wider text-muted-foreground'>
            Geometry processing
          </p>
          <div className='grid grid-cols-2 gap-1.5'>
            <Button
              size='sm'
              variant='outline'
              onClick={() => labRef.current?.smoothGlobal()}
            >
              Global smooth
            </Button>
            <Button
              size='sm'
              variant='outline'
              onClick={() => labRef.current?.addNoise()}
            >
              <Sparkles />
              Displace
            </Button>
            <Button
              size='sm'
              variant='outline'
              onClick={() => labRef.current?.reduceMesh()}
            >
              Reduce 20%
            </Button>
            <Button
              size='sm'
              variant='outline'
              onClick={() => labRef.current?.recomputeNormals()}
            >
              Recompute normals
            </Button>
          </div>
        </section>

        <section className='grid grid-cols-3 gap-2 text-center text-xs'>
          <div>
            <p className='font-medium'>{stats.vertices.toLocaleString()}</p>
            <p className='text-muted-foreground'>Vertices</p>
          </div>
          <div>
            <p className='font-medium'>{Math.round(stats.faces).toLocaleString()}</p>
            <p className='text-muted-foreground'>Faces</p>
          </div>
          <div>
            <p className='font-medium'>{stats.selected.toLocaleString()}</p>
            <p className='text-muted-foreground'>Selected</p>
          </div>
        </section>

        <div className='grid grid-cols-3 gap-1.5'>
          <Button
            size='sm'
            variant='outline'
            onClick={() => labRef.current?.undo()}
          >
            <Undo2 />
            Undo
          </Button>
          <Button
            size='sm'
            variant='outline'
            onClick={() => labRef.current?.reset()}
          >
            <RotateCcw />
            Reset
          </Button>
          <Button size='sm' onClick={() => labRef.current?.exportPly()}>
            <Download />
            Export
          </Button>
        </div>

        <p className='text-xs leading-relaxed text-muted-foreground'>
          Select mode keeps orbit controls active. Sculpt modes lock orbit while
          dragging the brush.
        </p>
      </aside>

      <section className='relative min-h-[640px] bg-muted/20'>
        {selectedEntry ? (
          <GraphicsLabCanvas
            ref={labRef}
            key={selectedEntry.id}
            modelUrl={selectedEntry.url}
            renderMode={renderMode}
            sculptTool={sculptTool}
            brushRadius={brushRadius}
            brushStrength={brushStrength}
            wireframe={wireframe}
            outline={outline}
            onStatsChange={setStats}
          />
        ) : (
          <div className='flex h-full items-center justify-center text-sm text-muted-foreground'>
            Add a PLY mesh to begin
          </div>
        )}
      </section>
    </div>
  );
}
