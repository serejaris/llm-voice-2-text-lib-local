/**
 * Upload Status Polling Hook
 * 
 * Polls the server for upload processing status updates
 */

import * as React from 'react';
import * as UploadTypes from '@common/upload-progress-types';
import * as Queries from '@common/api-client';

interface UseUploadStatusPollingOptions {
  /** Polling interval in milliseconds */
  pollingInterval?: number;
  
  /** Callback when status changes */
  onStatusChange?: (status: UploadTypes.UploadStatusResponse) => void;
  
  /** Callback when polling completes */
  onComplete?: (filename: string) => void;
  
  /** Callback when error occurs */
  onError?: (error: string) => void;
}

export function useUploadStatusPolling(options: UseUploadStatusPollingOptions = {}) {
  const { 
    pollingInterval = 2000,
    onStatusChange,
    onComplete,
    onError,
  } = options;
  
  const [isPolling, setIsPolling] = React.useState(false);
  const pollingIntervalRef = React.useRef<NodeJS.Timeout | null>(null);
  const uploadIdRef = React.useRef<string | null>(null);
  
  /**
   * Start polling for upload status
   */
  const startPolling = React.useCallback((uploadId: string) => {
    uploadIdRef.current = uploadId;
    setIsPolling(true);
    
    const poll = async () => {
      if (!uploadIdRef.current) {
        return;
      }
      
      try {
        const response = await Queries.getData({
          route: '/api/upload-status',
          body: { uploadId: uploadIdRef.current },
        });
        
        if (!response || !response.data) {
          // Status not found yet, continue polling
          return;
        }
        
        const status: UploadTypes.UploadStatusResponse = response.data;
        
        // Notify status change
        if (onStatusChange) {
          onStatusChange(status);
        }
        
        // Check if complete
        if (status.complete) {
          stopPolling();
          
          if (onComplete && status.filename) {
            onComplete(status.filename);
          }
        }
        
        // Check if error
        if (status.stage === UploadTypes.UploadStage.ERROR && status.error) {
          stopPolling();
          
          if (onError) {
            onError(status.error);
          }
        }
      } catch (error) {
        console.error('Error polling upload status:', error);
        // Continue polling even on error
      }
    };
    
    // Start polling
    poll(); // Initial poll
    pollingIntervalRef.current = setInterval(poll, pollingInterval);
  }, [pollingInterval, onStatusChange, onComplete, onError]);
  
  /**
   * Stop polling
   */
  const stopPolling = React.useCallback(() => {
    if (pollingIntervalRef.current) {
      clearInterval(pollingIntervalRef.current);
      pollingIntervalRef.current = null;
    }
    
    uploadIdRef.current = null;
    setIsPolling(false);
  }, []);
  
  // Cleanup on unmount
  React.useEffect(() => {
    return () => {
      stopPolling();
    };
  }, [stopPolling]);
  
  return {
    isPolling,
    startPolling,
    stopPolling,
  };
}
