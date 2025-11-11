import type { NextApiRequest, NextApiResponse } from 'next';
import { cancelTranscriptionJob } from '../../../common/server/transcription-queue-manager';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { jobId } = req.body;

    if (!jobId || typeof jobId !== 'string') {
      return res.status(400).json({ error: 'jobId is required' });
    }

    const cancelled = cancelTranscriptionJob(jobId);

    if (!cancelled) {
      return res.status(400).json({
        success: false,
        error: 'Cannot cancel job (job not found or already processing/completed)',
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Job cancelled successfully',
      jobId,
    });
  } catch (error) {
    console.error('Error cancelling transcription job:', error);
    return res.status(500).json({
      error: 'Failed to cancel transcription job',
      details: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}
