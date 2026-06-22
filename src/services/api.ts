import type { JobStatusResponse, SubmitJobResponse } from "./types";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

/**
 * POST /reconstruct
 * Sends the face image file + prompt to FastAPI.
 * Returns a job_id for downstream polling.
 */
export async function submitJob(
  imageFile: File,
  prompt: string,
): Promise<SubmitJobResponse> {
  const form = new FormData();
  form.append("image", imageFile);
  form.append("prompt", prompt);

  const res = await fetch(`${API_BASE_URL}/generate`, {
    method: "POST",
    body: form,
  });

  if (!res.ok) {
    const text = await res.text().catch(() => res.statusText);
    throw new Error(`Submit failed (${res.status}): ${text}`);
  }

  return res.json() as Promise<SubmitJobResponse>;
}

/**
 * GET /status/{job_id}
 * Fetches the current processing status of a job.
 */
export async function fetchJobStatus(
  jobId: string,
): Promise<JobStatusResponse> {
  const res = await fetch(`${API_BASE_URL}/status/${jobId}`);

  if (!res.ok) {
    const text = await res.text().catch(() => res.statusText);
    throw new Error(`Status check failed (${res.status}): ${text}`);
  }

  return res.json() as Promise<JobStatusResponse>;
}

/** How often (ms) to poll for job status */
export const POLL_INTERVAL_MS = 2_000;

