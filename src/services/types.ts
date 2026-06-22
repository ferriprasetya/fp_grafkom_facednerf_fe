export type JobStatus = "QUEUED" | "PROCESSING" | "COMPLETED" | "FAILED";

export interface SubmitJobResponse {
  job_id: string;
}

export interface JobStatusResponse {
  job_id: string;
  status: JobStatus;
  /** Present only when status === "COMPLETED" */
  ply_url?: string;
  /** Present only when status === "FAILED" */
  error?: string;
  /** Backend-reported progress, 0–100 */
  progress?: number;
  message?: string;
}
