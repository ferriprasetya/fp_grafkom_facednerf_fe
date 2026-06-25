"use client";

import dynamic from "next/dynamic";
import { Spinner } from "@/components/ui/spinner";
import type { MaterialMode } from "@/components/ply-mesh";

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
  originalUrl: string;
  wireframe: boolean;
  materialMode: MaterialMode;
}

export function ModelPanel({
  title,
  subtitle,
  modelUrl,
  originalUrl,
  wireframe,
  materialMode,
}: ModelPanelProps) {
  return (
    <section className='flex min-h-96 flex-col overflow-hidden rounded-xl bg-card ring-1 ring-foreground/10'>
      <div className='flex items-center justify-between px-4 py-3'>
        <div>
          <h2 className='text-sm font-medium'>{title}</h2>
          <p className='text-xs text-muted-foreground'>{subtitle}</p>
        </div>
        <a
          className='text-xs text-muted-foreground hover:text-foreground'
          href={originalUrl}
          download
        >
          Download
        </a>
      </div>
      <div className='relative min-h-80 flex-1'>
        <SceneCanvas
          modelUrl={modelUrl}
          wireframe={wireframe}
          materialMode={materialMode}
        />
      </div>
    </section>
  );
}
