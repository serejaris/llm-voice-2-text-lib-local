'use client';

import styles from '@components/Application.module.scss';

import * as React from 'react';
import * as Queries from '@common/api-client';
import * as Utilities from '@common/shared-utilities';
import * as Constants from '@common/constants';
import * as UploadTypes from '@common/upload-progress-types';

import CircularLoader from '@components/CircularLoader';
import ActionUploadButton from '@components/ActionUploadButton';
import FontSelector from '@components/FontSelector';
import InlineUploadProgress from '@components/InlineUploadProgress';
import { useUploadProgress } from '@common/hooks/useUploadProgress';
import { useUploadStatusPolling } from '@common/hooks/useUploadStatusPolling';
import { useTranscriptionQueue, TranscriptionStatus } from '@common/hooks/useTranscriptionQueue';

const Action = (props) => {
  if (props.disabled) {
    return <span className={styles.actionDisabled}>{props.children}</span>;
  }

  return <span className={styles.action} {...props} />;
};

const File = (props) => {
  if (props.selected) {
    return <div className={styles.selectedFile}>{props.children}</div>;
  }

  return <div className={styles.file} {...props} />;
};

const TranscriptionCopy = (props) => {
  const { style, ...rest } = props;
  return <div className={styles.copyTranscription} style={style} {...rest} />;
};

