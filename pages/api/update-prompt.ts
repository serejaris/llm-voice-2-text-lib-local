import fs from 'fs/promises';

import * as Server from '@common/server';
import * as Utilities from '@common/shared-utilities';
import * as FileSystem from '@common/server/file-system';
import * as ApiResponses from '@common/server/api-responses';

import type { NextApiRequest, NextApiResponse } from 'next';

export const config = {
  api: {
    responseLimit: false,
  },
};

export default async function apiUpdatePrompt(req: NextApiRequest, res: NextApiResponse) {
  await Server.cors(req, res);

  if (req.method !== 'POST') {
    return ApiResponses.methodNotAllowedResponse(res, ['POST']);
  }

  const { prompt } = req.body || {};

  if (Utilities.isEmpty(prompt)) {
    return ApiResponses.badRequestResponse(res, 'Prompt text is required');
  }

  try {
    const promptPath = FileSystem.getPromptFilePath();

    if (!FileSystem.fileExists(promptPath)) {
      return ApiResponses.notFoundResponse(res, 'Prompt file not found');
    }

    await fs.writeFile(promptPath, prompt, {
      encoding: 'utf-8',
      flag: 'w',
    });

    return ApiResponses.successResponse(res, { prompt, path: promptPath });
  } catch (error) {
    console.error('Error updating prompt:', error);
    return ApiResponses.serverErrorResponse(res, 'Failed to update prompt');
  }
}
