import fs from 'fs';
import path from 'path';

// Constants for file naming
export const TRANSCRIPTION_EXTENSION = '.txt';
export const SUPPORTED_AUDIO_EXTENSIONS = ['.wav', '.mp3', '.ogg', '.flac', '.m4a'];

// Cache for repository root to avoid repeated filesystem traversal
let cachedRepoRoot: string | null = null;

/**
 * Detects the repository root directory by searching for global.scss file.
 * The result is cached after the first successful detection.
 * 
 * @returns The absolute path to the repository root, or null if not found
 */
export function getRepositoryRoot(): string | null {
  if (cachedRepoRoot) {
    return cachedRepoRoot;
  }

  const entryScript = process.cwd();
  let repoRoot = entryScript;

  // Check if global.scss exists in current directory
  if (!fs.existsSync(path.join(entryScript, 'global.scss'))) {
    let dir = path.dirname(entryScript);
    
    // Traverse up the directory tree looking for global.scss
    while (dir !== '/' && !fs.existsSync(path.join(dir, 'global.scss'))) {
      dir = path.dirname(dir);
    }
    
    repoRoot = dir;
  }

  // Validate that we found a valid root (not just traversed to system root)
  if (repoRoot === '/' || !fs.existsSync(path.join(repoRoot, 'global.scss'))) {
    return null;
  }

  cachedRepoRoot = repoRoot;
  return cachedRepoRoot;
}

/**
 * Returns the absolute path to the public directory.
 * 
 * @returns The absolute path to the public directory
 * @throws Error if repository root cannot be detected
 */
export function getPublicDirectoryPath(): string {
  const repoRoot = getRepositoryRoot();
  
  if (!repoRoot) {
    throw new Error('Unable to detect repository root. Cannot locate public directory.');
  }

  return path.join(repoRoot, 'public');
}

/**
 * Constructs an absolute path for a file in the public directory.
 * 
 * @param filename - The filename to locate in the public directory
 * @returns The absolute path to the file in the public directory
 * @throws Error if repository root cannot be detected
 */
export function getPublicFilePath(filename: string): string {
  const publicDir = getPublicDirectoryPath();
  
  // Sanitize filename to prevent directory traversal
  const sanitizedFilename = path.basename(filename);
  
  return path.join(publicDir, sanitizedFilename);
}

/**
 * Checks if a file exists at the given path.
 * 
 * @param filePath - The absolute path to check
 * @returns True if the file exists, false otherwise
 */
export function fileExists(filePath: string): boolean {
  try {
    return fs.existsSync(filePath);
  } catch (error) {
    return false;
  }
}

/**
 * Verifies that the public directory exists and is accessible.
 * 
 * @returns True if the public directory exists and is a directory
 */
export function ensurePublicDirectory(): boolean {
  try {
    const publicDir = getPublicDirectoryPath();
    const stats = fs.statSync(publicDir);
    return stats.isDirectory();
  } catch (error) {
    return false;
  }
}

/**
 * Gets the path for a transcription file based on the audio filename.
 *
 * @param audioFilename - The original audio filename
 * @returns The absolute path to the transcription file
 */
export function getTranscriptionPath(audioFilename: string): string {
  const publicDir = getPublicDirectoryPath();
  return path.join(publicDir, `${audioFilename}${TRANSCRIPTION_EXTENSION}`);
}

/**
 * Validates if a filename has a supported audio extension.
 * 
 * @param filename - The filename to validate
 * @returns True if the file has a supported audio extension
 */
export function isValidAudioFile(filename: string): boolean {
  const ext = path.extname(filename).toLowerCase();
  return SUPPORTED_AUDIO_EXTENSIONS.includes(ext);
}
