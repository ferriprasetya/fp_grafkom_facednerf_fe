import type { JobStatusResponse, SubmitJobResponse } from "./types";

const API_BASE_URL = (
  process.env.NEXT_PUBLIC_TRIPOSR_API_URL ??
  process.env.NEXT_PUBLIC_API_URL ??
  "http://localhost:8000"
).replace(/\/$/, "");

/** Sends an image to the deployed TripoSR API. */
export async function submitJob(
  imageFile: File,
): Promise<SubmitJobResponse> {
  const form = new FormData();
  form.append("image", imageFile);
  form.append("foreground_ratio", "0.85");
  form.append("mc_resolution", "256");
  form.append("face_crop", "true");

  const res = await fetch(`${API_BASE_URL}/api/generate`, {
    method: "POST",
    body: form,
  });

  if (!res.ok) {
    const text = await res.text().catch(() => res.statusText);
    throw new Error(`Submit failed (${res.status}): ${text}`);
  }

  return res.json() as Promise<SubmitJobResponse>;
}

/** Fetches the current processing status of a TripoSR job. */
export async function fetchJobStatus(
  jobId: string,
): Promise<JobStatusResponse> {
  const res = await fetch(`${API_BASE_URL}/api/status/${jobId}`, {
    cache: "no-store",
  });

  if (!res.ok) {
    const text = await res.text().catch(() => res.statusText);
    throw new Error(`Status check failed (${res.status}): ${text}`);
  }

  return res.json() as Promise<JobStatusResponse>;
}

/** How often (ms) to poll for job status */
export const POLL_INTERVAL_MS = 2_000;

