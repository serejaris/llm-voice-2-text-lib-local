/**
 * Upload Progress Hook
 * 
 * Manages upload progress state with time estimation and throttling
 */

import * as React from 'react';
import * as UploadTypes from '@common/upload-progress-types';

interface UseUploadProgressOptions {
  /** Throttle interval for progress updates in milliseconds */
  throttleInterval?: number;
  
  /** Number of samples to use for speed calculation */
  speedSampleSize?: number;
}

interface UploadSpeedSample {
  timestamp: number;
  bytesUploaded: number;
}

export function useUploadProgress(options: UseUploadProgressOptions = {}) {
  const { throttleInterval = 100, speedSampleSize = 5 } = options;
  
  const [uploadState, setUploadState] = React.useState<UploadTypes.UploadProgressState>(
    UploadTypes.createInitialUploadState()
  );
  
  // Ref to store speed samples for time estimation
  const speedSamplesRef = React.useRef<UploadSpeedSample[]>([]);
  
  // Ref to throttle progress updates
  const lastUpdateTimeRef = React.useRef<number>(0);
  const pendingUpdateRef = React.useRef<UploadTypes.UploadProgressEvent | null>(null);
  const updateTimeoutRef = React.useRef<NodeJS.Timeout | null>(null);
  
  /**
   * Calculate upload speed and estimate remaining time
   */
  const calculateTimeEstimate = React.useCallback((loaded: number, total: number): number | null => {
    const now = Date.now();
    
    // Add current sample
    speedSamplesRef.current.push({
      timestamp: now,
      bytesUploaded: loaded,
    });
    
    // Keep only recent samples
    if (speedSamplesRef.current.length > speedSampleSize) {
      speedSamplesRef.current.shift();
    }
    
    // Need at least 2 samples to calculate speed
    if (speedSamplesRef.current.length < 2) {
      return null;
    }
    
    // Calculate average speed from samples
    const firstSample = speedSamplesRef.current[0];
    const lastSample = speedSamplesRef.current[speedSamplesRef.current.length - 1];
    
    const timeDiff = (lastSample.timestamp - firstSample.timestamp) / 1000; // seconds
    const bytesDiff = lastSample.bytesUploaded - firstSample.bytesUploaded;
    
    if (timeDiff === 0) {
      return null;
    }
    
    const bytesPerSecond = bytesDiff / timeDiff;
    
    if (bytesPerSecond === 0) {
      return null;
    }
    
    const remainingBytes = total - loaded;
    const estimatedSeconds = remainingBytes / bytesPerSecond;
    
    return Math.max(0, estimatedSeconds);
  }, [speedSampleSize]);
  
  /**
   * Initialize upload
   */
  const initializeUpload = React.useCallback((data: {
    fileName: string;
    fileSize: number;
    uploadId: string;
  }) => {
    const abortController = new AbortController();
    
    speedSamplesRef.current = [];
    lastUpdateTimeRef.current = 0;
    
    setUploadState({
      active: true,
      stage: UploadTypes.UploadStage.UPLOADING,
      fileName: data.fileName,
      fileSize: data.fileSize,
      uploadedBytes: 0,
      uploadProgress: 0,
      message: `Uploading ${data.fileName}...`,
      error: null,
      startTime: Date.now(),
      estimatedTimeRemaining: null,
      canCancel: true,
      uploadId: data.uploadId,
      abortController,
    });
    
    return abortController;
  }, []);
  
  /**
   * Update upload progress (throttled)
   */
  const updateProgress = React.useCallback((progressEvent: UploadTypes.UploadProgressEvent) => {
    const now = Date.now();
    
    // Store pending update
    pendingUpdateRef.current = progressEvent;
    
    // Check if we should throttle
    if (now - lastUpdateTimeRef.current < throttleInterval) {
      // Schedule update if not already scheduled
      if (!updateTimeoutRef.current) {
        updateTimeoutRef.current = setTimeout(() => {
          updateTimeoutRef.current = null;
          if (pendingUpdateRef.current) {
            performProgressUpdate(pendingUpdateRef.current);
          }
        }, throttleInterval);
      }
      return;
    }
    
    // Perform immediate update
    performProgressUpdate(progressEvent);
  }, [throttleInterval]);
  
  /**
   * Actually perform the progress update
   */
  const performProgressUpdate = React.useCallback((progressEvent: UploadTypes.UploadProgressEvent) => {
    lastUpdateTimeRef.current = Date.now();
    
    const progress = (progressEvent.loaded / progressEvent.total) * 100;
    const timeEstimate = calculateTimeEstimate(progressEvent.loaded, progressEvent.total);
    
    setUploadState(prev => ({
      ...prev,
      uploadedBytes: progressEvent.loaded,
      uploadProgress: progress,
      estimatedTimeRemaining: timeEstimate,
      message: `Uploading... ${UploadTypes.formatBytes(progressEvent.loaded)} of ${UploadTypes.formatBytes(progressEvent.total)}`,
    }));
  }, [calculateTimeEstimate]);
  
  /**
   * Transition to a different processing stage
   */
  const transitionToStage = React.useCallback((stage: UploadTypes.UploadStage, message?: string) => {
    // Clear speed samples when transitioning stages
    speedSamplesRef.current = [];
    
    setUploadState(prev => ({
      ...prev,
      stage,
      message: message || getDefaultStageMessage(stage, prev.fileName),
      canCancel: UploadTypes.isStageCancellable(stage),
      estimatedTimeRemaining: stage === UploadTypes.UploadStage.UPLOADING ? prev.estimatedTimeRemaining : null,
    }));
  }, []);
  
  /**
   * Handle upload success
   */
  const handleSuccess = React.useCallback(() => {
    speedSamplesRef.current = [];
    
    setUploadState(prev => ({
      ...prev,
      stage: UploadTypes.UploadStage.COMPLETE,
      uploadProgress: 100,
      message: 'Upload and processing complete!',
      canCancel: false,
      estimatedTimeRemaining: null,
    }));
  }, []);
  
  /**
   * Handle upload error
   */
  const handleError = React.useCallback((error: string) => {
    speedSamplesRef.current = [];
    
    setUploadState(prev => ({
      ...prev,
      stage: UploadTypes.UploadStage.ERROR,
      error,
      message: 'Upload failed',
      canCancel: false,
      estimatedTimeRemaining: null,
    }));
  }, []);
  
  /**
   * Cancel upload
   */
  const cancelUpload = React.useCallback(() => {
    setUploadState(prev => {
      if (prev.abortController) {
        prev.abortController.abort();
      }
      
      return {
        ...prev,
        stage: UploadTypes.UploadStage.CANCELLED,
        message: 'Upload cancelled',
        canCancel: false,
        estimatedTimeRemaining: null,
      };
    });
    
    speedSamplesRef.current = [];
  }, []);
  
  /**
   * Reset upload state
   */
  const resetUpload = React.useCallback(() => {
    // Clear any pending timeouts
    if (updateTimeoutRef.current) {
      clearTimeout(updateTimeoutRef.current);
      updateTimeoutRef.current = null;
    }
    
    speedSamplesRef.current = [];
    lastUpdateTimeRef.current = 0;
    pendingUpdateRef.current = null;
    
    setUploadState(UploadTypes.createInitialUploadState());
  }, []);
  
  // Cleanup on unmount
  React.useEffect(() => {
    return () => {
      if (updateTimeoutRef.current) {
        clearTimeout(updateTimeoutRef.current);
      }
    };
  }, []);
  
  return {
    uploadState,
    initializeUpload,
    updateProgress,
    transitionToStage,
    handleSuccess,
    handleError,
    cancelUpload,
    resetUpload,
  };
}

/**
 * Get default message for a processing stage
 */
function getDefaultStageMessage(stage: UploadTypes.UploadStage, fileName: string): string {
  switch (stage) {
    case UploadTypes.UploadStage.UPLOADING:
      return `Uploading ${fileName}...`;
    case UploadTypes.UploadStage.EXTRACTING:
      return 'Extracting audio from video...';
    case UploadTypes.UploadStage.TRANSCRIBING:
      return 'Transcribing audio with Whisper...';
    case UploadTypes.UploadStage.COMPLETE:
      return 'Upload and processing complete!';
    case UploadTypes.UploadStage.ERROR:
      return 'Upload failed';
    case UploadTypes.UploadStage.CANCELLED:
      return 'Upload cancelled';
    default:
      return '';
  }
}
