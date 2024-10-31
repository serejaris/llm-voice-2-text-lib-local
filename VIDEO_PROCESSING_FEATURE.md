# Video Processing Feature - Implementation Summary

## Overview

The video processing feature has been successfully implemented, enabling users to upload video files that are automatically converted to audio for transcription and introspection.

## Changes Made

### 1. New Dependencies
- **fluent-ffmpeg**: Node.js wrapper for FFmpeg operations
- **@types/fluent-ffmpeg**: TypeScript type definitions

### 2. New Modules Created

#### `/common/server/file-type-validator.ts`
Handles file type validation and categorization:
- Validates uploaded files as audio, video, or invalid
- Supports audio formats: .wav, .mp3, .ogg, .flac, .m4a
- Supports video formats: .mp4, .mov, .avi, .mkv, .webm, .flv
- Provides utility functions for filename conversion

#### `/common/server/video-processor.ts`
Manages video-to-audio extraction:
- Uses FFmpeg to extract audio tracks from video files
- Configures output as WAV format (16kHz, mono, PCM)
- Implements timeout protection (5 minutes default)
- Handles temporary file cleanup
- Supports environment-based configuration

### 3. Modified Files

#### `/pages/api/upload.ts`
Enhanced upload endpoint to handle both audio and video files:
- Validates file type using the new validator
- Routes audio files to direct storage
- Routes video files to audio extraction
- Maintains backward compatibility with existing audio uploads

#### `/components/ActionUploadButton.tsx`
Updated UI to accept video files:
- Changed input accept attribute to `"audio/*,video/*"`
- Updated button labels to reflect audio/video support
- Updated user-facing messages

#### `.env.example`
Added configuration options:
- `FFMPEG_PATH`: Custom FFmpeg binary path
- `VIDEO_PROCESSING_TIMEOUT`: Maximum processing time
- `KEEP_ORIGINAL_VIDEO`: Whether to preserve uploaded videos
- `EXTRACTED_AUDIO_FORMAT`: Output audio format

## System Requirements

### FFmpeg Installation

The feature requires FFmpeg to be installed on the system. Installation instructions:

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
Download from https://ffmpeg.org/download.html and add to PATH

### Verification
To verify FFmpeg is installed:
```bash
ffmpeg -version
```

## How It Works

### Upload Flow

1. **User uploads video file** → File picker accepts both audio and video formats
2. **File validation** → System determines file type (audio/video/invalid)
3. **Processing**:
   - **Audio files**: Saved directly to public directory
   - **Video files**: 
     - Saved to temporary location
     - Audio extracted using FFmpeg (WAV format, 16kHz, mono)
     - Temporary video deleted (unless configured otherwise)
4. **Transcription** → Whisper processes the audio file (same flow for both sources)
5. **File list updated** → Extracted audio appears with `.wav` extension

### File Naming Convention

| Original Upload | Stored As | Transcription File | Introspection File |
|----------------|-----------|-------------------|-------------------|
| interview.mp3 | interview.mp3 | interview.mp3.txt | interview.mp3.introspection.txt |
| presentation.mp4 | presentation.wav | presentation.wav.txt | presentation.wav.introspection.txt |
| meeting.mov | meeting.wav | meeting.wav.txt | meeting.wav.introspection.txt |

## Error Handling

The system gracefully handles various error conditions:

| Error Condition | User Message |
|----------------|--------------|
| Unsupported file format | "Unsupported file format '.ext'. Supported formats: Audio (...), Video (...)" |
| FFmpeg not installed | "FFmpeg is not available. Please install FFmpeg to process video files." |
| Video without audio track | "The uploaded video does not contain an audio track" |
| Corrupted video | "The video file appears to be corrupted and cannot be processed" |
| Processing timeout | "Video processing timed out. Please try a smaller file." |

## Configuration Options

Create a `.env` file in the project root to customize video processing:

```env
# Optional: Custom FFmpeg path
FFMPEG_PATH=/usr/local/bin/ffmpeg

# Optional: Maximum processing time (milliseconds)
VIDEO_PROCESSING_TIMEOUT=300000

# Optional: Keep original video files
KEEP_ORIGINAL_VIDEO=false

# Optional: Extracted audio format
EXTRACTED_AUDIO_FORMAT=wav
```

## Performance Considerations

### Estimated Processing Times

| Video Duration | Extraction Time | Transcription Time | Total Time |
|---------------|----------------|-------------------|------------|
| 5 minutes | 5-15 seconds | 30-90 seconds | ~35-105 seconds |
| 15 minutes | 10-30 seconds | 90-180 seconds | ~100-210 seconds |
| 30 minutes | 20-60 seconds | 180-360 seconds | ~200-420 seconds |
| 60 minutes | 40-120 seconds | 360-600 seconds | ~400-720 seconds |

### Resource Management
- Only one video is processed at a time
- Temporary files are deleted after extraction
- 5-minute timeout prevents indefinite hangs
- Extraction process is optimized for speech content

## Testing

### Manual Testing Checklist
- [ ] Upload MP4 video → verify audio extraction and transcription
- [ ] Upload MOV video → verify audio extraction and transcription
- [ ] Upload audio file → verify existing functionality still works
- [ ] Upload video without audio → verify appropriate error message
- [ ] Upload unsupported format → verify error message
- [ ] Verify extracted audio appears in file list
- [ ] Verify transcription works on extracted audio
- [ ] Verify introspection works on video-sourced transcripts

### Test Video Creation
To create a test video with audio:
```bash
# Using FFmpeg to create a test video with audio
ffmpeg -f lavfi -i testsrc=duration=10:size=1280x720:rate=30 \
       -f lavfi -i sine=frequency=1000:duration=10 \
       -c:v libx264 -c:a aac test_video.mp4
```

## Backward Compatibility

✅ The feature is fully backward compatible:
- Existing audio upload functionality unchanged
- Existing transcription workflow unchanged
- No breaking changes to API contracts
- No database or storage structure changes

## Future Enhancements

Potential improvements:
- Video preview thumbnails in file list
- Multi-track audio selection
- Batch video processing
- Real-time extraction progress indicator
- User-selectable output audio format
- Quality/bitrate settings

## Troubleshooting

### Issue: "FFmpeg is not available"
**Solution**: Install FFmpeg following the instructions above, or set `FFMPEG_PATH` in `.env`

### Issue: "Video processing timed out"
**Solution**: 
- Try a shorter video or smaller file size
- Increase `VIDEO_PROCESSING_TIMEOUT` in `.env`
- Compress the video before uploading

### Issue: Extracted audio quality is poor
**Solution**: The current settings (16kHz, mono) are optimized for speech transcription. If needed, adjust settings in `video-processor.ts`

### Issue: Temporary files not being deleted
**Solution**: Check file permissions on the public directory. Ensure the application has write/delete permissions.

## Architecture Diagram

```
User Upload Video (MP4, MOV, etc.)
        ↓
  File Type Validator
        ↓
   Video Processor (FFmpeg)
        ↓
  Extracted Audio (WAV, 16kHz, mono)
        ↓
  Whisper Transcription
        ↓
  LLM Introspection
        ↓
  Display Results
```

## Support

For issues or questions related to this feature:
1. Ensure FFmpeg is properly installed
2. Check console logs for detailed error messages
3. Verify environment variables are correctly configured
4. Test with a small, simple video file first

## License

This feature follows the same MIT license as the main project.
