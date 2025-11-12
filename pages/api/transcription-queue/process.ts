import type { NextApiRequest, NextApiResponse } from 'next';
import path from 'path';
import fs from 'fs';
import {
  getCurrentJob,
  updateTranscriptionJob,
  TranscriptionStatus,
} from '../../../common/server/transcription-queue-manager';
import { transcribeAudioFile } from '../../../common/server/whisper-config';

// Prevent timeout during transcription
export const config = {
  api: {
    responseLimit: false,
    bodyParser: {
      sizeLimit: '50mb',
    },
  },
  maxDuration: 300, // 5 minutes
};

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const currentJob = getCurrentJob();

    if (!currentJob) {
      return res.status(200).json({
        success: true,
        message: 'No jobs to process',
      });
    }

    const { jobId, fileName } = currentJob;

    try {
      const publicDir = path.join(process.cwd(), 'public');
      const filePath = path.join(publicDir, fileName);

      // Verify file exists
      if (!fs.existsSync(filePath)) {
        updateTranscriptionJob(jobId, {
          status: TranscriptionStatus.ERROR,
          error: 'File not found',
        });

        return res.status(404).json({
          success: false,
          error: 'File not found',
          jobId,
        });
      }

      // Transcribe the audio file
      const transcriptionResult = await transcribeAudioFile(filePath);

      // Save transcription to file
      const transcriptionPath = filePath.replace(/\.(wav|mp3|m4a)$/i, '.txt');
      fs.writeFileSync(transcriptionPath, transcriptionResult, 'utf-8');

      // Update job as completed
      updateTranscriptionJob(jobId, {
        status: TranscriptionStatus.COMPLETED,
        transcription: transcriptionResult,
      });

      return res.status(200).json({
        success: true,
        jobId,
        fileName,
        transcription: transcriptionResult,
      });
    } catch (error) {
      console.error(`Error transcribing file ${fileName}:`, error);

      updateTranscriptionJob(jobId, {
        status: TranscriptionStatus.ERROR,
        error: error instanceof Error ? error.message : 'Unknown error',
      });

      return res.status(500).json({
        success: false,
        error: 'Transcription failed',
        jobId,
        details: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  } catch (error) {
    console.error('Error processing transcription queue:', error);
    return res.status(500).json({
      error: 'Failed to process transcription queue',
      details: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}
