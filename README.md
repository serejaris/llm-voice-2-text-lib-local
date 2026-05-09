<!-- hq-readme-ru: 2026-05-09 -->
# llm-voice-2-text-lib-local

Коротко: Инструмент для транскрибации или обработки аудио/видео.

## Что здесь

- Назначение: Инструмент для транскрибации или обработки аудио/видео.
- Основной стек: TypeScript.
- Видимость: публичный репозиторий.
- Статус: активный репозиторий; актуальность проверять по issues и последним коммитам.

## Где смотреть работу

- Задачи и текущие решения: GitHub Issues этого репозитория.
- Код и материалы: файлы в корне и профильные папки проекта.
- Связь с HQ: если проект влияет на продукт, контент или воронку, сверяйте канон в `0_hq` и репозитории-владельце.

## Для агентов

- Сначала прочитайте этот README и открытые issues.
- Не переносите сюда канон соседних проектов без ссылки на источник.
- Перед правками проверьте существующие scripts, package.json/pyproject и локальные инструкции.

---

## Исходный README

# WHISPER VIDEO TRANSCRIPTION

![Image](https://github.com/user-attachments/assets/75313f6e-05ec-4bc4-8275-032ec07e5521)

Local video and audio transcription using OpenAI's Whisper model, optimized for MacBook M1/M2/M3.

This application allows you to upload video or audio files and automatically transcribe them to text completely offline. All processing happens locally on your machine - your data never leaves your computer, ensuring complete privacy.

## Features

- 🎬 **Video Support** - Upload video files and automatically extract audio for transcription
- 🎙️ **Audio Support** - Direct audio file transcription
- 🔒 **Privacy-First** - All processing happens locally, no external API calls
- ⚡ **M1 Optimized** - Excellent performance on Apple Silicon Macs
- 🌍 **Multilingual** - Supports Russian and 90+ other languages via Whisper large-v3
- 📝 **Accurate Transcription** - Using OpenAI's Whisper large-v3 model

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

# Download Whisper model (large-v3)
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

On MacBook M1 Pro with `large-v3` model:
- 10-minute audio: ~1 minute processing
- 60-minute audio: ~6 minutes processing

## Architecture

### Technology Stack

- **Frontend**: Next.js 15, React 19, TypeScript, SCSS
- **Transcription**: Whisper large-v3 (via nodejs-whisper)
- **Audio Extraction**: FFmpeg
- **Storage**: Local file system (`/public` directory)

### Code Organization

```
common/
├── server/                    # Server-only utilities
│   ├── whisper-config.ts      # Whisper model configuration
│   ├── video-processor.ts     # Video-to-audio extraction (FFmpeg)
│   ├── file-system.ts         # File path utilities
│   ├── file-type-validator.ts # File type validation
│   └── api-responses.ts       # Standardized API responses
├── hooks/                     # React hooks
│   ├── useUploadProgress.ts   # Upload progress tracking
│   └── useUploadStatusPolling.ts
├── api-client.ts              # API utilities
├── shared-utilities.ts        # Shared utilities
└── constants.ts               # Application constants

pages/api/                     # API endpoints
├── upload.ts                  # Upload audio/video files
├── transcribe.ts              # Transcribe audio
├── get-transcription.ts       # Retrieve transcript
├── list.ts                    # List audio files
└── upload-status.ts           # Upload progress polling

components/                    # React components
├── Application.tsx            # Main application UI
├── ActionUploadButton.tsx     # Upload button
├── InlineUploadProgress.tsx   # Progress bar
└── FontSelector.tsx           # Font customization
```

### Data Flow

```
1. Upload Video/Audio
   ↓
2. Detect File Type
   ↓
3a. If Video: Extract Audio with FFmpeg (16kHz, mono, WAV)
3b. If Audio: Use directly
   ↓
4. User clicks "Transcribe"
   ↓
5. Whisper processes audio
   ↓
6. Save transcript as [filename].txt
   ↓
7. Display in UI
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

# Whisper model (default: large-v3)
WHISPER_MODEL=large-v3
```

### Whisper Model Configuration

Edit `/common/server/whisper-config.ts` to change models:

```typescript
// Available models: tiny, base, small, medium, large-v3, large-v3-turbo
export const WHISPER_MODEL = 'large-v3';
```

**Model Comparison**:
- `tiny` - Fastest, least accurate
- `base` - Good balance for real-time
- `small` - Better quality, still fast
- `medium` - High quality, slower
- `large-v3` - **Best quality** (recommended), excellent for Russian
- `large-v3-turbo` - Faster than large-v3, slightly less accurate

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

```typescript
{
  modelName: 'large-v3',
  removeWavFileAfterTranscription: false,
  withCuda: false,  // CPU/Metal acceleration on Mac
  whisperOptions: {
    outputInText: true,
    translateToEnglish: false,  // Keep original language
    wordTimestamps: false,
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
