"use client";

import dynamic from "next/dynamic";
import { useRef } from "react";
import { MeshDownloadActions } from "@/components/mesh-download-actions";
import { MeshStatsPanel } from "@/components/mesh-stats-panel";
import { Spinner } from "@/components/ui/spinner";
import type { MaterialMode } from "@/components/ply-mesh";
import type { MeshSideMode } from "@/lib/mesh-analysis";
import type { CameraSnapshot } from "@/components/scene-canvas";

const SceneCanvas = dynamic(
  () =>
    import("@/components/scene-canvas").then((module) => ({
      default: module.SceneCanvas,
    })),
  {
    ssr: false,
    loading: () => (
      <div className='flex h-full items-center justify-center'>
        <Spinner className='size-8' />
      </div>
    ),
  },
);

interface ModelPanelProps {
  title: string;
  subtitle: string;
  modelUrl: string;
  downloadUrl: string;
  wireframe: boolean;
  materialMode: MaterialMode;
  sideMode?: MeshSideMode;
  flipNormals?: boolean;
  cameraSnapshot?: CameraSnapshot | null;
  onCameraChange?: (snapshot: CameraSnapshot) => void;
  inferenceMs?: number | null;
}

export function ModelPanel({
  title,
  subtitle,
  modelUrl,
  downloadUrl,
  wireframe,
  materialMode,
  sideMode = "double",
  flipNormals = false,
  cameraSnapshot,
  onCameraChange,
  inferenceMs,
}: ModelPanelProps) {
  const panelRef = useRef<HTMLElement>(null);

  return (
    <section
      ref={panelRef}
      className='flex min-h-96 flex-col overflow-hidden rounded-xl bg-card ring-1 ring-foreground/10'
    >
      <div className='flex flex-wrap items-start justify-between gap-3 px-4 py-3'>
        <div>
          <h2 className='text-sm font-medium'>{title}</h2>
          <p className='text-xs text-muted-foreground'>{subtitle}</p>
        </div>
        <MeshDownloadActions
          modelUrl={downloadUrl}
          filenameStem={title.toLowerCase().replaceAll(" ", "-")}
          getCanvas={() => panelRef.current?.querySelector("canvas") ?? null}
        />
      </div>
      <div className='relative min-h-80 flex-1'>
        <SceneCanvas
          modelUrl={modelUrl}
          wireframe={wireframe}
          materialMode={materialMode}
          sideMode={sideMode}
          flipNormals={flipNormals}
          cameraSnapshot={cameraSnapshot}
          onCameraChange={onCameraChange}
        />
      </div>
      <div className='border-t px-4 py-3'>
        <MeshStatsPanel modelUrl={modelUrl} inferenceMs={inferenceMs} />
      </div>
    </section>
  );
}
