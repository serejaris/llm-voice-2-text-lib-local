import { nodewhisper } from 'nodejs-whisper';

/**
 * Whisper model configuration.
 * Using large-v3 for optimal quality with Russian language support.
 * The model is multilingual and works excellently with Russian audio.
 */
export const WHISPER_MODEL = 'large-v3';

/**
 * Complete configuration object for nodewhisper transcription.
 * This consolidates all Whisper settings in a single location.
 */
export const WHISPER_CONFIG = {
  modelName: WHISPER_MODEL,
  autoDownloadModelName: WHISPER_MODEL,
  removeWavFileAfterTranscription: false,
  withCuda: false,
  logger: console,
  whisperOptions: {
    outputInCsv: false,
    outputInJson: false,
    outputInJsonFull: false,
    outputInLrc: false,
    outputInSrt: false,
    outputInText: true,
    outputInVtt: false,
    outputInWords: false,
    translateToEnglish: false,
    wordTimestamps: false,
    timestamps_length: 30,
    splitOnWord: false,
  },
};

/**
 * Transcribes an audio file using the standard Whisper configuration.
 * This is a convenience wrapper around nodewhisper with the application's standard settings.
 * 
 * @param filePath - Absolute path to the audio file to transcribe
 * @returns Promise that resolves when transcription is complete
 */
export async function transcribeAudioFile(filePath: string): Promise<any> {
  return nodewhisper(filePath, WHISPER_CONFIG);
}
