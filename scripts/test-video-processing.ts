/**
 * Test script for video processing functionality
 * 
 * This script tests the video-to-audio extraction pipeline
 */

import fs from 'fs/promises';
import path from 'path';
import { extractAudioFromVideo } from '../common/server/video-processor';
import { validateFileType, FileType } from '../common/server/file-type-validator';

async function testVideoProcessing() {
  console.log('='.repeat(60));
  console.log('Video Processing Feature Test');
  console.log('='.repeat(60));
  
  // Test 1: File Type Validation
  console.log('\n[Test 1] File Type Validation');
  console.log('-'.repeat(60));
  
  const testCases = [
    'audio.mp3',
    'video.mp4',
    'presentation.mov',
    'document.pdf',
    'recording.wav',
    'movie.avi',
  ];
  
  testCases.forEach(filename => {
    const result = validateFileType(filename);
    console.log(`  ${filename.padEnd(20)} → ${result.fileType.toUpperCase().padEnd(10)} (${result.isSupported ? '✓ Supported' : '✗ Not Supported'})`);
  });
  
  // Test 2: Video Audio Extraction
  console.log('\n[Test 2] Video Audio Extraction');
  console.log('-'.repeat(60));
  
  try {
    const testVideoPath = path.join(process.cwd(), 'public', 'test_video.mp4');
    
    // Check if test video exists
    try {
      await fs.access(testVideoPath);
      console.log('  ✓ Test video found:', testVideoPath);
    } catch {
      console.log('  ✗ Test video not found. Creating one...');
      console.log('  Please run the following command to create a test video:');
      console.log('  ffmpeg -f lavfi -i testsrc=duration=5:size=640x480:rate=30 -f lavfi -i sine=frequency=1000:duration=5 -c:v libx264 -c:a aac -y public/test_video.mp4');
      return;
    }
    
    // Read the video file
    const videoBuffer = await fs.readFile(testVideoPath);
    console.log(`  ✓ Video buffer size: ${(videoBuffer.length / 1024).toFixed(2)} KB`);
    
    // Extract audio
    console.log('  Processing video (this may take a few seconds)...');
    const result = await extractAudioFromVideo(videoBuffer, 'test_video.mp4');
    
    if (result.success) {
      console.log('  ✓ Audio extraction successful!');
      console.log(`    - Audio file: ${result.audioFilename}`);
      console.log(`    - Audio path: ${result.audioFilePath}`);
      
      // Verify the extracted audio file exists
      try {
        const stats = await fs.stat(result.audioFilePath!);
        console.log(`    - File size: ${(stats.size / 1024).toFixed(2)} KB`);
        console.log('  ✓ Extracted audio file verified');
      } catch (err) {
        console.log('  ✗ Extracted audio file not found');
      }
    } else {
      console.log('  ✗ Audio extraction failed');
      console.log(`    Error: ${result.error}`);
    }
    
  } catch (error) {
    console.log('  ✗ Test failed with error:');
    console.log(`    ${error instanceof Error ? error.message : error}`);
  }
  
  console.log('\n' + '='.repeat(60));
  console.log('Test Complete');
  console.log('='.repeat(60) + '\n');
}

// Run the test
testVideoProcessing().catch(console.error);
