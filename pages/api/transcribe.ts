import type { NextApiRequest, NextApiResponse } from 'next';

import * as Server from '@common/server';
import * as Utilities from '@common/shared-utilities';
import * as FileSystem from '@common/server/file-system';
import * as ApiResponses from '@common/server/api-responses';
import { transcribeAudioFile } from '@common/server/whisper-config';

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

  const { name } = req.body || {};

  if (Utilities.isEmpty(name)) {
    return ApiResponses.badRequestResponse(res, 'File name is required');
  }

  try {
    const destPath = FileSystem.getPublicFilePath(name);

    // Check if file exists
    if (!FileSystem.fileExists(destPath)) {
      return ApiResponses.notFoundResponse(res, `Audio file '${name}' not found`);
    }

    // Transcribe using centralized configuration
    await transcribeAudioFile(destPath);

    return ApiResponses.successResponse(res, destPath);
  } catch (error) {
    console.error('Transcription error:', error);
    return ApiResponses.serverErrorResponse(res, 'Failed to transcribe audio file');
  }
}
