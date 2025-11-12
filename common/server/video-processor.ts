import fs from 'fs/promises';
import path from 'path';
import ffmpeg from 'fluent-ffmpeg';
import * as FileSystem from './file-system';
import { getAudioFilenameFromVideo } from './file-type-validator';

/**
 * Configuration for video processing
 */
export interface VideoProcessingConfig {
  ffmpegPath?: string;
  timeout?: number;
  keepOriginalVideo?: boolean;
  extractedAudioFormat?: 'wav' | 'mp3';
}

/**
 * Default configuration values
 */
const DEFAULT_CONFIG: VideoProcessingConfig = {
  timeout: 3600000, // 60 minutes (increased from 5 minutes to handle long videos)
  keepOriginalVideo: false,
  extractedAudioFormat: 'wav',
};

/**
 * Result of video processing operation
 */
export interface VideoProcessingResult {
  success: boolean;
  audioFilePath?: string;
  audioFilename?: string;
  error?: string;
}

/**
 * Checks if FFmpeg is available on the system.
 * 
 * @param ffmpegPath - Optional custom FFmpeg path
 * @returns Promise resolving to true if FFmpeg is available
 */
export async function checkFFmpegAvailability(ffmpegPath?: string): Promise<boolean> {
  return new Promise((resolve) => {
    const command = ffmpeg();
    
    if (ffmpegPath) {
      command.setFfmpegPath(ffmpegPath);
    }
    
    command.getAvailableFormats((err) => {
      if (err) {
        resolve(false);
      } else {
        resolve(true);
      }
    });
  });
}

/**
 * Extracts audio from a video file.
 * 
 * @param videoBuffer - Buffer containing the video file data
 * @param videoFilename - Original filename of the video
 * @param config - Optional configuration for processing
 * @returns Promise resolving to VideoProcessingResult
 */
export async function extractAudioFromVideo(
  videoBuffer: Buffer,
  videoFilename: string,
  config: VideoProcessingConfig = {}
): Promise<VideoProcessingResult> {
  const mergedConfig = { ...DEFAULT_CONFIG, ...config };
  const publicDir = FileSystem.getPublicDirectoryPath();
  
  // Generate filenames
  const sanitizedVideoFilename = path.basename(videoFilename);
  const tempVideoPath = path.join(publicDir, `temp_${Date.now()}_${sanitizedVideoFilename}`);
  const audioFilename = getAudioFilenameFromVideo(sanitizedVideoFilename);
  const audioFilePath = path.join(publicDir, audioFilename);
  
  try {
    // Step 1: Save video buffer to temporary file
    await fs.writeFile(tempVideoPath, videoBuffer);
    
    // Log video file statistics
    console.log(`Video processing started:
  - Filename: ${sanitizedVideoFilename}
  - File size: ${videoBuffer.length} bytes (${(videoBuffer.length / 1024 / 1024).toFixed(2)} MB)
  - Output audio format: ${mergedConfig.extractedAudioFormat}
  - Timeout: ${mergedConfig.timeout}ms`);
    
    // Step 2: Check FFmpeg availability
    const ffmpegAvailable = await checkFFmpegAvailability(mergedConfig.ffmpegPath);
    if (!ffmpegAvailable) {
      throw new Error('FFmpeg is not available. Please install FFmpeg to process video files.');
    }
    
    // Step 3: Extract audio using FFmpeg
    await extractAudio(tempVideoPath, audioFilePath, mergedConfig);
    
    // Step 4: Cleanup temporary video file (unless configured to keep it)
    if (!mergedConfig.keepOriginalVideo) {
      await fs.unlink(tempVideoPath).catch((err) => {
        console.warn('Failed to delete temporary video file:', err);
      });
    }
    
    return {
      success: true,
      audioFilePath,
      audioFilename,
    };
  } catch (error) {
    // Cleanup on error
    await fs.unlink(tempVideoPath).catch(() => {});
    
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error during video processing',
    };
  }
}

/**
 * Internal function to perform audio extraction using FFmpeg.
 * 
 * @param inputPath - Path to the input video file
 * @param outputPath - Path for the output audio file
 * @param config - Processing configuration
 * @returns Promise that resolves when extraction is complete
 */
function extractAudio(
  inputPath: string,
  outputPath: string,
  config: VideoProcessingConfig
): Promise<void> {
  return new Promise((resolve, reject) => {
    const command = ffmpeg(inputPath);
    
    if (config.ffmpegPath) {
      command.setFfmpegPath(config.ffmpegPath);
    }
    
    // Configure audio extraction
    command
      .noVideo()
      .audioCodec('pcm_s16le') // PCM codec for WAV
      .audioFrequency(16000) // Optimal for Whisper
      .audioChannels(1) // Mono
      .output(outputPath)
      .on('start', (commandLine) => {
        console.log('FFmpeg command:', commandLine);
      })
      .on('progress', (progress) => {
        console.log('Processing: ', progress.percent ? `${progress.percent}%` : 'unknown');
      })
      .on('end', () => {
        console.log('Audio extraction completed successfully');
        resolve();
      })
      .on('error', (err, stdout, stderr) => {
        console.error('FFmpeg error:', err.message);
        console.error('FFmpeg stderr:', stderr);
        
        // Check for specific error conditions
        if (stderr && stderr.includes('does not contain any stream')) {
          reject(new Error('The uploaded video does not contain an audio track'));
        } else if (stderr && stderr.includes('Invalid data found')) {
          reject(new Error('The video file appears to be corrupted and cannot be processed'));
        } else {
          reject(new Error(`Failed to extract audio from video: ${err.message}`));
        }
      });
    
    // Set timeout if configured
    if (config.timeout) {
      setTimeout(() => {
        command.kill('SIGKILL');
        reject(new Error('Video processing timed out. Please try a smaller file.'));
      }, config.timeout);
    }
    
    command.run();
  });
}

/**
 * Gets video processing configuration from environment variables.
 * 
 * @returns VideoProcessingConfig object
 */
export function getConfigFromEnv(): VideoProcessingConfig {
  return {
    ffmpegPath: process.env.FFMPEG_PATH,
    timeout: process.env.VIDEO_PROCESSING_TIMEOUT 
      ? parseInt(process.env.VIDEO_PROCESSING_TIMEOUT, 10) 
      : DEFAULT_CONFIG.timeout,
    keepOriginalVideo: process.env.KEEP_ORIGINAL_VIDEO === 'true',
    extractedAudioFormat: (process.env.EXTRACTED_AUDIO_FORMAT as 'wav' | 'mp3') || DEFAULT_CONFIG.extractedAudioFormat,
  };
}
