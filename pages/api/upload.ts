import fs from 'fs/promises';
import path from 'path';

import * as Server from '@common/server';
import * as FileSystem from '@common/server/file-system';
import * as ApiResponses from '@common/server/api-responses';
import { transcribeAudioFile } from '@common/server/whisper-config';

export const config = {
  api: {
    responseLimit: false,
    bodyParser: false,
  },
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

  // Use centralized file system utilities
  try {
    const destPath = FileSystem.getPublicFilePath(filename);
    
    // Validate it's an audio file
    if (!FileSystem.isValidAudioFile(filename)) {
      return ApiResponses.badRequestResponse(res, 'Invalid audio file format. Supported formats: .wav, .mp3, .ogg, .flac, .m4a');
    }

    // Write the uploaded file
    await fs.writeFile(destPath, fileBuffer);

    // Transcribe using centralized configuration
    await transcribeAudioFile(destPath);

    return ApiResponses.successResponse(res, filename);
  } catch (error) {
    console.error('Upload error:', error);
    return ApiResponses.serverErrorResponse(res, 'Failed to process upload');
  }
}
