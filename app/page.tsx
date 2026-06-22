"use client";

import { useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Progress,
  ProgressLabel,
  ProgressValue,
} from "@/components/ui/progress";
import { AlertCircle, Upload, Wand2, X } from "lucide-react";
import { useFaceReconstruction } from "@/src/hooks/useFaceReconstruction";

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

  const { state, startReconstruction, reset } = useFaceReconstruction();

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
            placeholder='Enter prompt to modify your 3D face'
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
        {state.phase === "idle" && (
          <div className='flex flex-col items-center gap-2 text-muted-foreground select-none'>
            <div className='size-16 rounded-2xl border border-dashed border-border flex items-center justify-center'>
              <Wand2 className='size-7 opacity-40' />
            </div>
            <p className='text-sm'>Upload a face image to begin</p>
          </div>
        )}

        {isActive && (
          <div className='flex flex-col items-center gap-3 text-muted-foreground select-none'>
            <div className='size-10 animate-spin rounded-full border-2 border-border border-t-foreground' />
            <p className='text-sm'>{state.message}</p>
          </div>
        )}

        {state.phase === "completed" && (
          <div className='flex flex-col items-center gap-2 text-muted-foreground select-none'>
            <p className='text-sm'>
              {/* R3F canvas injected here in Task 5 — ply_url: {state.plyUrl} */}
              3D canvas will render here — R3F integration in Task 5
            </p>
          </div>
        )}

        {state.phase === "error" && (
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