export default function Application({ children }: { children?: React.ReactNode }) {
  const [current, setCurrent] = React.useState('');
  const [files, setFiles] = React.useState<string[]>([]);
  const [uploading, setUploading] = React.useState(true);
  const [transcription, setTranscription] = React.useState('');
  const [transcriptionFont, setTranscriptionFont] = React.useState(Constants.DEFAULT_TRANSCRIPTION_FONT);

  // Transcription queue management
  const {
    jobs: transcriptionJobs,
    stats: queueStats,
    addJob: addTranscriptionJob,
    getJobByFileName,
    isProcessing: isQueueProcessing,
    currentJob,
  } = useTranscriptionQueue();

  // Upload progress management
  const {
    uploadState,
    initializeUpload,
    updateProgress,
    transitionToStage,
    handleSuccess,
    handleError,
    cancelUpload,
    resetUpload,
  } = useUploadProgress();
  
  // Upload status polling
  const { startPolling, stopPolling } = useUploadStatusPolling({
    onStatusChange: (status) => {
      transitionToStage(status.stage, status.message);
    },
    onComplete: async (filename) => {
      handleSuccess();
      // Refresh file list after successful upload (audio extraction complete)
      const response = await Queries.getData({ route: '/api/list' });
      if (response) {
        setFiles(response.data);
      }
      setUploading(false);
      // Note: NOT setting transcribing to false - upload is done, but transcription is manual
    },
    onError: (error) => {
      handleError(error);
      setUploading(false);
    },
  });

  // Handle upload start
  const handleUploadStart = React.useCallback((data: { fileName: string; fileSize: number; uploadId: string }) => {
    const abortController = initializeUpload(data);
    setUploading(true);
    // Don't set transcribing - upload and transcription are separate
  }, [initializeUpload]);
  
  // Handle upload progress
  const handleUploadProgress = React.useCallback((progressEvent: UploadTypes.UploadProgressEvent) => {
    updateProgress(progressEvent);
  }, [updateProgress]);
  
  // Handle stage change
  const handleStageChange = React.useCallback((stage: UploadTypes.UploadStage) => {
    transitionToStage(stage);
    
    // Start polling when upload completes and extraction begins (for video files)
    if (stage === UploadTypes.UploadStage.EXTRACTING) {
      if (uploadState.uploadId) {
        startPolling(uploadState.uploadId);
      }
    }
  }, [transitionToStage, uploadState.uploadId, startPolling]);
  
  // Handle upload success
  const handleUploadSuccess = React.useCallback(async ({ data }: any) => {
    // Upload complete - refresh file list and stop upload state
    handleSuccess();
    const response = await Queries.getData({ route: '/api/list' });
    if (response) {
      setFiles(response.data);
    }
    setUploading(false);
    // Transcription is a manual operation - user clicks "Transcribe" button
  }, [handleSuccess]);
  
  // Handle upload error
  const handleUploadError = React.useCallback((error: string) => {
    handleError(error);
    setUploading(false);
    stopPolling();
  }, [handleError, stopPolling]);
  
  // Handle upload cancel
  const handleUploadCancel = React.useCallback(() => {
    cancelUpload();
    setUploading(false);
    stopPolling();
  }, [cancelUpload, stopPolling]);

  async function onSelect(name) {
    setCurrent(name);
    setUploading(false);

    // Check if there's a completed transcription for this file
    const job = getJobByFileName(name);
    if (job && job.status === TranscriptionStatus.COMPLETED && job.transcription) {
      setTranscription(job.transcription);
    } else {
      // Load transcription from file if exists
      const response = await Queries.getData({ route: '/api/get-transcription', body: { name } });
      setTranscription(response ? response.data : '');
    }
  }

  React.useEffect(() => {
    async function init() {
      const response = await Queries.getData({ route: '/api/list' });

      if (!response) {
        return;
      }

      setFiles(response.data);
      setUploading(false);
    }

    init();
  }, []);

  // Load font preference from localStorage
  React.useEffect(() => {
    const savedFont = Utilities.getFontPreference(
      Constants.TRANSCRIPTION_FONT_STORAGE_KEY,
      Constants.DEFAULT_TRANSCRIPTION_FONT
    );
    setTranscriptionFont(savedFont);
  }, []);

  // Handle font change and persist to localStorage
  const handleFontChange = (newFont: string) => {
    setTranscriptionFont(newFont);
    Utilities.setFontPreference(Constants.TRANSCRIPTION_FONT_STORAGE_KEY, newFont);
  };

  // Auto-update transcription when current file's job completes
  React.useEffect(() => {
    if (!current) return;

    const job = getJobByFileName(current);
    if (job && job.status === TranscriptionStatus.COMPLETED && job.transcription) {
      setTranscription(job.transcription);
    }
  }, [current, transcriptionJobs, getJobByFileName]);

  return (
    <div className={styles.root}>
      <div className={styles.column}>
        <div className={styles.section}>
          <div className={styles.top}>
            <ActionUploadButton
              disabled={uploading}
              onUploadStart={handleUploadStart}
              onProgress={handleUploadProgress}
              onStageChange={handleStageChange}
              onSuccess={handleUploadSuccess}
              onError={handleUploadError}
              onCancel={handleUploadCancel}
              abortController={uploadState.abortController}
            />
          </div>
          
          {/* Inline Upload Progress */}
          {uploadState.active && (
            <InlineUploadProgress uploadState={uploadState} />
          )}
          <div className={styles.bottom}>
            {uploading ? (
              <>
                <CircularLoader />
                <div className={styles.caption}>PLEASE WAIT</div>
              </>
            ) : (
              [...files]

                .filter((each) => each.toLowerCase().endsWith('.wav'))
                .sort((a, b) => a.localeCompare(b, undefined, { sensitivity: 'base' }))
                .map((each) => {
                  const job = getJobByFileName(each);
                  let statusIndicator = '⭢';

                  if (job) {
                    if (job.status === TranscriptionStatus.QUEUED) {
                      statusIndicator = `⏳ [${job.queuePosition}]`;
                    } else if (job.status === TranscriptionStatus.PROCESSING) {
                      statusIndicator = '⚙️';
                    } else if (job.status === TranscriptionStatus.COMPLETED) {
                      statusIndicator = '✓';
                    } else if (job.status === TranscriptionStatus.ERROR) {
                      statusIndicator = '✗';
                    }
                  }

                  return (
                    <File
                      key={each}
                      selected={each === current}
                      onClick={async () => {
                        if (uploading) {
                          alert('Please wait until the upload is complete.');
                          return;
                        }
                        await onSelect(each);
                      }}
                    >
                      {statusIndicator} {each}
                    </File>
                  );
                })
            )}
          </div>
        </div>
      </div>
      <div className={styles.column}>
        <div className={styles.section}>
          <div className={styles.top}>
            <Action
              disabled={uploading}
              onClick={async () => {
                if (Utilities.isEmpty(current)) {
                  alert('You need to select an audio file to create a transcription.');
                  return;
                }

                // Check if already queued or processing
                const existingJob = getJobByFileName(current);
                if (existingJob) {
                  if (existingJob.status === TranscriptionStatus.QUEUED) {
                    alert(`${current} is already queued for transcription (position ${existingJob.queuePosition}).`);
                    return;
                  } else if (existingJob.status === TranscriptionStatus.PROCESSING) {
                    alert(`${current} is currently being transcribed. Please wait...`);
                    return;
                  } else if (existingJob.status === TranscriptionStatus.COMPLETED) {
                    const confirm = window.confirm(
                      `${current} has already been transcribed. Do you want to transcribe it again?`
                    );
                    if (!confirm) return;
                  }
                }

                // Add to queue
                const jobId = await addTranscriptionJob(current);
                if (jobId) {
                  const job = getJobByFileName(current);
                  if (job && job.queuePosition) {
                    alert(`${current} has been added to the transcription queue (position ${job.queuePosition}).`);
                  } else {
                    alert(`${current} has been added to the transcription queue.`);
                  }
                }
              }}
            >
              ◎ Transcribe
            </Action>

            <FontSelector
              disabled={uploading}
              selectedFont={transcriptionFont}
              onFontChange={handleFontChange}
            />
          </div>
          <div className={styles.bottom}>
            <TranscriptionCopy style={{ '--font-transcription': transcriptionFont } as React.CSSProperties}>
              {(() => {
                const currentFileJob = current ? getJobByFileName(current) : null;

                if (currentFileJob) {
                  if (currentFileJob.status === TranscriptionStatus.PROCESSING) {
                    return (
                      <>
                        <CircularLoader />
                        <div className={styles.caption}>TRANSCRIBING...</div>
                      </>
                    );
                  } else if (currentFileJob.status === TranscriptionStatus.QUEUED) {
                    return (
                      <div className={styles.caption}>
                        Queued for transcription (position {currentFileJob.queuePosition})
                        {queueStats && queueStats.queueLength > 0 && (
                          <div style={{ marginTop: '10px', fontSize: '0.9em' }}>
                            {queueStats.queueLength} job(s) in queue
                          </div>
                        )}
                      </div>
                    );
                  } else if (currentFileJob.status === TranscriptionStatus.ERROR) {
                    return (
                      <div className={styles.caption} style={{ color: '#ff6b6b' }}>
                        Transcription failed: {currentFileJob.error || 'Unknown error'}
                      </div>
                    );
                  }
                }

                return transcription || (
                  <div className={styles.caption} style={{ opacity: 0.5 }}>
                    No transcription available. Click "Transcribe" to start.
                  </div>
                );
              })()}
            </TranscriptionCopy>
          </div>
        </div>
      </div>
    </div>
  );
}
