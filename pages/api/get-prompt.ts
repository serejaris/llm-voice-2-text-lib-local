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

export default async function apiGetPrompt(req: NextApiRequest, res: NextApiResponse) {
  await Server.cors(req, res);

  if (req.method !== 'POST' && req.method !== 'GET') {
    return ApiResponses.methodNotAllowedResponse(res, ['GET', 'POST']);
  }

  try {
    const promptPath = FileSystem.getPromptFilePath();
    
    if (!FileSystem.fileExists(promptPath)) {
      return ApiResponses.notFoundResponse(res, 'Prompt file not found');
    }

    const content = await fs.readFile(promptPath, 'utf-8');
    return ApiResponses.successResponse(res, content);
  } catch (error) {
    console.error('Error reading prompt:', error);
    return ApiResponses.serverErrorResponse(res, 'Failed to read prompt');
  }
}
