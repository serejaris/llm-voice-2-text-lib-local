import type { NextApiRequest, NextApiResponse } from 'next';
import {
  getTranscriptionJob,
  getAllTranscriptionJobs,
  getQueueStats,
} from '../../../common/server/transcription-queue-manager';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET' && req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { jobId } = req.method === 'GET' ? req.query : req.body;

    // If jobId is provided, return specific job
    if (jobId && typeof jobId === 'string') {
      const job = getTranscriptionJob(jobId);

      if (!job) {
        return res.status(404).json({ error: 'Job not found' });
      }

      return res.status(200).json({
        success: true,
        job,
      });
    }

    // Otherwise, return all jobs and queue stats
    const jobs = getAllTranscriptionJobs();
    const stats = getQueueStats();

    return res.status(200).json({
      success: true,
      jobs,
      stats,
    });
  } catch (error) {
    console.error('Error getting transcription status:', error);
    return res.status(500).json({
      error: 'Failed to get transcription status',
      details: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}
