/**
 * Transcription Queue Manager
 * Manages a queue of transcription jobs, processing them one at a time
 */

export enum TranscriptionStatus {
  QUEUED = 'QUEUED',
  PROCESSING = 'PROCESSING',
  COMPLETED = 'COMPLETED',
  ERROR = 'ERROR',
}

export interface TranscriptionJob {
  jobId: string;
  fileName: string;
  status: TranscriptionStatus;
  queuePosition?: number;
  transcription?: string;
  error?: string;
  timestamp: number;
  completedAt?: number;
}

// In-memory storage for transcription jobs
const transcriptionJobs = new Map<string, TranscriptionJob>();
const jobQueue: string[] = []; // Queue of job IDs waiting to be processed
let currentJobId: string | null = null;
let isProcessing = false;

const CLEANUP_INTERVAL = 60 * 60 * 1000; // 1 hour
const JOB_EXPIRY_TIME = 60 * 60 * 1000; // 1 hour

/**
 * Generate a unique job ID
 */
export function generateJobId(): string {
  return `transcription_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Add a new transcription job to the queue
 */
export function addTranscriptionJob(fileName: string): string {
  const jobId = generateJobId();

  const job: TranscriptionJob = {
    jobId,
    fileName,
    status: TranscriptionStatus.QUEUED,
    timestamp: Date.now(),
  };

  transcriptionJobs.set(jobId, job);
  jobQueue.push(jobId);

  // Update queue positions
  updateQueuePositions();

  // Start processing if not already processing
  if (!isProcessing) {
    processNextJob();
  }

  return jobId;
}

/**
 * Get a transcription job by ID
 */
export function getTranscriptionJob(jobId: string): TranscriptionJob | null {
  const job = transcriptionJobs.get(jobId);
  if (!job) return null;

  // Update queue position if still queued
  if (job.status === TranscriptionStatus.QUEUED) {
    const position = jobQueue.indexOf(jobId);
    job.queuePosition = position >= 0 ? position + 1 : undefined;
  }

  return job;
}

/**
 * Get all transcription jobs
 */
export function getAllTranscriptionJobs(): TranscriptionJob[] {
  const jobs = Array.from(transcriptionJobs.values());

  // Update queue positions for queued jobs
  jobs.forEach(job => {
    if (job.status === TranscriptionStatus.QUEUED) {
      const position = jobQueue.indexOf(job.jobId);
      job.queuePosition = position >= 0 ? position + 1 : undefined;
    }
  });

  return jobs.sort((a, b) => b.timestamp - a.timestamp);
}

/**
 * Update the status of a transcription job
 */
export function updateTranscriptionJob(
  jobId: string,
  updates: Partial<Pick<TranscriptionJob, 'status' | 'transcription' | 'error'>>
): void {
  const job = transcriptionJobs.get(jobId);
  if (!job) return;

  Object.assign(job, updates);

  if (updates.status === TranscriptionStatus.COMPLETED || updates.status === TranscriptionStatus.ERROR) {
    job.completedAt = Date.now();

    // Remove from queue if present
    const queueIndex = jobQueue.indexOf(jobId);
    if (queueIndex >= 0) {
      jobQueue.splice(queueIndex, 1);
    }

    // Clear current job if this is it
    if (currentJobId === jobId) {
      currentJobId = null;
      isProcessing = false;
    }

    // Update queue positions
    updateQueuePositions();

    // Process next job
    processNextJob();
  }
}

/**
 * Update queue positions for all queued jobs
 */
function updateQueuePositions(): void {
  jobQueue.forEach((jobId, index) => {
    const job = transcriptionJobs.get(jobId);
    if (job) {
      job.queuePosition = index + 1;
    }
  });
}

/**
 * Process the next job in the queue
 */
function processNextJob(): void {
  if (isProcessing || jobQueue.length === 0) {
    return;
  }

  const nextJobId = jobQueue[0];
  const job = transcriptionJobs.get(nextJobId);

  if (!job) {
    jobQueue.shift();
    processNextJob();
    return;
  }

  currentJobId = nextJobId;
  isProcessing = true;

  job.status = TranscriptionStatus.PROCESSING;
  job.queuePosition = undefined;

  updateQueuePositions();
}

/**
 * Get the currently processing job
 */
export function getCurrentJob(): TranscriptionJob | null {
  return currentJobId ? transcriptionJobs.get(currentJobId) || null : null;
}

/**
 * Get queue statistics
 */
export function getQueueStats(): {
  queueLength: number;
  isProcessing: boolean;
  currentJobId: string | null;
  totalJobs: number;
} {
  return {
    queueLength: jobQueue.length,
    isProcessing,
    currentJobId,
    totalJobs: transcriptionJobs.size,
  };
}

/**
 * Remove a job from the queue (if not processing)
 */
export function cancelTranscriptionJob(jobId: string): boolean {
  const job = transcriptionJobs.get(jobId);
  if (!job) return false;

  // Can only cancel queued jobs
  if (job.status !== TranscriptionStatus.QUEUED) {
    return false;
  }

  const queueIndex = jobQueue.indexOf(jobId);
  if (queueIndex >= 0) {
    jobQueue.splice(queueIndex, 1);
  }

  transcriptionJobs.delete(jobId);
  updateQueuePositions();

  return true;
}

/**
 * Clean up old completed/error jobs
 */
function cleanupOldJobs(): void {
  const now = Date.now();
  const jobsToDelete: string[] = [];

  transcriptionJobs.forEach((job, jobId) => {
    if (
      (job.status === TranscriptionStatus.COMPLETED || job.status === TranscriptionStatus.ERROR) &&
      job.completedAt &&
      now - job.completedAt > JOB_EXPIRY_TIME
    ) {
      jobsToDelete.push(jobId);
    }
  });

  jobsToDelete.forEach(jobId => {
    transcriptionJobs.delete(jobId);
  });

  if (jobsToDelete.length > 0) {
    console.log(`Cleaned up ${jobsToDelete.length} old transcription jobs`);
  }
}

// Start cleanup interval
setInterval(cleanupOldJobs, CLEANUP_INTERVAL);
