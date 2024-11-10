# Upload Progress Testing Guide

## Quick Start

To test the new upload progress visualization feature:

1. **Start the development server**
   ```bash
   npm run dev
   ```

2. **Open the application**
   - Navigate to `http://localhost:3000`

3. **Test Basic Upload**
   - Click "◎ Upload Audio/Video" button
   - Select an audio file (WAV or MP3)
   - Observe the progress overlay:
     - Upload progress bar with percentage
     - File name and size
     - Uploaded bytes (e.g., "5.2 MB of 10.0 MB")
     - Estimated time remaining
     - Stage indicators
   - Wait for upload to complete
   - Verify success message appears
   - Overlay auto-dismisses after 3 seconds

4. **Test Video Upload**
   - Click "◎ Upload Audio/Video" button
   - Select a video file (MP4, MOV, AVI)
   - Observe all three stages:
     1. Uploading (with progress bar)
     2. Extracting Audio (animated loader)
     3. Transcribing (animated loader)
   - Wait for completion
   - Verify success state

5. **Test Upload Cancellation**
   - Start uploading a large file
   - Click "Cancel Upload" button while uploading
   - Confirm cancellation in dialog
   - Verify upload aborts
   - Verify "Cancelled" state displays
   - Overlay auto-dismisses after 2 seconds

6. **Test Error Handling**
   - Try uploading unsupported file type (.txt, .pdf)
   - Verify error overlay appears with appropriate message
   - Click "Close" to dismiss

## Test Scenarios

### Scenario 1: Small Audio File
- **File**: < 5 MB audio file
- **Expected**: Fast upload, should complete in seconds
- **Check**: Progress updates smoothly, time estimation appears

### Scenario 2: Large Audio File
- **File**: > 50 MB audio file
- **Expected**: Longer upload time
- **Check**: 
  - Progress bar updates smoothly
  - Time estimation appears and updates
  - UI remains responsive
  - Can cancel during upload

### Scenario 3: Video File
- **File**: Any video file (MP4, MOV)
- **Expected**: Three processing stages
- **Check**:
  - Upload stage shows progress bar
  - Extracting stage shows animated loader
  - Transcribing stage shows animated loader
  - All stage indicators update correctly
  - Cannot cancel during extraction/transcription

### Scenario 4: Upload Cancellation
- **Steps**:
  1. Start uploading large file
  2. Click "Cancel Upload" during upload phase
  3. Confirm cancellation
- **Expected**: 
  - Upload stops immediately
  - Cancelled state displays
  - Auto-dismisses after 2 seconds
  - No file appears in list

### Scenario 5: Error - Unsupported File
- **File**: .txt, .pdf, or other non-audio/video file
- **Expected**:
  - Error overlay appears immediately
  - Error message: "Unsupported file format..."
  - Retry button available
  - Can close overlay

### Scenario 6: Network Error Simulation
- **Steps**:
  1. Start file upload
  2. Disconnect network during upload
- **Expected**:
  - Error state appears
  - Error message: "Network error during upload"
  - Can retry or close

### Scenario 7: Keyboard Navigation
- **Steps**:
  1. Start file upload
  2. Press Tab key
  3. Press Escape key
- **Expected**:
  - Tab navigates to cancel button
  - Escape triggers cancel confirmation
  - Enter/Space activates focused button

### Scenario 8: Mobile Responsive
- **Steps**:
  1. Open browser dev tools
  2. Switch to mobile device emulation
  3. Upload file
- **Expected**:
  - Overlay fits screen
  - Stage indicators arranged vertically
  - Buttons stacked vertically
  - All interactions work

## Accessibility Testing

### Screen Reader Test
1. Enable screen reader (VoiceOver on macOS, NVDA on Windows)
2. Start file upload
3. Verify announcements:
   - "Upload Progress dialog"
   - Progress percentage updates
   - Stage transitions
   - Success/error messages

### Keyboard-Only Navigation
1. Use only keyboard (no mouse)
2. Navigate using Tab, Shift+Tab
3. Activate buttons with Enter or Space
4. Cancel with Escape
5. Verify all functionality accessible

### High Contrast Mode
1. Enable system high contrast mode
2. Upload file
3. Verify all UI elements visible and readable

## Performance Checks

### CPU Usage
- Monitor CPU usage during upload
- Should remain reasonable (< 50% on modern hardware)
- UI should remain responsive

### Memory Usage
- Monitor browser memory usage
- Upload large file
- Memory should not grow excessively
- After upload completes, memory should stabilize

### Network Throttling
1. Open browser dev tools
2. Enable network throttling (Slow 3G)
3. Upload file
4. Verify:
   - Progress updates smoothly
   - Time estimation adjusts
   - UI remains responsive

## Browser Compatibility

Test in the following browsers:

- ✅ Chrome (latest)
- ✅ Firefox (latest)
- ✅ Safari (latest)
- ✅ Edge (latest)
- ✅ Mobile Safari (iOS)
- ✅ Chrome Mobile (Android)

## Regression Testing

After testing new features, verify existing functionality still works:

1. **File List Display**
   - Files appear correctly after upload
   - Can select files from list

2. **Transcription**
   - Can transcribe selected file
   - Transcription displays correctly

3. **Introspection**
   - Can run introspection on transcript
   - Results display correctly

4. **Prompt Management**
   - Can update default prompt
   - Prompt saves correctly

## Troubleshooting

### Progress Not Showing
- Check browser console for errors
- Verify `useUploadProgress` hook is connected
- Verify `uploadState.active` is true

### Time Estimation Not Appearing
- May not appear for very small files (< 1 MB)
- Requires at least 2 speed samples
- Check network speed is detectable

### Polling Not Working
- Check `/api/upload-status` endpoint is accessible
- Verify upload ID is being sent
- Check server console for errors

### Cancellation Not Working
- Verify cancel button is enabled (only during upload)
- Check `abortController` is properly connected
- Verify XHR is being used (not fetch)

## Known Issues

- Time estimation may be inaccurate for very fast connections
- Processing stages (extraction, transcription) show indeterminate progress
- Upload status stored in memory only (lost on server restart)

## Reporting Issues

When reporting issues, include:
1. Browser name and version
2. File type and size
3. Steps to reproduce
4. Expected vs actual behavior
5. Console errors (if any)
6. Network tab screenshot (for upload issues)
