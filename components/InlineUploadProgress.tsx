import styles from '@components/InlineUploadProgress.module.scss';
import * as React from 'react';
import * as UploadTypes from '@common/upload-progress-types';

interface InlineUploadProgressProps {
  uploadState: UploadTypes.UploadProgressState;
}

export default function InlineUploadProgress({ uploadState }: InlineUploadProgressProps) {
  if (!uploadState.active) {
    return null;
  }

  const isUploading = uploadState.stage === UploadTypes.UploadStage.UPLOADING;
  const isProcessing =
    uploadState.stage === UploadTypes.UploadStage.EXTRACTING ||
    uploadState.stage === UploadTypes.UploadStage.TRANSCRIBING;
  const progress = uploadState.uploadProgress;

  return (
    <div className={styles.container}>
      <div className={styles.progressBar}>
        <div
          className={`${styles.progressFill} ${isProcessing ? styles.indeterminate : ''}`}
          style={!isProcessing ? { width: `${progress}%` } : undefined}
        />
      </div>
      <div className={styles.info}>
        <span className={styles.fileName}>{uploadState.fileName}</span>
        {isUploading && (
          <span className={styles.percentage}>{Math.round(progress)}%</span>
        )}
        {isProcessing && (
          <span className={styles.status}>{uploadState.message}</span>
        )}
      </div>
    </div>
  );
}
