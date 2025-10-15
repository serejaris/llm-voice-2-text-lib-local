# Architecture

<cite>
**Referenced Files in This Document**   
- [Application.tsx](file://components/Application.tsx)
- [page.tsx](file://app/page.tsx)
- [transcribe.ts](file://pages/api/transcribe.ts)
- [upload.ts](file://pages/api/upload.ts)
- [get-transcription.ts](file://pages/api/get-transcription.ts)
- [get-introspection.ts](file://pages/api/get-introspection.ts)
- [get-prompt.ts](file://pages/api/get-prompt.ts)
- [update-prompt.ts](file://pages/api/update-prompt.ts)
- [list.ts](file://pages/api/list.ts)
- [introspect.ts](file://pages/api/introspect.ts)
- [server.ts](file://common/server.ts)
- [cors.ts](file://modules/cors.ts)
- [queries.ts](file://common/queries.ts)
- [utilities.ts](file://common/utilities.ts)
- [constants.ts](file://common/constants.ts)
</cite>

## Table of Contents
1. [Introduction](#introduction)
2. [Project Structure](#project-structure)
3. [Core Components](#core-components)
4. [Architecture Overview](#architecture-overview)
5. [Detailed Component Analysis](#detailed-component-analysis)
6. [Dependency Analysis](#dependency-analysis)
7. [Performance Considerations](#performance-considerations)
8. [Troubleshooting Guide](#troubleshooting-guide)
9. [Conclusion](#conclusion)

## Introduction
This document provides comprehensive architectural documentation for a Next.js application that enables offline audio transcription and introspection using local Whisper and Ollama models. The system follows a component-based React frontend with server-side API routes handling file operations, transcription, and AI processing. It supports offline-first operation with local file system storage and integrates with external authentication via api.internet.dev. The architecture emphasizes separation of concerns through modular directory organization and implements cross-cutting concerns like CORS and error handling.

## Project Structure

The application follows a hybrid Next.js structure combining App Router (app/) and Pages Router (pages/) patterns. Core components are organized by concern:

```mermaid
graph TB
subgraph "Frontend"
A[app/page.tsx]
B[components/Application.tsx]
C[components/*.tsx]
end
subgraph "Backend"
D[pages/api/*.ts]
E[common/*.ts]
F[modules/cors.ts]
end
subgraph "Configuration"
G[next.config.js]
H[tsconfig.json]
end
A --> B
B --> C
D --> E
D --> F
E --> H
```

**Diagram sources**
- [page.tsx](file://app/page.tsx)
- [Application.tsx](file://components/Application.tsx)
- [transcribe.ts](file://pages/api/transcribe.ts)
- [server.ts](file://common/server.ts)

**Section sources**
- [page.tsx](file://app/page.tsx)
- [Application.tsx](file://components/Application.tsx)
- [next.config.js](file://next.config.js)

## Core Components

The application's core functionality revolves around audio file processing through Whisper for transcription and Ollama for introspection. The frontend is built with React components in the components/ directory, while backend processing occurs in API routes under pages/api/. Key components include Application.tsx for UI state management, API handlers for server-side operations, and utility modules for cross-cutting concerns. The system uses SCSS modules for scoped styling and environment variables for configuration.

**Section sources**
- [Application.tsx](file://components/Application.tsx)
- [queries.ts](file://common/queries.ts)
- [utilities.ts](file://common/utilities.ts)

## Architecture Overview

The application follows a client-server pattern with React components making API calls to Next.js server routes. User interactions in the frontend trigger API requests that process audio files locally using Whisper and Ollama. Transcription results and introspection outputs are stored in the public directory and retrieved as needed. The architecture supports offline operation by keeping all processing local and using the file system as persistent storage.

```mermaid
sequenceDiagram
participant User as "User"
participant UI as "Application.tsx"
participant API as "API Routes"
participant Whisper as "Whisper Model"
participant Ollama as "Ollama Model"
participant FS as "File System"
User->>UI : Upload audio file
UI->>API : POST /api/upload
API->>FS : Save file to /public
API->>Whisper : Transcribe audio
Whisper->>FS : Save transcription (.txt)
API-->>UI : Upload complete
User->>UI : Request transcription
UI->>API : POST /api/transcribe
API->>Whisper : Process file
Whisper->>FS : Update transcription
API-->>UI : Transcription complete
User->>UI : Request introspection
UI->>API : POST /api/introspect
API->>FS : Read transcription
API->>Ollama : Analyze content
Ollama->>FS : Save introspection (.introspection.txt)
API-->>UI : Introspection complete
```

**Diagram sources**
- [Application.tsx](file://components/Application.tsx)
- [upload.ts](file://pages/api/upload.ts)
- [transcribe.ts](file://pages/api/transcribe.ts)
- [introspect.ts](file://pages/api/introspect.ts)
- [get-transcription.ts](file://pages/api/get-transcription.ts)
- [get-introspection.ts](file://pages/api/get-introspection.ts)

## Detailed Component Analysis

### Application State Management
The Application component manages the complete UI state for audio processing workflows, including file selection, upload status, transcription progress, and introspection results. It orchestrates interactions between UI elements and API endpoints.

```mermaid
classDiagram
class Application {
+string prompt
+string current
+string[] files
+boolean uploading
+boolean transcribing
+boolean introspecting
+string transcription
+string introspection
+onSelect(name) void
+init() void
}
class ActionUploadButton {
+boolean disabled
+onLoading() void
+onSuccess(data) void
}
class Queries {
+getData(route, body) Promise
}
Application --> ActionUploadButton : "uses"
Application --> Queries : "depends on"
ActionUploadButton --> Queries : "calls /api/upload"
```

**Diagram sources**
- [Application.tsx](file://components/Application.tsx)
- [ActionUploadButton.tsx](file://components/ActionUploadButton.tsx)
- [queries.ts](file://common/queries.ts)

### API Processing Pipeline
The server-side API routes implement a processing pipeline for audio files, from upload to transcription to introspection. Each route handles specific aspects of the workflow with consistent error handling and CORS support.

```mermaid
flowchart TD
Start([API Request]) --> ValidateInput["Validate Request Body"]
ValidateInput --> InputValid{"Valid Data?"}
InputValid --> |No| ReturnError["Return 400 Error"]
InputValid --> |Yes| FindRepoRoot["Locate Repository Root"]
FindRepoRoot --> RootFound{"Root Found?"}
RootFound --> |No| ReturnConflict["Return 409 Error"]
RootFound --> |Yes| ProcessRequest["Process Specific Request"]
ProcessRequest --> UploadFlow["/api/upload: Save File & Transcribe"]
ProcessRequest --> TranscribeFlow["/api/transcribe: Run Whisper"]
ProcessRequest --> IntrospectFlow["/api/introspect: Query Ollama"]
ProcessRequest --> ListFlow["/api/list: Read Directory"]
ProcessRequest --> GetFlow["/api/get-*: Read File"]
ProcessRequest --> UpdateFlow["/api/update-prompt: Write File"]
UploadFlow --> ReturnSuccess
TranscribeFlow --> ReturnSuccess
IntrospectFlow --> ReturnSuccess
ListFlow --> ReturnSuccess
GetFlow --> ReturnSuccess
UpdateFlow --> ReturnSuccess
ReturnError --> End([Response Sent])
ReturnConflict --> End
ReturnSuccess[Return 200 Success] --> End
```

**Diagram sources**
- [upload.ts](file://pages/api/upload.ts)
- [transcribe.ts](file://pages/api/transcribe.ts)
- [introspect.ts](file://pages/api/introspect.ts)
- [list.ts](file://pages/api/list.ts)
- [get-transcription.ts](file://pages/api/get-transcription.ts)
- [get-introspection.ts](file://pages/api/get-introspection.ts)
- [get-prompt.ts](file://pages/api/get-prompt.ts)
- [update-prompt.ts](file://pages/api/update-prompt.ts)
- [server.ts](file://common/server.ts)

## Dependency Analysis

The application's dependencies follow a clear hierarchy from UI components to service layers to external integrations. The architecture minimizes coupling between components while maintaining cohesive functionality within feature domains.

```mermaid
graph TD
A[Application.tsx] --> B[queries.ts]
A --> C[utilities.ts]
A --> D[ActionUploadButton.tsx]
B --> E[fetch API]
C --> F[fs, path]
G[API Routes] --> H[server.ts]
G --> I[utilities.ts]
G --> J[nodewhisper]
G --> K[undici]
H --> L[cors.ts]
M[page.tsx] --> N[Application.tsx]
M --> O[DefaultLayout.tsx]
style A fill:#f9f,stroke:#333
style G fill:#bbf,stroke:#333
```

**Diagram sources**
- [go.mod](file://package.json)
- [Application.tsx](file://components/Application.tsx)
- [server.ts](file://common/server.ts)
- [page.tsx](file://app/page.tsx)

**Section sources**
- [package.json](file://package.json)
- [server.ts](file://common/server.ts)

## Performance Considerations

The application faces significant performance challenges due to local processing requirements. Audio transcription with Whisper and introspection with Ollama can take over five minutes per file, as noted in confirmation dialogs. The architecture addresses this through:

1. Client-side state management to show loading states
2. Server-side configuration with responseLimit: false for long-running operations
3. Local file system storage to avoid reprocessing
4. Progressive enhancement with immediate feedback on user actions

Scalability is limited by the local processing model, making the application suitable for single-user, offline scenarios rather than multi-user deployments. The use of large language models (gemma3:27b) and speech recognition models (large-v3-turbo) requires substantial local resources.

## Troubleshooting Guide

The application implements several error handling patterns across frontend and backend components:

```mermaid
stateDiagram-v2
[*] --> Idle
Idle --> Processing : "User action"
Processing --> Success : "Operation complete"
Processing --> ValidationError : "Missing/invalid data"
Processing --> FileError : "File not found"
Processing --> SystemError : "File system error"
Processing --> NetworkError : "Fetch failure"
ValidationError --> Return400 : "Return 400"
FileError --> Return404 : "Return 404"
SystemError --> Return500 : "Return 500"
NetworkError --> ReturnNull : "Return null"
Return400 --> Idle
Return404 --> Idle
Return500 --> Idle
ReturnNull --> Idle
Success --> Idle
```

Key troubleshooting areas include:
- CORS configuration in modules/cors.ts for API route accessibility
- Environment variables API_AES_KEY and API_IV_KEY for authentication decryption
- File system permissions for reading/writing in the public directory
- Local service availability for Whisper (nodejs-whisper) and Ollama (localhost:11434)
- Network connectivity for external API calls to api.internet.dev

**Section sources**
- [server.ts](file://common/server.ts)
- [cors.ts](file://modules/cors.ts)
- [utilities.ts](file://common/utilities.ts)

## Conclusion

The application presents a robust architecture for offline audio processing using modern AI models. Its component-based React frontend provides an intuitive user interface, while Next.js API routes enable server-side processing without external dependencies. The clear separation of concerns through directory organization enhances maintainability, and the use of SCSS modules ensures scoped styling. While the local processing model limits scalability, it enables complete offline functionality. Future improvements could include Web Workers for non-blocking UI during processing and enhanced error recovery for failed operations.