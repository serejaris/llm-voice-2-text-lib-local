import * as Server from '@common/server';
import * as Utilities from '@common/shared-utilities';
import * as FileSystem from '@common/server/file-system';
import * as ApiResponses from '@common/server/api-responses';

import fs from 'fs/promises';
import type { NextApiRequest, NextApiResponse } from 'next';

export const config = {
  api: {
    responseLimit: false,
  },
};

export default async function apiGetIntrospection(req: NextApiRequest, res: NextApiResponse) {
  await Server.cors(req, res);

  if (req.method !== 'POST') {
    return ApiResponses.methodNotAllowedResponse(res, ['POST']);
  }

  const { name } = req.body || {};

  if (Utilities.isEmpty(name)) {
    return ApiResponses.badRequestResponse(res, 'File name is required');
  }

  try {
    const introspectionPath = FileSystem.getIntrospectionPath(name);

    if (!FileSystem.fileExists(introspectionPath)) {
      return ApiResponses.notFoundResponse(res, `Introspection for '${name}' not found`);
    }

    const content = await fs.readFile(introspectionPath, 'utf-8');
    return ApiResponses.successResponse(res, content);
  } catch (error) {
    console.error('Error reading introspection:', error);
    return ApiResponses.serverErrorResponse(res, 'Failed to read introspection');
  }
}
