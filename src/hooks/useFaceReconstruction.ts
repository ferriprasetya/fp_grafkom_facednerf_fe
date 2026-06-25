"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  fetchJobStatus,
  POLL_INTERVAL_MS,
  submitJob,
} from "@/src/services/api";
import type { JobStatus } from "@/src/services/types";

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
}

const INITIAL_STATE: PipelineState = {
  phase: "idle",
  jobId: null,
  progress: 0,
  message: "",
  modelUrl: null,
  error: null,
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
    async (imageFile: File) => {
      stopPolling();
      setState({
        ...INITIAL_STATE,
        phase: "submitting",
        message: "Uploading...",
      });

      let jobId: string;
      try {
        const res = await submitJob(imageFile);
        jobId = res.job_id;
      } catch (err) {
        setState((prev) => ({
          ...prev,
          phase: "error",
          error: err instanceof Error ? err.message : "Submission failed",
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
              progress: 100,
              message: "Completed",
            }));
          } else if (status.status === "FAILED") {
            stopPolling();
            setState((prev) => ({
              ...prev,
              phase: "error",
              error: status.error ?? "Job failed on the server",
            }));
          }
        } catch (err) {
          stopPolling();
          setState((prev) => ({
            ...prev,
            phase: "error",
            error: err instanceof Error ? err.message : "Polling failed",
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

