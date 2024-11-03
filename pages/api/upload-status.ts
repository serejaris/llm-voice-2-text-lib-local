import * as Server from '@common/server';
import * as ApiResponses from '@common/server/api-responses';
import { getUploadStatus } from '@common/server/upload-status-manager';

export default async function apiUploadStatus(req, res) {
  await Server.cors(req, res);

  if (req.method !== 'POST') {
    return ApiResponses.methodNotAllowedResponse(res, ['POST']);
  }

  const { uploadId } = req.body;

  if (!uploadId) {
    return ApiResponses.badRequestResponse(res, 'uploadId is required');
  }

  const status = getUploadStatus(uploadId);

  if (!status) {
    return ApiResponses.notFoundResponse(res, 'Upload status not found');
  }

  return res.status(200).json({
    success: true,
    data: {
      stage: status.stage,
      message: status.message,
      error: status.error,
      complete: status.complete,
      filename: status.filename,
    },
  });
}
