import * as Server from '@common/server';
import * as FileSystem from '@common/server/file-system';
import * as ApiResponses from '@common/server/api-responses';

import fs from 'fs/promises';
import type { NextApiRequest, NextApiResponse } from 'next';

export const config = {
  api: {
    responseLimit: false,
  },
};

export default async function apiList(req: NextApiRequest, res: NextApiResponse) {
  await Server.cors(req, res);

  if (req.method !== 'POST' && req.method !== 'GET') {
    return ApiResponses.methodNotAllowedResponse(res, ['GET', 'POST']);
  }

  try {
    const publicDir = FileSystem.getPublicDirectoryPath();
    const files = await fs.readdir(publicDir);
    
    // Filter for audio files using supported extensions
    const audio = files.filter((fileName) => FileSystem.isValidAudioFile(fileName));

    return ApiResponses.successResponse(res, audio);
  } catch (error) {
    console.error('Error listing files:', error);
    return ApiResponses.serverErrorResponse(res, 'Failed to list audio files');
  }
}
