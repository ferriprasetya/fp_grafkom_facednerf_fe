"use client";

import dynamic from "next/dynamic";
import { useEffect, useRef, useState } from "react";
import { AlertCircle, Upload, X } from "lucide-react";
import { MeshDownloadActions } from "@/components/mesh-download-actions";
import { MeshStatsPanel } from "@/components/mesh-stats-panel";
import type { MaterialMode } from "@/components/ply-mesh";
import { Button } from "@/components/ui/button";
import {
  Progress,
  ProgressLabel,
  ProgressValue,
} from "@/components/ui/progress";
import { Spinner } from "@/components/ui/spinner";
import { Switch } from "@/components/ui/switch";
import type { MeshSideMode } from "@/lib/mesh-analysis";
import { useMeshLibrary } from "@/src/context/mesh-library";
import { useFaceReconstruction } from "@/src/hooks/useFaceReconstruction";

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

export function TripoSRWorkspace() {
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [faceCrop, setFaceCrop] = useState(false);
  const [wireframe, setWireframe] = useState(false);
  const [flipNormals, setFlipNormals] = useState(false);
  const [materialMode, setMaterialMode] =
    useState<MaterialMode>("vertex");
  const [sideMode, setSideMode] = useState<MeshSideMode>("double");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const viewerRef = useRef<HTMLElement>(null);
  const { state, startReconstruction, reset } = useFaceReconstruction();
  const { addEntry } = useMeshLibrary();
  const addedJobRef = useRef<string | null>(null);

  const isProcessing =
    state.phase === "submitting" || state.phase === "polling";

  useEffect(
    () => () => {
      if (imagePreview) URL.revokeObjectURL(imagePreview);
    },
    [imagePreview],
  );

  useEffect(() => {
    if (
      state.phase === "completed" &&
      state.modelUrl &&
      state.jobId &&
      addedJobRef.current !== state.jobId
    ) {
      addEntry({
        label: imageFile?.name
          ? `${imageFile.name} · TripoSR`
          : `TripoSR ${state.jobId}`,
        url: state.modelUrl,
        source: "inference",
      });
      addedJobRef.current = state.jobId;
    }
  }, [addEntry, imageFile?.name, state.jobId, state.modelUrl, state.phase]);

  function selectImage(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;
    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
    reset();
  }

  function clearImage() {
    setImageFile(null);
    setImagePreview(null);
    reset();
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  return (
    <div className='grid min-h-[calc(100vh-65px)] lg:grid-cols-[340px_1fr]'>
      <aside className='flex max-h-[calc(100vh-65px)] flex-col gap-6 overflow-y-auto border-b p-5 lg:border-r lg:border-b-0'>
        <div>
          <h2 className='text-sm font-medium'>TripoSR inference</h2>
          <p className='text-xs text-muted-foreground'>
            Modal · object/face mode · 256 mesh resolution
          </p>
        </div>

        {imagePreview ? (
          <div className='relative aspect-square overflow-hidden rounded-xl bg-muted'>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={imagePreview}
              alt='Selected input'
              className='h-full w-full object-cover'
            />
            <Button
              size='icon-sm'
              variant='secondary'
              className='absolute right-2 top-2'
              onClick={clearImage}
              aria-label='Remove image'
            >
              <X />
            </Button>
          </div>
        ) : (
          <button
            type='button'
            className='flex aspect-square flex-col items-center justify-center gap-2 rounded-xl border border-dashed bg-muted/30 text-sm text-muted-foreground hover:bg-muted/60'
            onClick={() => fileInputRef.current?.click()}
          >
            <Upload className='size-5' />
            Select image
          </button>
        )}

        <input
          ref={fileInputRef}
          type='file'
          accept='image/*'
          className='hidden'
          onChange={selectImage}
        />

        <section className='flex flex-col gap-3'>
          <p className='text-xs font-medium uppercase tracking-wider text-muted-foreground'>
            Inference mode
          </p>
          <div className='grid grid-cols-2 gap-2'>
            <Button
              size='sm'
              variant={!faceCrop ? "default" : "outline"}
              onClick={() => setFaceCrop(false)}
            >
              Object
            </Button>
            <Button
              size='sm'
              variant={faceCrop ? "default" : "outline"}
              onClick={() => setFaceCrop(true)}
            >
              Face crop
            </Button>
          </div>
          <p className='text-xs text-muted-foreground'>
            Object skips MediaPipe face detection. Face crop detects landmarks,
            then crops before TripoSR.
          </p>
        </section>

        <section className='flex flex-col gap-3'>
          <p className='text-xs font-medium uppercase tracking-wider text-muted-foreground'>
            Viewer debug
          </p>
          <div className='flex items-center justify-between'>
            <span className='text-sm'>Wireframe</span>
            <Switch checked={wireframe} onCheckedChange={setWireframe} />
          </div>
          <div className='flex items-center justify-between'>
            <span className='text-sm'>Flip normals</span>
            <Switch checked={flipNormals} onCheckedChange={setFlipNormals} />
          </div>
          <div className='grid grid-cols-2 gap-2'>
            <Button
              size='sm'
              variant={materialMode === "vertex" ? "default" : "outline"}
              onClick={() => setMaterialMode("vertex")}
            >
              Vertex
            </Button>
            <Button
              size='sm'
              variant={materialMode === "skin" ? "default" : "outline"}
              onClick={() => setMaterialMode("skin")}
            >
              Geometry
            </Button>
          </div>
          <div className='grid grid-cols-3 gap-2'>
            {(["double", "front", "back"] as const).map((mode) => (
              <Button
                key={mode}
                size='sm'
                variant={sideMode === mode ? "default" : "outline"}
                onClick={() => setSideMode(mode)}
              >
                {mode}
              </Button>
            ))}
          </div>
        </section>

        {state.phase !== "idle" && state.phase !== "error" && (
          <Progress value={state.progress}>
            <ProgressLabel>{state.message}</ProgressLabel>
            <ProgressValue />
          </Progress>
        )}

        {state.phase === "error" && (
          <div className='flex gap-2 text-sm text-destructive'>
            <AlertCircle className='mt-0.5 size-4 shrink-0' />
            <span>{state.error}</span>
          </div>
        )}

        <Button
          className='mt-auto'
          disabled={!imageFile || isProcessing}
          onClick={() =>
            imageFile &&
            startReconstruction(imageFile, {
              faceCrop,
              foregroundRatio: 0.85,
              mcResolution: 256,
            })
          }
        >
          {isProcessing ? <Spinner /> : <Upload />}
          Generate PLY
        </Button>
      </aside>

      <section ref={viewerRef} className='relative min-h-[520px] bg-muted/20'>
        {state.modelUrl ? (
          <>
            <SceneCanvas
              modelUrl={state.modelUrl}
              wireframe={wireframe}
              materialMode={materialMode}
              sideMode={sideMode}
              flipNormals={flipNormals}
            />
            <div className='absolute bottom-4 right-4 rounded-md bg-background/85 p-2 backdrop-blur-sm'>
              <MeshDownloadActions
                modelUrl={state.modelUrl}
                filenameStem={`triposr-${state.jobId ?? "mesh"}`}
                getCanvas={() =>
                  viewerRef.current?.querySelector("canvas") ?? null
                }
              />
            </div>
            <div className='absolute left-4 top-4 w-72 rounded-lg bg-background/85 p-3 backdrop-blur-sm'>
              <MeshStatsPanel
                modelUrl={state.modelUrl}
                inferenceMs={state.inferenceMs}
              />
            </div>
            {state.preprocessUrls && (
              <div className='absolute bottom-4 left-4 grid max-w-[560px] grid-cols-3 gap-2 rounded-lg bg-background/85 p-2 backdrop-blur-sm'>
                <PreviewImage
                  label={state.faceCrop ? "Crop" : "Object input"}
                  src={state.preprocessUrls.cropped}
                />
                <PreviewImage
                  label='Foreground'
                  src={state.preprocessUrls.foreground}
                />
                <PreviewImage
                  label='Model input'
                  src={state.preprocessUrls.model_input}
                />
              </div>
            )}
          </>
        ) : (
          <div className='flex h-full min-h-[520px] items-center justify-center text-sm text-muted-foreground'>
            Generated mesh appears here
          </div>
        )}
      </section>
    </div>
  );
}

function PreviewImage({ label, src }: { label: string; src?: string }) {
  if (!src) return null;
  return (
    <figure className='w-40 overflow-hidden rounded-md bg-muted'>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={src} alt={label} className='aspect-square w-full object-cover' />
      <figcaption className='px-2 py-1 text-xs text-muted-foreground'>
        {label}
      </figcaption>
    </figure>
  );
}
