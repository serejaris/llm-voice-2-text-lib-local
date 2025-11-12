import type { NextApiRequest, NextApiResponse } from 'next';

import * as Server from '@common/server';
import * as Utilities from '@common/shared-utilities';
import * as FileSystem from '@common/server/file-system';
import * as ApiResponses from '@common/server/api-responses';
import { transcribeAudioFile } from '@common/server/whisper-config';
import { setUploadStatus } from '@common/server/upload-status-manager';
import { UploadStage } from '@common/upload-progress-types';

export const config = {
  api: {
    responseLimit: false,
  },
};

export default async function apiTranscribe(req: NextApiRequest, res: NextApiResponse) {
  await Server.cors(req, res);

  if (req.method !== 'POST') {
    return ApiResponses.methodNotAllowedResponse(res, ['POST']);
  }

  const { name, uploadId } = req.body || {};

  if (Utilities.isEmpty(name)) {
    return ApiResponses.badRequestResponse(res, 'File name is required');
  }

  try {
    const destPath = FileSystem.getPublicFilePath(name);

    // Check if file exists
    if (!FileSystem.fileExists(destPath)) {
      return ApiResponses.notFoundResponse(res, `Audio file '${name}' not found`);
    }

    // Update status: transcribing
    if (uploadId) {
      setUploadStatus(uploadId, {
        stage: UploadStage.TRANSCRIBING,
        message: 'Transcribing audio...',
      });
    }

    // Transcribe using centralized configuration
    await transcribeAudioFile(destPath);

    // Update status: complete
    if (uploadId) {
      setUploadStatus(uploadId, {
        stage: UploadStage.COMPLETE,
        message: 'Transcription complete',
        complete: true,
        filename: name,
      });
    }

    return ApiResponses.successResponse(res, destPath);
  } catch (error) {
    console.error('Transcription error:', error);

    // Update status: error
    if (uploadId) {
      setUploadStatus(uploadId, {
        stage: UploadStage.ERROR,
        message: 'Transcription failed',
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }

    return ApiResponses.serverErrorResponse(res, 'Failed to transcribe audio file');
  }
}
