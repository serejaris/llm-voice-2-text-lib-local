# Troubleshooting

<cite>
**Referenced Files in This Document**   
- [README.md](file://README.md)
- [common/server.ts](file://common/server.ts)
- [pages/api/upload.ts](file://pages/api/upload.ts)
- [pages/api/introspect.ts](file://pages/api/introspect.ts)
- [pages/api/get-introspection.ts](file://pages/api/get-introspection.ts)
- [pages/api/transcribe.ts](file://pages/api/transcribe.ts)
- [components/Application.tsx](file://components/Application.tsx)
</cite>

## Table of Contents
1. [Setup Issues](#setup-issues)
2. [Runtime Errors](#runtime-errors)
3. [API and CORS Issues](#api-and-cors-issues)
4. [Performance Bottlenecks](#performance-bottlenecks)
5. [Known Limitations and Workarounds](#known-limitations-and-workarounds)

## Setup Issues

This section addresses common setup problems related to missing dependencies such as CMake, FFmpeg, Whisper model, and Ollama service.

### Missing CMake or FFmpeg

The application relies on native dependencies that require CMake and FFmpeg for building and processing audio files. If either is missing, the Whisper transcription process will fail silently or throw file parsing errors.

**Symptoms**:
- Upload completes but no transcription is generated
- Console logs show `whisper-cli` not found or execution failure
- Node.js throws `spawn whisper-cli ENOENT`

**Solution**:
Install both tools using Homebrew on macOS:
```bash
brew install cmake
brew install ffmpeg
```

Verify installation:
```bash
cmake --version
ffmpeg -version
```

**Section sources**
- [README.md](file://README.md#L20-L25)

### Whisper Model Not Downloaded

The `large-v3-turbo` Whisper model must be downloaded before transcription can occur. If missing, uploads will succeed but transcription will not generate output.

**Symptoms**:
- No `.txt` transcription file created in `/public`
- No console output from `nodewhisper`
- Application hangs during transcribe step

**Solution**:
Download the model using the provided command:
```bash
npx nodejs-whisper download
```

Ensure the model `large-v3-turbo` is properly cached in the nodejs-whisper directory.

**Section sources**
- [README.md](file://README.md#L30-L31)

### Ollama Service Not Running

Ollama must be actively serving to support introspection. If not running, the LLM query will fail.

**Symptoms**:
- Introspection button does nothing
- Browser console shows 500 error on `/api/introspect`
- Network tab reveals timeout connecting to `http://localhost:11434`

**Solution**:
Start Ollama with environment variables using:
```bash
npm run llm
```

In a separate terminal, pull the required model:
```bash
ollama pull gemma3:27b
```

Verify service status:
```bash
curl http://localhost:11434
```

Expected response: `{"status":"running"}`

**Section sources**
- [README.md](file://README.md#L32-L36)
- [pages/api/introspect.ts](file://pages/api/introspect.ts#L60-L70)

## Runtime Errors

This section covers runtime issues including file upload failures, incorrect file handling, and state management problems.

### File Upload Failures

File uploads may fail due to malformed multipart boundaries or incorrect content-type headers.

**Symptoms**:
- API returns `400 Missing boundary`
- `apiUpload` function rejects with JSON error
- No file appears in `/public` directory

**Diagnosis**:
Check browser network tab:
1. Confirm request is `POST /api/upload`
2. Verify `Content-Type` includes `boundary=...`
3. Inspect payload structure for valid form data

**Solution**:
Ensure frontend uses proper `FormData`:
```javascript
const formData = new FormData();
formData.append('file', file);
await fetch('/api/upload', { method: 'POST', body: formData });
```

The backend parses raw buffer chunks and expects standard multipart formatting.

**Section sources**
- [pages/api/upload.ts](file://pages/api/upload.ts#L16-L106)
- [components/Application.tsx](file://components/Application.tsx#L70-L85)

### File Permissions in Public Directory

The `/public` directory must be writable for file uploads and transcription outputs.

**Symptoms**:
- Upload succeeds but file not saved
- `EACCES` or `Permission denied` errors in logs
- Transcription fails silently

**Solution**:
Ensure correct permissions:
```bash
chmod 755 public/
```

Verify ownership and path resolution in `apiUpload`, `apiTranscribe`, and `apiIntrospect` where `repoRoot` is dynamically determined.

**Section sources**
- [pages/api/upload.ts](file://pages/api/upload.ts#L80-L90)
- [pages/api/transcribe.ts](file://pages/api/transcribe.ts#L40-L50)

### Browser Console Logs for Debugging

Console logs provide critical insight into frontend state and API communication.

**Key Debugging Steps**:
1. Open Developer Tools → Console
2. Trigger upload/transcribe/introspect
3. Look for:
   - `Deleted existing file` (confirms overwrite)
   - `Missing boundary` (upload format error)
   - `process.env.API_IV_KEY is undefined` (server config issue)
   - Network errors on API calls

4. Check state variables:
   - `uploading`, `transcribing`, `introspecting` in `Application.tsx`
   - Alert messages indicating blocked actions

**Section sources**
- [components/Application.tsx](file://components/Application.tsx#L47-L51)
- [pages/api/introspect.ts](file://pages/api/introspect.ts#L80)

## API and CORS Issues

CORS misconfigurations can block legitimate API requests, especially during development.

### CORS Configuration

The application uses a custom CORS middleware to allow specific methods.

**Symptoms**:
- Preflight `OPTIONS` request fails
- `Access-Control-Allow-Origin` missing
- `405 Method Not Allowed` on POST

**Root Cause**:
Improperly configured CORS headers in `common/server.ts`.

**Solution**:
Ensure `cors` middleware allows required methods:
```ts
export const cors = initMiddleware(
  Cors({
    methods: ['GET', 'POST', 'DELETE', 'OPTIONS'],
  })
);
```

This is applied in all API routes via `await Server.cors(req, res);`.

**Section sources**
- [common/server.ts](file://common/server.ts#L54-L58)
- [pages/api/upload.ts](file://pages/api/upload.ts#L18)

### Malformed API Requests

Invalid request bodies or missing parameters cause 400 errors.

**Common Cases**:
- Empty `name` in `/api/transcribe`, `/api/introspect`, `/api/get-introspection`
- Missing `prompt` in `/api/update-prompt`
- Non-POST method to upload endpoint

**Validation Logic**:
All endpoints use `Utilities.isEmpty()` to validate inputs:
```ts
if (Utilities.isEmpty(name)) {
  return res.status(400).json({ error: true, data: null });
}
```

**Section sources**
- [pages/api/transcribe.ts](file://pages/api/transcribe.ts#L20-L22)
- [pages/api/introspect.ts](file://pages/api/introspect.ts#L96-L98)
- [pages/api/get-introspection.ts](file://pages/api/get-introspection.ts#L16-L18)

## Performance Bottlenecks

Transcription and introspection are computationally intensive and may cause long delays.

### Long Audio Transcription

Transcribing long audio files (e.g., 20+ minutes) can take over 5 minutes.

**Mitigation Strategies**:
- Use shorter audio clips (< 5 minutes)
- Pre-process audio to remove silence
- Use smaller Whisper models if accuracy allows

The current configuration uses `large-v3-turbo`, which balances speed and accuracy.

**Section sources**
- [pages/api/upload.ts](file://pages/api/upload.ts#L90-L100)
- [pages/api/transcribe.ts](file://pages/api/transcribe.ts#L50-L60)

### LLM Introspection Delays

Querying the LLM with large transcripts increases response time.

**Symptoms**:
- UI shows "PLEASE WAIT" for extended periods
- `queryOllamaHTTP` takes minutes to resolve
- Browser may timeout

**Optimization**:
- Reduce transcript length before introspection
- Use smaller LLM models (e.g., `gemma3:4b` instead of `gemma3:27b`)
- Increase timeout settings in `undici` agent

The current implementation uses a no-timeout agent:
```ts
const noTimeoutAgent = new Agent({ headersTimeout: 0, bodyTimeout: 0 });
```

**Section sources**
- [pages/api/introspect.ts](file://pages/api/introspect.ts#L10-L14)
- [pages/api/introspect.ts](file://pages/api/introspect.ts#L60-L70)

## Known Limitations and Workarounds

### Font Selector State During Processing

The font selector is disabled during upload, transcription, and introspection to prevent state conflicts.

**Expected Behavior**:
- Dropdown is non-interactive when `uploading`, `transcribing`, or `introspecting` is `true`
- Re-enables after operation completes

**Workaround for Testing**:
Manually set state in React DevTools to test rapid font changes.

**Section sources**
- [components/Application.tsx](file://components/Application.tsx#L150-L160)
- [FONT_CUSTOMIZATION_TESTS.md](file://FONT_CUSTOMIZATION_TESTS.md#L77-L90)

### File Naming and Path Resolution

The system uses dynamic `repoRoot` detection based on presence of `global.scss`.

**Risk**:
If `global.scss` is missing or moved, file paths may resolve incorrectly.

**Workaround**:
Ensure `global.scss` exists in project root, or modify path detection logic in each API route.

**Section sources**
- [pages/api/upload.ts](file://pages/api/upload.ts#L60-L75)
- [pages/api/transcribe.ts](file://pages/api/transcribe.ts#L25-L40)

### No Streaming Response for LLM

The LLM response is fetched in full before returning, preventing streaming output.

**Impact**:
User sees no progress during introspection.

**Future Improvement**:
Modify `queryOllamaHTTP` to use `stream: true` and handle partial responses.

**Section sources**
- [pages/api/introspect.ts](file://pages/api/introspect.ts#L65-L68)