import type { NextApiRequest, NextApiResponse } from 'next';
import path from 'path';
import fs from 'fs';
import { addTranscriptionJob } from '../../../common/server/transcription-queue-manager';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { fileName } = req.body;

    if (!fileName || typeof fileName !== 'string') {
      return res.status(400).json({ error: 'fileName is required' });
    }

    // Verify the file exists
    const publicDir = path.join(process.cwd(), 'public');
    const filePath = path.join(publicDir, fileName);

    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ error: 'File not found' });
    }

    // Add job to queue
    const jobId = addTranscriptionJob(fileName);

    return res.status(200).json({
      success: true,
      jobId,
      message: 'Transcription job added to queue',
    });
  } catch (error) {
    console.error('Error adding transcription job:', error);
    return res.status(500).json({
      error: 'Failed to add transcription job',
      details: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}
