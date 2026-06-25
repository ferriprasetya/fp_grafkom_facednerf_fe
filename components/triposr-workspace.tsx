"use client";

import dynamic from "next/dynamic";
import { useEffect, useRef, useState } from "react";
import { AlertCircle, Upload, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Progress,
  ProgressLabel,
  ProgressValue,
} from "@/components/ui/progress";
import { Spinner } from "@/components/ui/spinner";
import { useFaceReconstruction } from "@/src/hooks/useFaceReconstruction";
import { useMeshLibrary } from "@/src/context/mesh-library";

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
  const fileInputRef = useRef<HTMLInputElement>(null);
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
    <div className='grid min-h-[calc(100vh-65px)] lg:grid-cols-[320px_1fr]'>
      <aside className='flex flex-col gap-6 border-b p-5 lg:border-r lg:border-b-0'>
        <div>
          <h2 className='text-sm font-medium'>TripoSR inference</h2>
          <p className='text-xs text-muted-foreground'>
            Modal · face crop · 256 mesh resolution
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
          onClick={() => imageFile && startReconstruction(imageFile)}
        >
          {isProcessing ? <Spinner /> : <Upload />}
          Generate PLY
        </Button>
      </aside>

      <section className='relative min-h-[520px] bg-muted/20'>
        {state.modelUrl ? (
          <>
            <SceneCanvas modelUrl={state.modelUrl} />
            <a
              href={state.modelUrl}
              download
              className='absolute bottom-4 right-4 rounded-md bg-background/80 px-3 py-2 text-xs backdrop-blur-sm hover:bg-background'
            >
              Download PLY
            </a>
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
