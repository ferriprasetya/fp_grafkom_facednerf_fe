export type JobStatus = "QUEUED" | "PROCESSING" | "COMPLETED" | "FAILED";

export interface SubmitJobResponse {
  job_id: string;
}

export interface SubmitJobOptions {
  faceCrop: boolean;
  foregroundRatio?: number;
  mcResolution?: number;
}

export interface PreprocessUrls {
  cropped?: string;
  foreground?: string;
  model_input?: string;
}

export interface JobStatusResponse {
  job_id: string;
  status: JobStatus;
  /** Present only when status === "COMPLETED" */
  ply_url?: string;
  glb_url?: string;
  preprocess_urls?: PreprocessUrls;
  inference_ms?: number;
  face_crop?: boolean;
  foreground_ratio?: number;
  mc_resolution?: number;
  /** Present only when status === "FAILED" */
  error?: string;
  /** Backend-reported progress, 0–100 */
  progress?: number;
  message?: string;
}

export interface GalleryEntry {
  jobId: string;
  modelUrl: string;
  prompt: string;
  completedAt: number;
}


