import React from 'react';
import * as Queries from '../api-client';

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

export interface QueueStats {
  queueLength: number;
  isProcessing: boolean;
  currentJobId: string | null;
  totalJobs: number;
}

export interface UseTranscriptionQueueResult {
  jobs: TranscriptionJob[];
  stats: QueueStats | null;
  addJob: (fileName: string) => Promise<string | null>;
  cancelJob: (jobId: string) => Promise<boolean>;
  getJobByFileName: (fileName: string) => TranscriptionJob | undefined;
  isProcessing: boolean;
  currentJob: TranscriptionJob | null;
  error: string | null;
}

const POLL_INTERVAL = 2000; // Poll every 2 seconds
const PROCESS_CHECK_INTERVAL = 3000; // Check if we need to process every 3 seconds

export function useTranscriptionQueue(): UseTranscriptionQueueResult {
  const [jobs, setJobs] = React.useState<TranscriptionJob[]>([]);
  const [stats, setStats] = React.useState<QueueStats | null>(null);
  const [error, setError] = React.useState<string | null>(null);
  const [isPolling, setIsPolling] = React.useState(true);

  const pollIntervalRef = React.useRef<NodeJS.Timeout | null>(null);
  const processIntervalRef = React.useRef<NodeJS.Timeout | null>(null);
  const isProcessingRef = React.useRef(false);

  // Fetch queue status
  const fetchQueueStatus = React.useCallback(async () => {
    try {
      const response = await Queries.getData({
        route: '/api/transcription-queue/status',
        body: {},
      });

      if (response && response.success) {
        setJobs(response.jobs || []);
        setStats(response.stats || null);
        setError(null);
        return response;
      }
    } catch (err) {
      console.error('Error fetching queue status:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch queue status');
    }
    return null;
  }, []);

  // Process the next job in queue
  const processNextJob = React.useCallback(async () => {
    // Prevent multiple simultaneous processing calls
    if (isProcessingRef.current) {
      return;
    }

    try {
      isProcessingRef.current = true;

      const response = await Queries.getData({
        route: '/api/transcription-queue/process',
        body: {},
      });

      if (response) {
        // Refresh queue status after processing
        await fetchQueueStatus();
      }
    } catch (err) {
      console.error('Error processing transcription job:', err);
    } finally {
      isProcessingRef.current = false;
    }
  }, [fetchQueueStatus]);

  // Add a job to the queue
  const addJob = React.useCallback(
    async (fileName: string): Promise<string | null> => {
      try {
        const response = await Queries.getData({
          route: '/api/transcription-queue/add',
          body: { fileName },
        });

        if (response && response.success) {
          // Immediately fetch updated queue status
          await fetchQueueStatus();
          return response.jobId;
        }

        setError(response?.error || 'Failed to add job');
        return null;
      } catch (err) {
        console.error('Error adding transcription job:', err);
        setError(err instanceof Error ? err.message : 'Failed to add job');
        return null;
      }
    },
    [fetchQueueStatus]
  );

  // Cancel a job
  const cancelJob = React.useCallback(
    async (jobId: string): Promise<boolean> => {
      try {
        const response = await Queries.getData({
          route: '/api/transcription-queue/cancel',
          body: { jobId },
        });

        if (response && response.success) {
          await fetchQueueStatus();
          return true;
        }

        setError(response?.error || 'Failed to cancel job');
        return false;
      } catch (err) {
        console.error('Error cancelling transcription job:', err);
        setError(err instanceof Error ? err.message : 'Failed to cancel job');
        return false;
      }
    },
    [fetchQueueStatus]
  );

  // Get job by file name
  const getJobByFileName = React.useCallback(
    (fileName: string): TranscriptionJob | undefined => {
      return jobs.find(job => job.fileName === fileName);
    },
    [jobs]
  );

  // Poll for queue status updates
  React.useEffect(() => {
    if (!isPolling) return;

    // Initial fetch
    fetchQueueStatus();

    // Set up polling interval
    pollIntervalRef.current = setInterval(fetchQueueStatus, POLL_INTERVAL);

    return () => {
      if (pollIntervalRef.current) {
        clearInterval(pollIntervalRef.current);
      }
    };
  }, [isPolling, fetchQueueStatus]);

  // Automatically process jobs when there are items in the queue
  React.useEffect(() => {
    if (!stats) return;

    // If there's a processing job or queued jobs, start processing
    if (stats.isProcessing || stats.queueLength > 0) {
      if (!processIntervalRef.current) {
        // Initial process
        processNextJob();

        // Set up interval to keep processing
        processIntervalRef.current = setInterval(processNextJob, PROCESS_CHECK_INTERVAL);
      }
    } else {
      // No jobs to process, clear the interval
      if (processIntervalRef.current) {
        clearInterval(processIntervalRef.current);
        processIntervalRef.current = null;
      }
    }

    return () => {
      if (processIntervalRef.current) {
        clearInterval(processIntervalRef.current);
        processIntervalRef.current = null;
      }
    };
  }, [stats, processNextJob]);

  const currentJob = React.useMemo(() => {
    if (!stats?.currentJobId) return null;
    return jobs.find(job => job.jobId === stats.currentJobId) || null;
  }, [jobs, stats]);

  const isProcessing = stats?.isProcessing || false;

  return {
    jobs,
    stats,
    addJob,
    cancelJob,
    getJobByFileName,
    isProcessing,
    currentJob,
    error,
  };
}
