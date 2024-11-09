'use client';

import styles from '@components/Application.module.scss';

import * as React from 'react';
import * as Queries from '@common/api-client';
import * as Utilities from '@common/shared-utilities';
import * as Constants from '@common/constants';
import * as UploadTypes from '@common/upload-progress-types';

import CircularLoader from '@components/CircularLoader';
import ActionUploadButton from '@components/ActionUploadButton';
import TextArea from '@components/TextArea';
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

const Copy = (props) => {
  return <div className={styles.copy} {...props} />;
};

const TranscriptionCopy = (props) => {
  const { style, ...rest } = props;
  return <div className={styles.copyTranscription} style={style} {...rest} />;
};

const Prompt = (props) => {
  return <TextArea value={props.value} onChange={props.onChange}></TextArea>;
};

export default function Application({ children }: { children?: React.ReactNode }) {
  const [prompt, setPrompt] = React.useState('');
  const [current, setCurrent] = React.useState('');
  const [files, setFiles] = React.useState<string[]>([]);
  const [uploading, setUploading] = React.useState(true);
  const [transcribing, setTranscribing] = React.useState(false);
  const [introspecting, setIntrospecting] = React.useState(false);
  const [transcription, setTranscription] = React.useState('');
  const [introspection, setIntrospection] = React.useState('');
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
      setTranscribing(false);
    },
  });

  // Handle upload start
  const handleUploadStart = React.useCallback((data: { fileName: string; fileSize: number; uploadId: string }) => {
    const abortController = initializeUpload(data);
    setUploading(true);
    // Don't set transcribing - upload and transcription are separate
    setIntrospection('');
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
    // Don't set transcribing or introspecting - those are manual operations
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

  async function onSelect(name) {
    setCurrent(name);
    setUploading(false);
    setTranscribing(true);
    setIntrospecting(true);

    const response = await Queries.getData({ route: '/api/get-transcription', body: { name } });

    setTranscription(response ? response.data : '');

    const introspectionResponse = await Queries.getData({ route: '/api/get-introspection', body: { name } });

    setIntrospection(introspectionResponse ? introspectionResponse.data : '');

    setTranscribing(false);
    setIntrospecting(false);
  }

  React.useEffect(() => {
    async function init() {
      const promptResponse = await Queries.getData({ route: '/api/get-prompt' });
      if (promptResponse) {
        setPrompt(promptResponse.data);
      }

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

  return (
    <div className={styles.root}>
      <div className={styles.column}>
        <div className={styles.section}>
          <div className={styles.top}>
            <ActionUploadButton
              disabled={uploading || transcribing || introspecting}
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
                      if (uploading || transcribing || introspecting) {
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
              disabled={uploading || transcribing || introspecting}
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
                const response = await Queries.getData({ route: '/api/transcribe', body: { name: current } });

                const transcriptionResponse = await Queries.getData({ route: '/api/get-transcription', body: { name: current } });

                setTranscription(transcriptionResponse ? transcriptionResponse.data : '');

                setTranscribing(false);
              }}
            >
              ◎ Transcribe
            </Action>

            {Utilities.isEmpty(transcription) ? null : (
              <Action
                disabled={uploading || transcribing || introspecting}
                onClick={async () => {
                  const confirm = window.confirm('Are you sure you want to introspect on this transcript? This process may take over 5 minutes.');

                  if (!confirm) {
                    return;
                  }

                  if (Utilities.isEmpty(current)) {
                    alert('You need to select an audio file to run a transcription.');
                    return;
                  }

                  setIntrospecting(true);

                  const response = await Queries.getData({ route: '/api/introspect', body: { name: current } });
                  setIntrospection(response ? response.data : '');
                  setIntrospecting(false);
                }}
              >
                ◎ Introspect
              </Action>
            )}

            <FontSelector
              disabled={uploading || transcribing || introspecting}
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
      <div className={styles.wide}>
        <div className={styles.section}>
          <div className={styles.top}>
            <Action
              disabled={uploading || transcribing || introspecting}
              onClick={async () => {
                const response = await Queries.getData({ route: '/api/update-prompt', body: { prompt } });

                if (response) {
                  alert('Your new prompt is saved.');
                }
              }}
            >
              ◎ Update Default Prompt
            </Action>
          </div>
          <div className={styles.middle}>
            <Prompt value={prompt} onChange={(e) => setPrompt(e.target.value)}></Prompt>
          </div>
          <div className={styles.bottom}>
            <Copy>
              {introspecting ? (
                <>
                  <CircularLoader />
                  <div className={styles.caption}>PLEASE WAIT</div>
                </>
              ) : (
                introspection
              )}
            </Copy>
          </div>
        </div>
      </div>
    </div>
  );
}
