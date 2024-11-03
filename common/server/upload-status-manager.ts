/**
 * Upload Status Manager
 * 
 * Manages in-memory storage of upload processing status
 */

import { UploadStage } from '@common/upload-progress-types';

interface UploadStatus {
  uploadId: string;
  stage: UploadStage;
  message: string;
  error?: string;
  complete?: boolean;
  filename?: string;
  timestamp: number;
}

// In-memory storage for upload statuses
const uploadStatuses = new Map<string, UploadStatus>();

// Cleanup interval (remove statuses older than 1 hour)
const CLEANUP_INTERVAL = 60 * 60 * 1000; // 1 hour
const MAX_STATUS_AGE = 60 * 60 * 1000; // 1 hour

/**
 * Set upload status
 */
export function setUploadStatus(uploadId: string, status: Omit<UploadStatus, 'uploadId' | 'timestamp'>) {
  uploadStatuses.set(uploadId, {
    uploadId,
    timestamp: Date.now(),
    ...status,
  });
}

/**
 * Get upload status
 */
export function getUploadStatus(uploadId: string): UploadStatus | null {
  return uploadStatuses.get(uploadId) || null;
}

/**
 * Delete upload status
 */
export function deleteUploadStatus(uploadId: string) {
  uploadStatuses.delete(uploadId);
}

/**
 * Clean up old statuses
 */
export function cleanupOldStatuses() {
  const now = Date.now();
  const toDelete: string[] = [];
  
  uploadStatuses.forEach((status, uploadId) => {
    if (now - status.timestamp > MAX_STATUS_AGE) {
      toDelete.push(uploadId);
    }
  });
  
  toDelete.forEach(uploadId => {
    uploadStatuses.delete(uploadId);
  });
}

// Run cleanup periodically
setInterval(cleanupOldStatuses, CLEANUP_INTERVAL);
