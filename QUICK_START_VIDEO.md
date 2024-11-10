# Quick Start Guide: Video Processing Feature

## Overview

The video processing feature allows you to upload video files (.mp4, .mov, .avi, .mkv, .webm, .flv) which are automatically converted to audio for transcription.

## Prerequisites

### 1. Install FFmpeg

FFmpeg is required to extract audio from video files.

**macOS:**
```bash
brew install ffmpeg
```

**Ubuntu/Debian:**
```bash
sudo apt-get update
sudo apt-get install ffmpeg
```

**Windows:**
- Download from https://ffmpeg.org/download.html
- Add to system PATH

### 2. Verify Installation

```bash
ffmpeg -version
```

You should see FFmpeg version information.

## How to Use

### 1. Start the Application

```bash
# Terminal 1: Start Ollama
npm run llm

# Terminal 2: Start the Next.js app
npm run local
```

### 2. Upload Video

1. Open http://localhost:10000 in your browser
2. Click "◎ Upload Audio/Video" button
3. Select a video file (MP4, MOV, AVI, MKV, WebM, or FLV)
4. Wait for processing (the UI will show "PLEASE WAIT")

### 3. Processing Flow

The system will automatically:
- ✅ Validate the video file
- ✅ Extract audio track (saved as .wav file)
- ✅ Delete temporary video file
- ✅ Start Whisper transcription
- ✅ Display extracted audio in file list

### 4. Transcribe & Introspect

Once the video is processed:
- The extracted audio appears in the file list as `filename.wav`
- Click on the file to load it
- Click "◎ Transcribe" to generate transcript
- Click "◎ Introspect" to analyze with LLM

## File Naming

| You Upload | System Saves | Transcript File | Introspection File |
|-----------|-------------|----------------|-------------------|
| `interview.mp4` | `interview.wav` | `interview.wav.txt` | `interview.wav.introspection.txt` |
| `lecture.mov` | `lecture.wav` | `lecture.wav.txt` | `lecture.wav.introspection.txt` |

## Configuration (Optional)

Create a `.env` file in the project root:

```env
# Custom FFmpeg path (if not in system PATH)
FFMPEG_PATH=/usr/local/bin/ffmpeg

# Maximum processing time (default: 5 minutes)
VIDEO_PROCESSING_TIMEOUT=300000

# Keep original video files after extraction
KEEP_ORIGINAL_VIDEO=false

# Output audio format (default: wav)
EXTRACTED_AUDIO_FORMAT=wav
```

## Troubleshooting

### Error: "FFmpeg is not available"

**Problem:** FFmpeg is not installed or not in system PATH.

**Solution:**
1. Install FFmpeg (see Prerequisites)
2. Verify with `ffmpeg -version`
3. Or set custom path in `.env`: `FFMPEG_PATH=/path/to/ffmpeg`

### Error: "Video does not contain an audio track"

**Problem:** The uploaded video has no audio.

**Solution:** Ensure your video file contains an audio track.

### Error: "Video processing timed out"

**Problem:** Video file is too large or processing is taking too long.

**Solution:**
- Try a shorter video clip
- Compress the video before uploading
- Increase timeout in `.env`: `VIDEO_PROCESSING_TIMEOUT=600000` (10 minutes)

### Error: "Unsupported file format"

**Problem:** File type not supported.

**Solution:** Convert video to supported format:
```bash
ffmpeg -i input.mkv -c:v copy -c:a copy output.mp4
```

## Performance Guidelines

| Video Length | Expected Processing Time | Recommended |
|-------------|------------------------|-------------|
| 0-5 min | ~35-105 seconds | ✅ Optimal |
| 5-15 min | ~100-210 seconds | ✅ Good |
| 15-30 min | ~200-420 seconds | ⚠️ Slower |
| 30+ min | ~400+ seconds | ⚠️ Very slow |

**Tips:**
- Shorter videos process faster
- Processing time includes: extraction + transcription
- The system processes one file at a time
- Be patient with longer videos

## Testing the Feature

### Create a Test Video

```bash
# Generate a 5-second test video with audio
cd public
ffmpeg -f lavfi -i testsrc=duration=5:size=640x480:rate=30 \
       -f lavfi -i sine=frequency=1000:duration=5 \
       -c:v libx264 -c:a aac test.mp4
```

### Run Automated Tests

```bash
npm run script test-video-processing
```

This will:
- Test file type validation
- Test video audio extraction
- Verify extracted audio file

## Advanced Usage

### Batch Processing

While the UI processes one file at a time, you can use the API directly:

```bash
# Upload and process video
curl -X POST http://localhost:10000/api/upload \
  -F "file=@/path/to/video.mp4"
```

### Custom Audio Quality

Edit `common/server/video-processor.ts`:

```typescript
// Change sample rate
.audioFrequency(44100) // Default is 16000

// Change to stereo
.audioChannels(2) // Default is 1 (mono)
```

### Keep Original Videos

Set in `.env`:
```env
KEEP_ORIGINAL_VIDEO=true
```

Videos will be saved alongside audio files in the `public/` directory.

## What's Different from Audio Upload?

| Feature | Audio Upload | Video Upload |
|---------|-------------|--------------|
| Accepted formats | .wav, .mp3, .ogg, .flac, .m4a | .mp4, .mov, .avi, .mkv, .webm, .flv |
| Processing | Direct save | Extract audio → save |
| Saved as | Original extension | Always .wav |
| Processing time | Instant | ~5-60 seconds |
| Requires FFmpeg | ❌ No | ✅ Yes |

## Security & Privacy

✅ **Fully Offline**: Video processing happens entirely on your machine
✅ **No Cloud Upload**: Videos never leave your computer
✅ **Automatic Cleanup**: Temporary files deleted after processing
✅ **Local Storage**: All files stored in `public/` directory

## Next Steps

After processing your video:

1. **Review Transcript**: Check accuracy of Whisper transcription
2. **Run Introspection**: Use LLM to analyze content
3. **Update Prompt**: Customize the introspection prompt for your needs
4. **Export Results**: Copy transcript/introspection from UI

## Support

For detailed technical documentation, see:
- [VIDEO_PROCESSING_FEATURE.md](VIDEO_PROCESSING_FEATURE.md) - Complete technical reference
- [README.md](README.md) - Main project documentation

If you encounter issues:
1. Check console logs (browser DevTools)
2. Check terminal output (server logs)
3. Verify FFmpeg installation
4. Try with a smaller test video first

## Examples

### Example 1: Interview Recording

```bash
# You have: interview.mov (20 minutes)
# Upload via UI → Processing takes ~3-4 minutes
# Result: interview.wav + interview.wav.txt + interview.wav.introspection.txt
```

### Example 2: Lecture Video

```bash
# You have: lecture.mp4 (1 hour)
# Upload via UI → Processing takes ~10-15 minutes
# Result: lecture.wav + lecture.wav.txt + lecture.wav.introspection.txt
```

### Example 3: Short Clip

```bash
# You have: clip.webm (2 minutes)
# Upload via UI → Processing takes ~30 seconds
# Result: clip.wav + clip.wav.txt + clip.wav.introspection.txt
```

Enjoy the new video processing feature! 🎥→🔊→📝
