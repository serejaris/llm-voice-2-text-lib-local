import fs from 'fs/promises';
import path from 'path';

import * as Server from '@common/server';
import * as FileSystem from '@common/server/file-system';
import * as ApiResponses from '@common/server/api-responses';
import { transcribeAudioFile } from '@common/server/whisper-config';
import { validateFileType, FileType, getUnsupportedFileMessage } from '@common/server/file-type-validator';
import { extractAudioFromVideo, getConfigFromEnv } from '@common/server/video-processor';
import { setUploadStatus } from '@common/server/upload-status-manager';
import { UploadStage } from '@common/upload-progress-types';

export const config = {
  api: {
    responseLimit: false,
    bodyParser: false,
  },
  maxDuration: 300, // 5 minutes (can be increased up to 60 for Pro plan, 900 for Enterprise)
};

export default async function apiUpload(req, res) {
  await Server.cors(req, res);

  if (req.method !== 'POST') {
    return ApiResponses.methodNotAllowedResponse(res, ['POST']);
  }

  const contentType = req.headers['content-type'] || '';
  const match = contentType.match(/boundary=(.*)$/);
  if (!match) {
    return ApiResponses.badRequestResponse(res, 'Missing boundary');
  }

  const boundary = match[1];
  const chunks: Buffer[] = [];
  for await (const chunk of req) {
    chunks.push(chunk as Buffer);
  }

  const buffer = Buffer.concat(chunks);
  const boundaryBuffer = Buffer.from(`--${boundary}`, 'utf-8');
  const headerBoundaryIndex = buffer.indexOf(boundaryBuffer);
  if (headerBoundaryIndex === -1) {
    return ApiResponses.badRequestResponse(res, 'Invalid multipart data');
  }

  const partHeaderStart = headerBoundaryIndex + boundaryBuffer.length + 2;
  const headerEndIndex = buffer.indexOf(Buffer.from('\r\n\r\n', 'utf-8'), partHeaderStart);
  if (headerEndIndex === -1) {
    return ApiResponses.badRequestResponse(res, 'Invalid multipart format');
  }

  const headerPart = buffer.slice(partHeaderStart, headerEndIndex).toString('utf-8');
  const filenameMatch = headerPart.match(/filename="([^"]+)"/);
  if (!filenameMatch) {
    return ApiResponses.badRequestResponse(res, 'No filename found in upload');
  }

  const filename = path.basename(filenameMatch[1]);
  const nextBoundaryBuffer = Buffer.from(`\r\n--${boundary}`, 'utf-8');
  const nextBoundaryIndex = buffer.indexOf(nextBoundaryBuffer, headerEndIndex + 4);
  if (nextBoundaryIndex === -1) {
    return ApiResponses.badRequestResponse(res, 'Invalid multipart boundary');
  }

  const fileStart = headerEndIndex + 4;
  const fileEnd = nextBoundaryIndex;
  const fileBuffer = buffer.slice(fileStart, fileEnd);

  // Extract uploadId from headers if present
  const uploadId = req.headers['x-upload-id'] as string | undefined;

  // Log file upload statistics
  console.log(`File upload stats:
  - Filename: ${filename}
  - Buffer size: ${fileBuffer.length} bytes (${(fileBuffer.length / 1024 / 1024).toFixed(2)} MB)
  - Total buffer size: ${buffer.length} bytes (${(buffer.length / 1024 / 1024).toFixed(2)} MB)`);

  // Validate Content-Length to detect incomplete uploads
  const contentLength = req.headers['content-length'];
  if (contentLength) {
    const expectedSize = parseInt(contentLength, 10);
    const receivedSize = buffer.length;
    
    if (receivedSize < expectedSize * 0.95) { // Allow 5% tolerance for multipart overhead
      console.warn(`WARNING: Incomplete upload detected!
  - Expected: ${expectedSize} bytes (${(expectedSize / 1024 / 1024).toFixed(2)} MB)
  - Received: ${receivedSize} bytes (${(receivedSize / 1024 / 1024).toFixed(2)} MB)
  - Difference: ${((expectedSize - receivedSize) / 1024 / 1024).toFixed(2)} MB missing`);
      
      if (uploadId) {
        setUploadStatus(uploadId, {
          stage: UploadStage.ERROR,
          message: 'Incomplete file upload',
          error: `Only received ${((receivedSize / expectedSize) * 100).toFixed(1)}% of the file. Please try uploading again.`,
        });
      }
      
      return ApiResponses.badRequestResponse(res, `Incomplete file upload. Received ${((receivedSize / expectedSize) * 100).toFixed(1)}% of the file.`);
    }
    
    console.log(`✓ Upload validation passed: received ${((receivedSize / expectedSize) * 100).toFixed(1)}% of expected size`);
  }

  // Validate file type
  const validation = validateFileType(filename);
  
  if (!validation.isSupported) {
    if (uploadId) {
      setUploadStatus(uploadId, {
        stage: UploadStage.ERROR,
        message: 'Unsupported file type',
        error: getUnsupportedFileMessage(validation.extension),
      });
    }
    return ApiResponses.badRequestResponse(res, getUnsupportedFileMessage(validation.extension));
  }

  try {
    let audioFilePath: string;
    let audioFilename: string;

    if (validation.fileType === FileType.AUDIO) {
      // Handle audio file - existing flow
      audioFilename = validation.originalFilename;
      audioFilePath = FileSystem.getPublicFilePath(audioFilename);
      await fs.writeFile(audioFilePath, fileBuffer);
      
      // Audio upload complete - no need to update status, will complete below
    } else if (validation.fileType === FileType.VIDEO) {
      // Handle video file - extract audio
      console.log('Processing video file:', validation.originalFilename);
      
      // Update status: extracting audio
      if (uploadId) {
        setUploadStatus(uploadId, {
          stage: UploadStage.EXTRACTING,
          message: 'Extracting audio from video...',
        });
      }
      
      const videoConfig = getConfigFromEnv();
      const result = await extractAudioFromVideo(fileBuffer, validation.originalFilename, videoConfig);
      
      if (!result.success || !result.audioFilePath || !result.audioFilename) {
        console.error('Video processing failed:', result.error);
        
        if (uploadId) {
          setUploadStatus(uploadId, {
            stage: UploadStage.ERROR,
            message: 'Failed to extract audio from video',
            error: result.error || 'Unknown error',
          });
        }
        
        return ApiResponses.serverErrorResponse(res, result.error || 'Failed to extract audio from video');
      }
      
      audioFilePath = result.audioFilePath;
      audioFilename = result.audioFilename;
      console.log('Audio extracted successfully:', audioFilename);
      
      // Extraction complete - no need to update status, will complete below
    } else {
      if (uploadId) {
        setUploadStatus(uploadId, {
          stage: UploadStage.ERROR,
          message: 'Unsupported file type',
          error: 'Unsupported file type',
        });
      }
      return ApiResponses.badRequestResponse(res, 'Unsupported file type');
    }

    // DO NOT transcribe automatically - just return the audio filename
    // User will manually trigger transcription from the UI
    console.log('Upload complete, audio file ready:', audioFilename);
    
    // Update status: complete
    if (uploadId) {
      setUploadStatus(uploadId, {
        stage: UploadStage.COMPLETE,
        message: 'Upload complete',
        complete: true,
        filename: audioFilename,
      });
    }

    return ApiResponses.successResponse(res, {
      filename: audioFilename,
      originalFilename: filename,
      fileType: validation.fileType === FileType.AUDIO ? 'audio' : 'video',
      stages: validation.fileType === FileType.VIDEO 
        ? ['upload', 'extraction']
        : ['upload'],
    });
  } catch (error) {
    console.error('Upload error:', error);
    
    if (uploadId) {
      setUploadStatus(uploadId, {
        stage: UploadStage.ERROR,
        message: 'Failed to process upload',
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
    
    return ApiResponses.serverErrorResponse(res, 'Failed to process upload');
  }
}
