/**
 * Upload Progress State Types
 * 
 * Defines the state model for tracking file upload and processing progress
 */

/**
 * Processing stages for upload and transcription
 */
export enum UploadStage {
  IDLE = 'IDLE',
  UPLOADING = 'UPLOADING',
  EXTRACTING = 'EXTRACTING',
  TRANSCRIBING = 'TRANSCRIBING',
  COMPLETE = 'COMPLETE',
  ERROR = 'ERROR',
  CANCELLED = 'CANCELLED',
}

/**
 * Complete upload progress state
 */
export interface UploadProgressState {
  /** Whether upload is currently active */
  active: boolean;
  
  /** Current processing stage */
  stage: UploadStage;
  
  /** Name of the file being uploaded */
  fileName: string;
  
  /** Total file size in bytes */
  fileSize: number;
  
  /** Number of bytes uploaded so far */
  uploadedBytes: number;
  
  /** Upload progress percentage (0-100) */
  uploadProgress: number;
  
  /** Current status message to display to user */
  message: string;
  
  /** Error message if an error occurred */
  error: string | null;
  
  /** Timestamp when upload started */
  startTime: number | null;
  
  /** Estimated seconds until completion */
  estimatedTimeRemaining: number | null;
  
  /** Whether the current operation can be cancelled */
  canCancel: boolean;
  
  /** Unique ID for this upload (for status polling) */
  uploadId: string | null;
  
  /** Abort controller for cancelling upload */
  abortController: AbortController | null;
}

/**
 * Upload progress update event
 */
export interface UploadProgressEvent {
  loaded: number;
  total: number;
}

/**
 * Upload success response
 */
export interface UploadSuccessResponse {
  success: boolean;
  filename: string;
  originalFilename: string;
  fileType: 'audio' | 'video';
  stages: string[];
}

/**
 * Upload error response
 */
export interface UploadErrorResponse {
  success: false;
  error: string;
  technicalError?: string;
  stage?: string;
  recoverable?: boolean;
}

/**
 * Upload status polling response
 */
export interface UploadStatusResponse {
  stage: UploadStage;
  message: string;
  error?: string;
  complete?: boolean;
  filename?: string;
}

/**
 * Creates initial/default upload progress state
 */
export function createInitialUploadState(): UploadProgressState {
  return {
    active: false,
    stage: UploadStage.IDLE,
    fileName: '',
    fileSize: 0,
    uploadedBytes: 0,
    uploadProgress: 0,
    message: '',
    error: null,
    startTime: null,
    estimatedTimeRemaining: null,
    canCancel: false,
    uploadId: null,
    abortController: null,
  };
}

/**
 * Get user-friendly stage name
 */
export function getStageName(stage: UploadStage): string {
  switch (stage) {
    case UploadStage.UPLOADING:
      return 'Uploading';
    case UploadStage.EXTRACTING:
      return 'Extracting Audio';
    case UploadStage.TRANSCRIBING:
      return 'Transcribing';
    case UploadStage.COMPLETE:
      return 'Complete';
    case UploadStage.ERROR:
      return 'Error';
    case UploadStage.CANCELLED:
      return 'Cancelled';
    default:
      return '';
  }
}

/**
 * Check if a stage is cancellable
 */
export function isStageCancellable(stage: UploadStage): boolean {
  return stage === UploadStage.UPLOADING;
}

/**
 * Check if a stage shows determinate progress
 */
export function isStageWithDeterminateProgress(stage: UploadStage): boolean {
  return stage === UploadStage.UPLOADING;
}

/**
 * Format bytes to human-readable size
 */
export function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B';
  
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return `${(bytes / Math.pow(k, i)).toFixed(1)} ${sizes[i]}`;
}

/**
 * Format time in seconds to human-readable duration
 */
export function formatDuration(seconds: number): string {
  if (seconds < 60) {
    return `${Math.round(seconds)} seconds`;
  }
  
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = Math.round(seconds % 60);
  
  if (minutes < 60) {
    return remainingSeconds > 0 
      ? `${minutes}m ${remainingSeconds}s` 
      : `${minutes} minutes`;
  }
  
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;
  
  return remainingMinutes > 0
    ? `${hours}h ${remainingMinutes}m`
    : `${hours} hours`;
}

/**
 * Generate unique upload ID
 */
export function generateUploadId(): string {
  return `upload_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}
