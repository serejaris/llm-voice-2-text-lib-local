import path from 'path';

/**
 * Supported audio file extensions
 */
export const SUPPORTED_AUDIO_EXTENSIONS = ['.wav', '.mp3', '.ogg', '.flac', '.m4a'];

/**
 * Supported video file extensions
 */
export const SUPPORTED_VIDEO_EXTENSIONS = ['.mp4', '.mov', '.avi', '.mkv', '.webm', '.flv'];

/**
 * File type categories
 */
export enum FileType {
  AUDIO = 'audio',
  VIDEO = 'video',
  INVALID = 'invalid',
}

/**
 * File validation result
 */
export interface FileValidationResult {
  fileType: FileType;
  isSupported: boolean;
  extension: string;
  originalFilename: string;
}

/**
 * Validates a file and determines its type category.
 * 
 * @param filename - The filename to validate
 * @returns FileValidationResult containing file type information
 */
export function validateFileType(filename: string): FileValidationResult {
  const extension = path.extname(filename).toLowerCase();
  const sanitizedFilename = path.basename(filename);
  
  // Check if it's an audio file
  if (SUPPORTED_AUDIO_EXTENSIONS.includes(extension)) {
    return {
      fileType: FileType.AUDIO,
      isSupported: true,
      extension,
      originalFilename: sanitizedFilename,
    };
  }
  
  // Check if it's a video file
  if (SUPPORTED_VIDEO_EXTENSIONS.includes(extension)) {
    return {
      fileType: FileType.VIDEO,
      isSupported: true,
      extension,
      originalFilename: sanitizedFilename,
    };
  }
  
  // Unsupported file type
  return {
    fileType: FileType.INVALID,
    isSupported: false,
    extension,
    originalFilename: sanitizedFilename,
  };
}

/**
 * Checks if a file is an audio file.
 * 
 * @param filename - The filename to check
 * @returns True if the file is an audio file
 */
export function isAudioFile(filename: string): boolean {
  const extension = path.extname(filename).toLowerCase();
  return SUPPORTED_AUDIO_EXTENSIONS.includes(extension);
}

/**
 * Checks if a file is a video file.
 * 
 * @param filename - The filename to check
 * @returns True if the file is a video file
 */
export function isVideoFile(filename: string): boolean {
  const extension = path.extname(filename).toLowerCase();
  return SUPPORTED_VIDEO_EXTENSIONS.includes(extension);
}

/**
 * Gets the audio filename that would be created from a video file.
 * 
 * @param videoFilename - The video filename
 * @returns The audio filename (with .wav extension)
 */
export function getAudioFilenameFromVideo(videoFilename: string): string {
  const nameWithoutExt = path.basename(videoFilename, path.extname(videoFilename));
  return `${nameWithoutExt}.wav`;
}

/**
 * Generates a user-friendly error message for unsupported file types.
 * 
 * @param extension - The file extension
 * @returns Error message string
 */
export function getUnsupportedFileMessage(extension: string): string {
  return `Unsupported file format "${extension}". Supported formats: Audio (${SUPPORTED_AUDIO_EXTENSIONS.join(', ')}), Video (${SUPPORTED_VIDEO_EXTENSIONS.join(', ')})`;
}
