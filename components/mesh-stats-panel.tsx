"use client";

import { useEffect, useState } from "react";
import {
  analyzeGeometry,
  formatFileSize,
  formatMs,
  loadPlyGeometry,
  type MeshAnalysis,
} from "@/lib/mesh-analysis";
import { getModelFormat } from "@/lib/model-url";

interface MeshStatsPanelProps {
  modelUrl: string | null;
  inferenceMs?: number | null;
}

export function MeshStatsPanel({
  modelUrl,
  inferenceMs,
}: MeshStatsPanelProps) {
  const [stats, setStats] = useState<MeshAnalysis | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setStats(null);
    setError(null);

    if (!modelUrl || getModelFormat(modelUrl) !== "ply") return;

    loadPlyGeometry(modelUrl)
      .then(({ geometry, fileSizeBytes }) => {
        const analysis = analyzeGeometry(geometry, fileSizeBytes);
        geometry.dispose();
        if (!cancelled) setStats(analysis);
      })
      .catch((err) => {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Failed to read mesh");
        }
      });

    return () => {
      cancelled = true;
    };
  }, [modelUrl]);

  if (error) {
    return <p className='text-xs text-destructive'>{error}</p>;
  }

  if (!stats) {
    return (
      <p className='text-xs text-muted-foreground'>
        Mesh stats loading...
      </p>
    );
  }

  return (
    <div className='grid grid-cols-2 gap-2 text-xs'>
      <Stat label='Vertices' value={stats.vertices.toLocaleString()} />
      <Stat label='Faces' value={Math.round(stats.faces).toLocaleString()} />
      <Stat label='File' value={formatFileSize(stats.fileSizeBytes)} />
      <Stat label='Color' value={stats.hasVertexColor ? "Vertex RGB" : "No"} />
      <Stat label='Winding' value={stats.winding} />
      <Stat label='Degenerate' value={stats.degenerateFaces.toLocaleString()} />
      <Stat
        label='Bounds'
        value={`${stats.bounds.x.toFixed(2)} × ${stats.bounds.y.toFixed(2)} × ${stats.bounds.z.toFixed(2)}`}
      />
      <Stat label='Inference' value={formatMs(inferenceMs)} />
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className='rounded-md bg-muted/60 px-2 py-1.5'>
      <p className='font-medium'>{value}</p>
      <p className='text-muted-foreground'>{label}</p>
    </div>
  );
}
