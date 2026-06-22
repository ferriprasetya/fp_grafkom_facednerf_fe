"use client";

import dynamic from "next/dynamic";
import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Progress,
  ProgressLabel,
  ProgressValue,
} from "@/components/ui/progress";
import { Switch } from "@/components/ui/switch";
import { Spinner } from "@/components/ui/spinner";
import { DemoGallery } from "@/components/demo-gallery";
import { AlertCircle, Upload, Wand2, X } from "lucide-react";
import { useFaceReconstruction } from "@/src/hooks/useFaceReconstruction";
import { useGallery } from "@/src/hooks/useGallery";
import type { MaterialMode } from "@/components/ply-mesh";

const SceneCanvas = dynamic(
  () =>
    import("@/components/scene-canvas").then((m) => ({
      default: m.SceneCanvas,
    })),
  {
    ssr: false,
    loading: () => (
      <div className='absolute inset-0 flex items-center justify-center'>
        <Spinner className='size-10' />
      </div>
    ),
  },
);

const PRESET_PROMPTS = [
  "Neutral expression",
  "Smiling face",
  "Eyes closed",
  "Side profile",
];

export default function WorkspacePage() {
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [prompt, setPrompt] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [wireframe, setWireframe] = useState(false);
  const [materialMode, setMaterialMode] = useState<MaterialMode>("vertex");
  const [outline, setOutline] = useState(false);

  const { state, startReconstruction, reset } = useFaceReconstruction();
  const { entries, activeEntry, addEntry, selectEntry, clearGallery } =
    useGallery();

  // Capture completed jobs into the gallery automatically
  useEffect(() => {
    if (state.phase === "completed" && state.plyUrl && state.jobId) {
      addEntry({
        jobId: state.jobId,
        plyUrl: state.plyUrl,
        prompt,
        completedAt: Date.now(),
      });
    }
    // Only trigger when phase transitions to completed
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.phase]);

  function handleImageUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setImageFile(file);
    const reader = new FileReader();
    reader.onload = (ev) => setImagePreview(ev.target?.result as string);
    reader.readAsDataURL(file);
  }

  function clearImage() {
    setImagePreview(null);
    setImageFile(null);
    reset();
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  function handleSubmit() {
    if (!imageFile) return;
    startReconstruction(imageFile, prompt);
  }

  const isActive = state.phase === "submitting" || state.phase === "polling";
  const canSubmit = !!imageFile && !isActive;
  const showProgress = state.phase !== "idle";

  // The ply URL to hand off to the 3D viewer (active gallery pick wins over current job)
  const activePlyUrl = activeEntry?.plyUrl ?? state.plyUrl;

  return (
    <div className='flex h-screen overflow-hidden bg-background'>
      {/* ── Left: Control Panel ──────────────────────────────────────── */}
      <aside className='flex w-80 shrink-0 flex-col gap-6 overflow-y-auto border-r border-border p-6'>
        <div>
          <h1 className='text-base font-semibold tracking-tight'>FaceDNeRF</h1>
          <p className='text-xs text-muted-foreground'>
            3D Face Reconstruction
          </p>
        </div>

        {/* Image Upload */}
        <section className='flex flex-col gap-2'>
          <span className='text-xs font-medium text-muted-foreground uppercase tracking-widest'>
            Face Image
          </span>

          {imagePreview ? (
            <div className='relative overflow-hidden rounded-lg border border-border'>
              <img
                src={imagePreview}
                alt='Uploaded face'
                className='h-40 w-full object-cover'
              />
              <button
                onClick={clearImage}
                className='absolute right-2 top-2 rounded-md bg-background/80 p-1 backdrop-blur-sm transition-opacity hover:opacity-80'
                aria-label='Remove image'
              >
                <X className='size-3.5' />
              </button>
              <span className='absolute bottom-2 left-2 max-w-[calc(100%-2rem)] truncate rounded-sm bg-background/70 px-1.5 py-0.5 text-xs backdrop-blur-sm'>
                {imageFile?.name}
              </span>
            </div>
          ) : (
            <button
              onClick={() => fileInputRef.current?.click()}
              className='flex h-40 w-full flex-col items-center justify-center gap-2 rounded-lg border border-dashed border-border bg-muted/30 text-muted-foreground transition-colors hover:bg-muted/60'
            >
              <Upload className='size-5' />
              <span className='text-xs'>Click to upload</span>
            </button>
          )}

          <input
            ref={fileInputRef}
            type='file'
            accept='image/*'
            className='hidden'
            onChange={handleImageUpload}
          />
        </section>

        {/* Prompt */}
        <section className='flex flex-col gap-2'>
          <span className='text-xs font-medium text-muted-foreground uppercase tracking-widest'>
            Prompt
          </span>
          <Textarea
            placeholder='Enter prompt...'
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
          />
          <div className='flex flex-wrap gap-1.5'>
            {PRESET_PROMPTS.map((preset) => (
              <Button
                key={preset}
                variant='outline'
                size='xs'
                onClick={() => setPrompt(preset)}
              >
                {preset}
              </Button>
            ))}
          </div>
        </section>

        {/* Progress */}
        {showProgress && (
          <section className='flex flex-col gap-2'>
            {state.phase === "error" ? (
              <div className='flex items-start gap-2 text-destructive'>
                <AlertCircle className='mt-px size-4 shrink-0' />
                <p className='text-xs leading-relaxed'>{state.error}</p>
              </div>
            ) : (
              <Progress value={state.progress}>
                <ProgressLabel>{state.message}</ProgressLabel>
                <ProgressValue />
              </Progress>
            )}
          </section>
        )}

        {/* Gallery */}
        <DemoGallery
          entries={entries}
          activeEntry={activeEntry}
          onSelect={selectEntry}
        />

        {/* Viewport Controls */}
        {activePlyUrl && (
          <section className='flex flex-col gap-3'>
            <span className='text-xs font-medium text-muted-foreground uppercase tracking-widest'>
              Viewport
            </span>

            <div className='flex items-center justify-between'>
              <span className='text-xs text-muted-foreground'>Wireframe</span>
              <Switch
                id='wireframe-toggle'
                checked={wireframe}
                onCheckedChange={setWireframe}
              />
            </div>

            <div className='flex items-center justify-between'>
              <span className='text-xs text-muted-foreground'>Outline</span>
              <Switch
                id='outline-toggle'
                checked={outline}
                onCheckedChange={setOutline}
              />
            </div>

            <div className='flex flex-col gap-1.5'>
              <span className='text-xs text-muted-foreground'>Material</span>
              <div className='grid grid-cols-2 gap-1'>
                <Button
                  variant={materialMode === "vertex" ? "default" : "outline"}
                  size='sm'
                  onClick={() => setMaterialMode("vertex")}
                >
                  Vertex Colors
                </Button>
                <Button
                  variant={materialMode === "skin" ? "default" : "outline"}
                  size='sm'
                  onClick={() => setMaterialMode("skin")}
                >
                  Skin Tone
                </Button>
              </div>
            </div>
          </section>
        )}

        {/* Trigger */}
        <Button
          className='mt-auto w-full'
          onClick={handleSubmit}
          disabled={!canSubmit}
        >
          <Wand2 />
          Reconstruct 3D
        </Button>
      </aside>

      {/* ── Right: 3D Canvas Viewport ────────────────────────────────── */}
      <main
        id='canvas-viewport'
        className='relative flex flex-1 items-center justify-center overflow-hidden bg-muted/20'
      >
        {/* Idle — no active PLY and not processing */}
        {state.phase === "idle" && !activePlyUrl && (
          <div className='flex flex-col items-center gap-2 text-muted-foreground select-none'>
            <div className='size-16 rounded-2xl border border-dashed border-border flex items-center justify-center'>
              <Wand2 className='size-7 opacity-40' />
            </div>
            <p className='text-sm'>Upload a face image to begin</p>
          </div>
        )}

        {/* Processing spinner overlay */}
        {isActive && (
          <div className='absolute inset-0 z-10 flex flex-col items-center justify-center gap-3 bg-background/60 backdrop-blur-sm text-muted-foreground select-none'>
            <div className='size-10 animate-spin rounded-full border-2 border-border border-t-foreground' />
            <p className='text-sm'>{state.message}</p>
          </div>
        )}

        {/* R3F Canvas — always mounted once we have a plyUrl or gallery selection */}
        {(activePlyUrl || state.phase === "completed") && (
          <SceneCanvas
            plyUrl={activePlyUrl}
            wireframe={wireframe}
            materialMode={materialMode}
            outline={outline}
          />
        )}

        {state.phase === "error" && !activePlyUrl && (
          <div className='flex flex-col items-center gap-2 text-muted-foreground select-none'>
            <AlertCircle className='size-8 text-destructive opacity-60' />
            <p className='text-sm'>Reconstruction failed</p>
            <Button variant='outline' size='sm' onClick={reset}>
              Try again
            </Button>
          </div>
        )}
      </main>
    </div>
  );
}

