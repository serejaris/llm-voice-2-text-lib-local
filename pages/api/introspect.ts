import fs from 'fs/promises';

import * as Server from '@common/server';
import * as Utilities from '@common/shared-utilities';
import * as FileSystem from '@common/server/file-system';
import * as ApiResponses from '@common/server/api-responses';
import { queryOllamaHTTP, normalizeMultilineText, QUERY_DIRECTIVES } from '@common/server/llm-config';

import type { NextApiRequest, NextApiResponse } from 'next';

export const config = {
  api: {
    responseLimit: false,
  },
};

export default async function apiIntrospect(req: NextApiRequest, res: NextApiResponse) {
  await Server.cors(req, res);

  if (req.method !== 'POST') {
    return ApiResponses.methodNotAllowedResponse(res, ['POST']);
  }

  const { name } = req.body || {};

  if (Utilities.isEmpty(name)) {
    return ApiResponses.badRequestResponse(res, 'File name is required');
  }

  try {
    const transcriptPath = FileSystem.getTranscriptionPath(name);
    const promptPath = FileSystem.getPromptFilePath();

    // Check if transcription file exists
    if (!FileSystem.fileExists(transcriptPath)) {
      return ApiResponses.notFoundResponse(res, `Transcription file for '${name}' not found`);
    }

    // Read transcript and prompt
    const transcript = await fs.readFile(transcriptPath, 'utf-8');
    const prompt = await fs.readFile(promptPath, 'utf-8');
    
    // Normalize and construct query
    const normalizedTranscription = normalizeMultilineText(transcript);
    const query = `<transcript>
"${normalizedTranscription}"
</transcript>

${prompt}
${QUERY_DIRECTIVES}`;

    // Query LLM
    const answer = await queryOllamaHTTP(query);

    if (!answer) {
      return ApiResponses.serverErrorResponse(res, 'Failed to get response from LLM');
    }

    // Write introspection result
    const outPath = FileSystem.getIntrospectionPath(name);
    
    // Delete existing introspection file if present
    try {
      await fs.unlink(outPath);
      console.log(`Deleted existing introspection file`);
    } catch (err) {
      // File doesn't exist, ignore error
    }

    await fs.writeFile(outPath, answer, {
      encoding: 'utf-8',
      flag: 'w',
    });

    return ApiResponses.successResponse(res, { text: answer, path: outPath });
  } catch (error) {
    console.error('Introspection error:', error);
    return ApiResponses.serverErrorResponse(res, 'Failed to process introspection');
  }
}
