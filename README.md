# WHISPER VIDEO TRANSCRIPTION

![Image](https://github.com/user-attachments/assets/75313f6e-05ec-4bc4-8275-032ec07e5521)

Local video and audio transcription using OpenAI's Whisper model, optimized for MacBook M1/M2/M3.

This application allows you to upload video or audio files and automatically transcribe them to text completely offline. All processing happens locally on your machine - your data never leaves your computer, ensuring complete privacy.

## Features

- 🎬 **Video Support** - Upload video files and automatically extract audio for transcription
- 🎙️ **Audio Support** - Direct audio file transcription
- 🔒 **Privacy-First** - All processing happens locally, no external API calls
- ⚡ **M1 Optimized** - Excellent performance on Apple Silicon Macs
- 🌍 **Multilingual** - Supports Russian and 90+ other languages via Whisper large-v3-turbo
- 📝 **Accurate Transcription** - Using OpenAI's Whisper large-v3-turbo model
- 📊 **Progress Tracking** - Real-time upload and processing progress visualization

## Supported Formats

**Video**: MP4, MOV, AVI, MKV, WebM, FLV
**Audio**: WAV, MP3, OGG, FLAC, M4A

## Quick Start (MacOS)

### Prerequisites

- MacBook (M1/M2/M3 or Intel)
- Node.js 18 or higher
- Command line access

### Installation

```sh
# Clone the repository
git clone <repository-url>
cd whisper-video-transcription

# Install dependencies
npm install

# Install system dependencies via Homebrew
brew install cmake
brew install ffmpeg

# Download Whisper model (large-v3-turbo)
npx nodejs-whisper download
```

### Run the Application

```sh
# Start the development server
npm run dev
```

Open `http://localhost:10000` in your browser.

## How to Use

1. **Upload** - Click the upload button and select a video or audio file
2. **Wait** - The app will automatically extract audio (if video)
3. **Select** - Click on the audio file in the left panel
4. **Transcribe** - Click "Transcribe" button and wait for processing
5. **View** - Your transcription will appear in the main panel

## Performance

On MacBook M1 Pro with `large-v3-turbo` model:
- 10-minute audio: ~45 seconds processing
- 60-minute audio: ~4-5 minutes processing

## Architecture

### Technology Stack

- **Frontend**: Next.js 15, React 19, TypeScript, SCSS
- **Transcription**: Whisper large-v3-turbo (via nodejs-whisper)
- **Audio Extraction**: FFmpeg
- **Progress Tracking**: Real-time upload and processing status
- **Storage**: Local file system (`/public` directory)

### Code Organization

```
common/
├── server/                       # Server-only utilities
│   ├── whisper-config.ts         # Whisper model configuration & transcription
│   ├── video-processor.ts        # Video-to-audio extraction (FFmpeg)
│   ├── file-system.ts            # File path utilities
│   ├── file-type-validator.ts    # File type validation
│   ├── api-responses.ts          # Standardized API responses
│   └── upload-status-manager.ts  # Upload progress state management
├── hooks/                        # React hooks
│   ├── useUploadProgress.ts      # Upload progress tracking hook
│   └── useUploadStatusPolling.ts # Upload status polling hook
├── upload-progress-types.ts      # TypeScript types for progress tracking
├── api-client.ts                 # API utilities
├── shared-utilities.ts           # Shared utilities
├── constants.ts                  # Application constants
├── hooks.ts                      # Hook utilities
└── server.ts                     # Server utilities

pages/api/                        # API endpoints
├── upload.ts                     # Upload audio/video files
├── transcribe.ts                 # Transcribe audio
├── get-transcription.ts          # Retrieve transcript
├── list.ts                       # List audio files
└── upload-status.ts              # Upload progress polling

components/                       # React components
├── Application.tsx               # Main application UI
├── ActionUploadButton.tsx        # Upload button with drag-and-drop
├── InlineUploadProgress.tsx      # Inline progress indicator
├── UploadProgressOverlay.tsx     # Full-screen progress overlay
├── ProgressBar.tsx               # Progress bar component
├── CircularLoader.tsx            # Loading spinner
├── TextArea.tsx                  # Transcription text area
├── FontSelector.tsx              # Font customization
├── ModalContext.tsx              # Modal management context
├── DefaultLayout.tsx             # Default page layout
├── DefaultMetaTags.tsx           # SEO meta tags
├── Page.tsx                      # Page wrapper
└── Providers.tsx                 # React context providers
```

### Data Flow

```
1. Upload Video/Audio
   ↓
2. Real-time upload progress tracking (polling /api/upload-status)
   ↓
3. Detect File Type
   ↓
4a. If Video: Extract Audio with FFmpeg (16kHz, mono, WAV)
4b. If Audio: Use directly
   ↓
5. User clicks "Transcribe"
   ↓
6. Whisper processes audio (large-v3-turbo model)
   ↓
7. Save transcript as [filename].txt
   ↓
8. Display in UI with customizable fonts
```

### File Storage

All files are stored in `/public` directory:

```
/public/
├── video.wav              # Extracted or uploaded audio
└── video.wav.txt          # Transcription text
```

## Configuration

### Environment Variables

Create a `.env` file (copy from `.env.example`):

```bash
# FFmpeg path (optional, auto-detected)
FFMPEG_PATH=/opt/homebrew/bin/ffmpeg  # M1/M2/M3 Macs
# FFMPEG_PATH=/usr/local/bin/ffmpeg   # Intel Macs

# Video processing timeout (milliseconds)
VIDEO_PROCESSING_TIMEOUT=600000  # 10 minutes

# Whisper model (default: large-v3-turbo)
WHISPER_MODEL=large-v3-turbo
```

### Whisper Model Configuration

Edit `/common/server/whisper-config.ts` to change models:

```typescript
// Available models for nodejs-whisper
export const WHISPER_MODEL = 'large-v3-turbo';
```

**Model Comparison**:
- `tiny` - Fastest, least accurate
- `base` - Good balance for real-time
- `small` - Better quality, still fast
- `medium` - High quality, slower
- `large-v3-turbo` - **Best quality** (recommended), excellent for Russian and multilingual support

**Note**: The `nodejs-whisper` library uses `large-v3-turbo` as the model name. This provides the best balance of quality and speed, with excellent Russian language support.

## Troubleshooting

### Whisper Installation Issues

If transcription fails, try downloading the model manually:

```sh
npx nodejs-whisper download
```

### FFmpeg Not Found

Install FFmpeg via Homebrew:

```sh
brew install ffmpeg

# Verify installation
ffmpeg -version
```

### Model Download Fails

Models are downloaded automatically on first use. If download fails:

1. Check your internet connection
2. Run `npx nodejs-whisper download` manually
3. Wait for download to complete (models are 1-3GB)

## Privacy & Security

- **100% Local Processing** - No cloud services, no external APIs
- **No Telemetry** - No usage tracking or data collection
- **Offline Capable** - Works without internet (after initial setup)
- **Your Data Stays Yours** - Files never leave your machine

## Development

### Build for Production

```sh
npm run build
npm run start
```

### Test Scripts

```sh
npm run script
```

## Technical Details

### FFmpeg Audio Extraction

The application automatically converts video to optimal format for Whisper:

- **Format**: WAV (PCM)
- **Sample Rate**: 16kHz (optimal for speech recognition)
- **Channels**: Mono
- **Bit Depth**: 16-bit

### Whisper Configuration

The application uses the following Whisper configuration (from `/common/server/whisper-config.ts`):

```typescript
{
  modelName: 'large-v3-turbo',
  autoDownloadModelName: 'large-v3-turbo',
  removeWavFileAfterTranscription: false,
  withCuda: false,  // CPU/Metal acceleration on Mac
  logger: console,
  whisperOptions: {
    outputInText: true,
    translateToEnglish: false,  // Keep original language
    wordTimestamps: false,
    timestamps_length: 30,
    splitOnWord: false,
  }
}
```

## Contributing

Contributions are welcome! Please:

1. Open an issue to discuss major changes
2. Submit pull requests for bug fixes or features
3. Follow existing code style and architecture

## License

MIT

## Contact

Questions? Reach out on Twitter:
- [@wwwjim](https://twitter.com/wwwjim)
- [@internetxstudio](https://x.com/internetxstudio)

---

**Note**: This is a refactored version focused purely on local transcription. All LLM analysis features have been removed to create a streamlined, privacy-focused transcription tool.
