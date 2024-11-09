import styles from '@components/ActionUploadButton.module.scss';

import * as Constants from '@common/constants';
import * as React from 'react';
import * as UploadTypes from '@common/upload-progress-types';

interface UploadActionButtonProps {
  disabled?: boolean;
  onUploadStart?: (data: { fileName: string; fileSize: number; uploadId: string }) => void;
  onProgress?: (data: UploadTypes.UploadProgressEvent) => void;
  onStageChange?: (stage: UploadTypes.UploadStage) => void;
  onSuccess?: (data: any) => void;
  onError?: (error: string) => void;
  onCancel?: () => void;
  abortController?: AbortController | null;
}

export default function UploadActionButton(props: UploadActionButtonProps) {
  const inputRef = React.useRef<HTMLInputElement>(null);

  if (props.disabled) {
    return (
      <span className={styles.rootDisabled}>
        <button className={styles.buttonDisabled}>◎ Upload Audio/Video</button>
      </span>
    );
  }

  return (
    <form
      className={styles.root}
      onSubmit={async (e) => {
        e.preventDefault();
      }}
    >
      <input
        ref={inputRef}
        className={styles.input}
        type="file"
        accept="audio/*,video/*"
        onChange={async (e) => {
          e.preventDefault();
          
          let file = e.target.files?.[0] || null;
          if (!file) {
            if (props.onError) {
              props.onError('You need to provide an audio or video file.');
            } else {
              alert('You need to provide an audio or video file.');
            }
            return;
          }

          const uploadId = UploadTypes.generateUploadId();
          const formData = new FormData();
          formData.append('file', file);

          // Notify upload start
          if (props.onUploadStart) {
            props.onUploadStart({
              fileName: file.name,
              fileSize: file.size,
              uploadId,
            });
          }

          try {
            // Create XMLHttpRequest for progress tracking
            const xhr = new XMLHttpRequest();

            // Track upload progress
            xhr.upload.addEventListener('progress', (event) => {
              if (event.lengthComputable && props.onProgress) {
                props.onProgress({
                  loaded: event.loaded,
                  total: event.total,
                });
              }
            });

            // Handle upload completion
            xhr.addEventListener('load', async () => {
              if (xhr.status >= 200 && xhr.status < 300) {
                try {
                  const json = JSON.parse(xhr.responseText);
                  
                  // Determine if video file to set appropriate stage
                  const isVideo = file.type.startsWith('video/');
                  
                  // For video files, transition to EXTRACTING stage
                  // For audio files, upload is complete - no automatic transcription
                  if (isVideo && props.onStageChange) {
                    props.onStageChange(UploadTypes.UploadStage.EXTRACTING);
                  }
                  
                  // Note: Stage transitions for extraction will be handled by polling
                  // Upload is complete when we get success response
                  
                  if (props.onSuccess) {
                    await props.onSuccess({ data: json });
                  }
                } catch (parseError) {
                  console.error('Failed to parse response:', parseError);
                  if (props.onError) {
                    props.onError('Invalid response from server');
                  }
                }
              } else {
                const errorMessage = `Upload failed with status ${xhr.status}`;
                console.error(errorMessage);
                if (props.onError) {
                  props.onError(errorMessage);
                }
              }
            });

            // Handle network errors
            xhr.addEventListener('error', () => {
              const errorMessage = 'Network error during upload';
              console.error(errorMessage);
              if (props.onError) {
                props.onError(errorMessage);
              }
            });

            // Handle abort
            xhr.addEventListener('abort', () => {
              if (props.onCancel) {
                props.onCancel();
              }
            });

            // Check if abort controller is provided and set up abort listener
            if (props.abortController) {
              props.abortController.signal.addEventListener('abort', () => {
                xhr.abort();
              });
            }

            // Send the request with uploadId header
            xhr.open('POST', '/api/upload');
            xhr.setRequestHeader('X-Upload-Id', uploadId);
            xhr.send(formData);
          } catch (error) {
            console.error('Upload error:', error);
            if (props.onError) {
              props.onError(error instanceof Error ? error.message : 'Upload failed');
            }
          }
          
          // Reset input value to allow re-uploading same file
          e.target.value = '';
        }}
      />
      <button className={styles.button} type="button" onClick={() => inputRef.current?.click()}>
        ◎ Upload Audio/Video
      </button>
    </form>
  );
}
