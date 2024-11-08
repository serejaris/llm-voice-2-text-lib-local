import styles from '@components/UploadProgressOverlay.module.scss';
import * as React from 'react';
import * as UploadTypes from '@common/upload-progress-types';

import ProgressBar from '@components/ProgressBar';
import CircularLoader from '@components/CircularLoader';

interface UploadProgressOverlayProps {
  /** Upload progress state */
  uploadState: UploadTypes.UploadProgressState;
  
  /** Callback when user cancels upload */
  onCancel: () => void;
  
  /** Callback when user dismisses overlay */
  onDismiss: () => void;
  
  /** Callback when user retries after error */
  onRetry?: () => void;
}

export default function UploadProgressOverlay({
  uploadState,
  onCancel,
  onDismiss,
  onRetry,
}: UploadProgressOverlayProps) {
  const [showConfirmCancel, setShowConfirmCancel] = React.useState(false);
  
  // Auto-dismiss on completion after delay
  React.useEffect(() => {
    if (uploadState.stage === UploadTypes.UploadStage.COMPLETE) {
      const timer = setTimeout(() => {
        onDismiss();
      }, 3000);
      return () => clearTimeout(timer);
    }
    
    if (uploadState.stage === UploadTypes.UploadStage.CANCELLED) {
      const timer = setTimeout(() => {
        onDismiss();
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [uploadState.stage, onDismiss]);
  
  // Handle keyboard events
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && uploadState.canCancel) {
        setShowConfirmCancel(true);
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [uploadState.canCancel]);
  
  const handleCancelClick = () => {
    setShowConfirmCancel(true);
  };
  
  const handleConfirmCancel = () => {
    setShowConfirmCancel(false);
    onCancel();
  };
  
  const handleCancelAbort = () => {
    setShowConfirmCancel(false);
  };
  
  const isUploading = uploadState.stage === UploadTypes.UploadStage.UPLOADING;
  const isProcessing = uploadState.stage === UploadTypes.UploadStage.EXTRACTING || 
                       uploadState.stage === UploadTypes.UploadStage.TRANSCRIBING;
  const isComplete = uploadState.stage === UploadTypes.UploadStage.COMPLETE;
  const isError = uploadState.stage === UploadTypes.UploadStage.ERROR;
  const isCancelled = uploadState.stage === UploadTypes.UploadStage.CANCELLED;
  
  const getStageIcon = (stage: UploadTypes.UploadStage, isCurrent: boolean) => {
    if (isCurrent) {
      if (stage === UploadTypes.UploadStage.COMPLETE) {
        return '✓';
      }
      if (stage === UploadTypes.UploadStage.ERROR) {
        return '✗';
      }
      return '●';
    }
    
    // Check if stage is completed (comes before current stage)
    const stages = [
      UploadTypes.UploadStage.UPLOADING,
      UploadTypes.UploadStage.EXTRACTING,
      UploadTypes.UploadStage.TRANSCRIBING,
      UploadTypes.UploadStage.COMPLETE,
    ];
    
    const currentIndex = stages.indexOf(uploadState.stage);
    const stageIndex = stages.indexOf(stage);
    
    if (stageIndex < currentIndex) {
      return '✓';
    }
    
    return '○';
  };
  
  const getOverlayClassName = () => {
    if (isComplete) return styles.overlaySuccess;
    if (isError) return styles.overlayError;
    if (isCancelled) return styles.overlayCancelled;
    return styles.overlay;
  };
  
  return (
    <div className={styles.backdrop} onClick={(e) => e.stopPropagation()}>
      <div 
        className={getOverlayClassName()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="upload-progress-title"
      >
        <h2 id="upload-progress-title" className={styles.title}>
          {isComplete && 'Upload Complete'}
          {isError && 'Upload Failed'}
          {isCancelled && 'Upload Cancelled'}
          {!isComplete && !isError && !isCancelled && 'Upload Progress'}
        </h2>
        
        {/* Stage Indicators */}
        <div className={styles.stages} role="list" aria-label="Processing stages">
          <div 
            className={`${styles.stage} ${uploadState.stage === UploadTypes.UploadStage.UPLOADING ? styles.stageCurrent : ''}`}
            role="listitem"
          >
            <span className={styles.stageIcon}>
              {getStageIcon(UploadTypes.UploadStage.UPLOADING, uploadState.stage === UploadTypes.UploadStage.UPLOADING)}
            </span>
            <span className={styles.stageName}>Uploading</span>
          </div>
          
          <div className={styles.stageArrow}>→</div>
          
          <div 
            className={`${styles.stage} ${uploadState.stage === UploadTypes.UploadStage.EXTRACTING ? styles.stageCurrent : ''}`}
            role="listitem"
          >
            <span className={styles.stageIcon}>
              {getStageIcon(UploadTypes.UploadStage.EXTRACTING, uploadState.stage === UploadTypes.UploadStage.EXTRACTING)}
            </span>
            <span className={styles.stageName}>Extracting</span>
          </div>
          
          <div className={styles.stageArrow}>→</div>
          
          <div 
            className={`${styles.stage} ${uploadState.stage === UploadTypes.UploadStage.TRANSCRIBING ? styles.stageCurrent : ''}`}
            role="listitem"
          >
            <span className={styles.stageIcon}>
              {getStageIcon(UploadTypes.UploadStage.TRANSCRIBING, uploadState.stage === UploadTypes.UploadStage.TRANSCRIBING)}
            </span>
            <span className={styles.stageName}>Transcribing</span>
          </div>
        </div>
        
        {/* File Information */}
        <div className={styles.fileInfo}>
          <div className={styles.fileName}>
            📁 {uploadState.fileName}
          </div>
          {uploadState.fileSize > 0 && (
            <div className={styles.fileSize}>
              {UploadTypes.formatBytes(uploadState.fileSize)}
            </div>
          )}
        </div>
        
        {/* Progress Bar */}
        {isUploading && (
          <ProgressBar 
            progress={uploadState.uploadProgress}
            indeterminate={false}
          />
        )}
        
        {isProcessing && (
          <div className={styles.processingIndicator}>
            <CircularLoader />
          </div>
        )}
        
        {/* Status Message */}
        <div 
          className={styles.statusMessage}
          role="status"
          aria-live="polite"
        >
          {uploadState.message}
        </div>
        
        {/* Upload Details */}
        {isUploading && uploadState.uploadedBytes > 0 && (
          <div className={styles.uploadDetails}>
            {UploadTypes.formatBytes(uploadState.uploadedBytes)} of {UploadTypes.formatBytes(uploadState.fileSize)}
          </div>
        )}
        
        {/* Time Estimation */}
        {uploadState.estimatedTimeRemaining !== null && uploadState.estimatedTimeRemaining > 0 && (
          <div className={styles.timeEstimate}>
            Estimated time remaining: {UploadTypes.formatDuration(uploadState.estimatedTimeRemaining)}
          </div>
        )}
        
        {/* Error Details */}
        {isError && uploadState.error && (
          <div 
            className={styles.errorMessage}
            role="alert"
            aria-live="assertive"
          >
            <div className={styles.errorTitle}>Error:</div>
            <div className={styles.errorText}>{uploadState.error}</div>
          </div>
        )}
        
        {/* Success Message */}
        {isComplete && (
          <div className={styles.successMessage}>
            ✓ {uploadState.fileName} uploaded and transcribed successfully!
          </div>
        )}
        
        {/* Action Buttons */}
        <div className={styles.actions}>
          {uploadState.canCancel && !showConfirmCancel && (
            <button 
              className={styles.buttonCancel}
              onClick={handleCancelClick}
              aria-label="Cancel upload"
            >
              Cancel Upload
            </button>
          )}
          
          {!uploadState.canCancel && isProcessing && (
            <div className={styles.cancelDisabledMessage}>
              Processing cannot be cancelled
            </div>
          )}
          
          {isError && onRetry && (
            <button 
              className={styles.buttonRetry}
              onClick={onRetry}
            >
              Retry Upload
            </button>
          )}
          
          {(isComplete || isError || isCancelled) && (
            <button 
              className={styles.buttonClose}
              onClick={onDismiss}
            >
              Close
            </button>
          )}
        </div>
        
        {/* Cancel Confirmation Dialog */}
        {showConfirmCancel && (
          <div className={styles.confirmDialog}>
            <div className={styles.confirmMessage}>
              Are you sure you want to cancel this upload?
            </div>
            <div className={styles.confirmActions}>
              <button 
                className={styles.buttonConfirm}
                onClick={handleConfirmCancel}
              >
                Yes, Cancel
              </button>
              <button 
                className={styles.buttonAbort}
                onClick={handleCancelAbort}
              >
                No, Continue
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
