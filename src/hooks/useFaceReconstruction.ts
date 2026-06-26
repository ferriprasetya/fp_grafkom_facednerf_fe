"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  fetchJobStatus,
  POLL_INTERVAL_MS,
  submitJob,
} from "@/src/services/api";
import type {
  JobStatus,
  PreprocessUrls,
  SubmitJobOptions,
} from "@/src/services/types";

export type PipelinePhase =
  | "idle"
  | "submitting"
  | "polling"
  | "completed"
  | "error";

export interface PipelineState {
  phase: PipelinePhase;
  jobId: string | null;
  progress: number;
  message: string;
  modelUrl: string | null;
  error: string | null;
  preprocessUrls: PreprocessUrls | null;
  inferenceMs: number | null;
  faceCrop: boolean | null;
}

const INITIAL_STATE: PipelineState = {
  phase: "idle",
  jobId: null,
  progress: 0,
  message: "",
  modelUrl: null,
  error: null,
  preprocessUrls: null,
  inferenceMs: null,
  faceCrop: null,
};

/** Maps backend JobStatus to a human-readable progress hint. */
function deriveProgress(status: JobStatus, backendProgress?: number): number {
  if (backendProgress != null) return backendProgress;
  switch (status) {
    case "QUEUED":
      return 10;
    case "PROCESSING":
      return 55;
    case "COMPLETED":
      return 100;
    case "FAILED":
      return 0;
  }
}

function deriveMessage(status: JobStatus, backendMessage?: string): string {
  if (backendMessage) return backendMessage;
  switch (status) {
    case "QUEUED":
      return "Queued...";
    case "PROCESSING":
      return "Running TripoSR inference...";
    case "COMPLETED":
      return "Completed";
    case "FAILED":
      return "Failed";
  }
}

function friendlyError(error: string): string {
  if (/no face detected/i.test(error)) {
    return "No face detected. Switch to Object Mode / Face Crop off, then run again.";
  }
  if (/foreground_ratio/i.test(error)) {
    return "Invalid foreground ratio. Use a value between 0.5 and 1.0.";
  }
  if (/mc_resolution/i.test(error)) {
    return "Invalid mesh resolution. Use 128–512.";
  }
  if (/timeout/i.test(error)) {
    return "Inference timeout. Try a smaller image or lower mesh resolution.";
  }
  return error;
}

export function useFaceReconstruction() {
  const [state, setState] = useState<PipelineState>(INITIAL_STATE);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  function stopPolling() {
    if (pollRef.current) {
      clearInterval(pollRef.current);
      pollRef.current = null;
    }
  }

  const startReconstruction = useCallback(
    async (imageFile: File, options: SubmitJobOptions) => {
      stopPolling();
      setState({
        ...INITIAL_STATE,
        phase: "submitting",
        message: "Uploading...",
      });

      let jobId: string;
      try {
        const res = await submitJob(imageFile, options);
        jobId = res.job_id;
      } catch (err) {
        const message =
          err instanceof Error ? err.message : "Submission failed";
        setState((prev) => ({
          ...prev,
          phase: "error",
          error: friendlyError(message),
        }));
        return;
      }

      setState((prev) => ({
        ...prev,
        phase: "polling",
        jobId,
        progress: 10,
        message: "Job submitted — waiting for processing...",
      }));

      pollRef.current = setInterval(async () => {
        try {
          const status = await fetchJobStatus(jobId);

          setState((prev) => ({
            ...prev,
            progress: deriveProgress(status.status, status.progress),
            message: deriveMessage(status.status, status.message),
          }));

          if (status.status === "COMPLETED") {
            stopPolling();
            console.log("COMPLETED", status.glb_url ?? status.ply_url);
            setState((prev) => ({
              ...prev,
              phase: "completed",
              modelUrl: status.glb_url ?? status.ply_url ?? null,
              preprocessUrls: status.preprocess_urls ?? null,
              inferenceMs: status.inference_ms ?? null,
              faceCrop: status.face_crop ?? options.faceCrop,
              progress: 100,
              message: status.inference_ms
                ? `Completed in ${(status.inference_ms / 1000).toFixed(2)}s`
                : "Completed",
            }));
          } else if (status.status === "FAILED") {
            stopPolling();
            setState((prev) => ({
              ...prev,
              phase: "error",
              error: friendlyError(status.error ?? "Job failed on the server"),
            }));
          }
        } catch (err) {
          const message = err instanceof Error ? err.message : "Polling failed";
          stopPolling();
          setState((prev) => ({
            ...prev,
            phase: "error",
            error: friendlyError(message),
          }));
        }
      }, POLL_INTERVAL_MS);
    },
    [],
  );

  const reset = useCallback(() => {
    stopPolling();
    setState(INITIAL_STATE);
  }, []);

  useEffect(() => stopPolling, []);

  return { state, startReconstruction, reset };
}

