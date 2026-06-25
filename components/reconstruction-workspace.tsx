"use client";

import dynamic from "next/dynamic";
import { useState } from "react";
import { Spinner } from "@/components/ui/spinner";
import { Button } from "@/components/ui/button";
import { MeshLibraryProvider } from "@/src/context/mesh-library";

type WorkspaceMode = "comparison" | "inference" | "lab";

function WorkspaceLoading() {
  return (
    <div className='flex min-h-[calc(100vh-65px)] items-center justify-center'>
      <Spinner className='size-8' />
    </div>
  );
}

const ComparisonWorkspace = dynamic(
  () =>
    import("@/components/comparison-workspace").then((module) => ({
      default: module.ComparisonWorkspace,
    })),
  { loading: WorkspaceLoading },
);

const TripoSRWorkspace = dynamic(
  () =>
    import("@/components/triposr-workspace").then((module) => ({
      default: module.TripoSRWorkspace,
    })),
  { loading: WorkspaceLoading },
);

const GraphicsLabWorkspace = dynamic(
  () =>
    import("@/components/graphics-lab-workspace").then((module) => ({
      default: module.GraphicsLabWorkspace,
    })),
  { loading: WorkspaceLoading },
);

export function ReconstructionWorkspace() {
  const [mode, setMode] = useState<WorkspaceMode>("comparison");

  return (
    <MeshLibraryProvider>
    <div className='flex min-h-screen flex-col bg-background'>
      <header className='flex flex-wrap items-center justify-between gap-4 border-b px-5 py-3'>
        <div>
          <h1 className='text-base font-semibold'>3D Face Reconstruction</h1>
          <p className='text-xs text-muted-foreground'>
            FaceDNeRF and TripoSR
          </p>
        </div>

        <nav className='flex gap-1' aria-label='Workspace'>
          <Button
            size='sm'
            variant={mode === "comparison" ? "default" : "ghost"}
            onClick={() => setMode("comparison")}
          >
            Comparison
          </Button>
          <Button
            size='sm'
            variant={mode === "inference" ? "default" : "ghost"}
            onClick={() => setMode("inference")}
          >
            TripoSR Inference
          </Button>
          <Button
            size='sm'
            variant={mode === "lab" ? "default" : "ghost"}
            onClick={() => setMode("lab")}
          >
            Graphics Lab
          </Button>
        </nav>
      </header>

      <main className='min-h-0 flex-1'>
        {mode === "comparison" ? (
          <ComparisonWorkspace />
        ) : mode === "inference" ? (
          <TripoSRWorkspace />
        ) : (
          <GraphicsLabWorkspace />
        )}
      </main>
    </div>
    </MeshLibraryProvider>
  );
}
