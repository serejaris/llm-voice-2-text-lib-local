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
  const [transcribing, setTranscribing] = React.useState(false);
  const [transcription, setTranscription] = React.useState('');
  const [transcriptionFont, setTranscriptionFont] = React.useState(Constants.DEFAULT_TRANSCRIPTION_FONT);
  
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

      // If we were transcribing, load the new transcription
      if (uploadState.stage === UploadTypes.UploadStage.TRANSCRIBING) {
        const transcriptionResponse = await Queries.getData({
          route: '/api/get-transcription',
          body: { name: filename }
        });
        setTranscription(transcriptionResponse ? transcriptionResponse.data : '');
        setTranscribing(false);
      }

      // Refresh file list after successful upload (audio extraction complete)
      const response = await Queries.getData({ route: '/api/list' });
      if (response) {
        setFiles(response.data);
      }
      setUploading(false);
    },
    onError: (error) => {
      handleError(error);
      setUploading(false);
      setTranscribing(false);
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
    setTranscribing(false);
    stopPolling();
  }, [handleError, stopPolling]);
  
  // Handle upload cancel
  const handleUploadCancel = React.useCallback(() => {
    cancelUpload();
    setUploading(false);
    stopPolling();
  }, [cancelUpload, stopPolling]);

  // Handle transcription start
  const handleTranscribeStart = React.useCallback(async (fileName: string) => {
    const uploadId = UploadTypes.generateUploadId();

    // Initialize upload state for transcription
    initializeUpload({
      fileName,
      fileSize: 0, // File already on server
      uploadId,
    });

    // Transition to transcribing stage
    transitionToStage(UploadTypes.UploadStage.TRANSCRIBING, 'Transcribing audio...');

    // Start polling for transcription status
    startPolling(uploadId);

    // Start transcription on server
    await Queries.getData({ route: '/api/transcribe', body: { name: fileName, uploadId } });
  }, [initializeUpload, transitionToStage, startPolling]);

  async function onSelect(name) {
    setCurrent(name);
    setUploading(false);
    setTranscribing(true);

    const response = await Queries.getData({ route: '/api/get-transcription', body: { name } });

    setTranscription(response ? response.data : '');

    setTranscribing(false);
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

  // Handle download transcription
  const handleDownload = () => {
    if (Utilities.isEmpty(transcription)) {
      alert('No transcription available to download.');
      return;
    }

    // Create a blob from the transcription text
    const blob = new Blob([transcription], { type: 'text/plain;charset=utf-8' });

    // Create a download link
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;

    // Use the current filename (without .wav extension) for the download
    const filename = current ? current.replace(/\.wav$/i, '.txt') : 'transcription.txt';
    link.download = filename;

    // Trigger download
    document.body.appendChild(link);
    link.click();

    // Clean up
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div className={styles.root}>
      <div className={styles.column}>
        <div className={styles.section}>
          <div className={styles.top}>
            <ActionUploadButton
              disabled={uploading || transcribing}
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
                .map((each) => (
                  <File
                    key={each}
                    selected={each === current}
                    onClick={async () => {
                      if (uploading || transcribing) {
                        alert('You need to wait till we finish our current task.');
                        return;
                      }
                      await onSelect(each);
                    }}
                  >
                    ⭢ {each}
                  </File>
                ))
            )}
          </div>
        </div>
      </div>
      <div className={styles.column}>
        <div className={styles.section}>
          <div className={styles.top}>
            <Action
              disabled={uploading || transcribing || uploadState.active}
              onClick={async () => {
                const confirm = window.confirm(`Are you sure you want to transcribe ${current}? This process may take over 5 minutes.`);

                if (!confirm) {
                  return;
                }

                if (Utilities.isEmpty(current)) {
                  alert('You need to select an audio file to create a transcription.');
                  return;
                }

                setTranscribing(true);
                await handleTranscribeStart(current);
              }}
            >
              ◎ Transcribe
            </Action>

            <Action
              disabled={uploading || transcribing || Utilities.isEmpty(transcription)}
              onClick={handleDownload}
            >
              ⭳ Download
            </Action>

            <FontSelector
              disabled={uploading || transcribing}
              selectedFont={transcriptionFont}
              onFontChange={handleFontChange}
            />
          </div>
          <div className={styles.bottom}>
            <TranscriptionCopy style={{ '--font-transcription': transcriptionFont } as React.CSSProperties}>
              {transcribing ? (
                <>
                  <CircularLoader />
                  <div className={styles.caption}>PLEASE WAIT</div>
                </>
              ) : (
                transcription
              )}
            </TranscriptionCopy>
          </div>
        </div>
      </div>
    </div>
  );
}
