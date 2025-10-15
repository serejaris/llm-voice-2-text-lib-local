# Configuration

<cite>
**Referenced Files in This Document**   
- [constants.ts](file://common/constants.ts)
- [server.ts](file://common/server.ts)
- [next.config.js](file://next.config.js)
- [introspect.ts](file://pages/api/introspect.ts)
- [run.js](file://scripts/run.js)
- [__prompt.txt](file://public/__prompt.txt)
</cite>

## Table of Contents
1. [Configuration](#configuration)
2. [Environment Variables and Application Settings](#environment-variables-and-application-settings)
3. [Centralized Configuration with constants.ts](#centralized-configuration-with-constantsts)
4. [Server Utilities in server.ts](#server-utilities-in-serverts)
5. [Next.js Configuration Settings](#nextjs-configuration-settings)
6. [Customizing Prompt Templates and LLM Models](#customizing-prompt-templates-and-llm-models)
7. [Common Configuration Issues](#common-configuration-issues)
8. [Performance Considerations](#performance-considerations)

## Environment Variables and Application Settings

The application utilizes several key configuration parameters that control its behavior and integration with external services. The primary environment variable is OLLAMA_HOST, which defaults to localhost:11434 for connecting to the Ollama service. This configuration is hardcoded in multiple locations including the introspect API endpoint and the run script, where the application makes HTTP requests to http://localhost:11434/api/generate for LLM processing.

The application also relies on two critical environment variables for server-side decryption functionality: API_AES_KEY and API_IV_KEY. These must be set for certain endpoints on https://api.internet.dev to function properly, particularly for operations like password recovery and Google authentication. Without these environment variables properly configured, the decryption function in server.ts will throw errors when attempting to process encrypted data.

Additional configuration parameters include file storage paths that follow a consistent pattern across the application. All user-uploaded audio files and their corresponding transcriptions are stored in the public directory, with transcriptions saved as .txt files and introspection results as .introspection.txt files. The application dynamically determines the repository root by searching for global.scss, ensuring correct path resolution regardless of execution context.

**Section sources**
- [introspect.ts](file://pages/api/introspect.ts#L43-L97)
- [run.js](file://scripts/run.js#L124-L162)
- [server.ts](file://common/server.ts#L0-L31)

## Centralized Configuration with constants.ts

The constants.ts file serves as the central repository for application-wide configuration values, providing a single source of truth for shared parameters. This file exports several key configuration objects that are imported throughout the application. The MAX_SIZE_BYTES constant is set to 15,728,640 bytes (15MB), which defines the maximum file size allowed for uploads, ensuring system stability and preventing excessive resource consumption.

The Query object contains directives that are consistently applied across LLM interactions, specifically instructing responses to be wrapped in <plain_text_response> and </plain_text_response> tags. This standardized formatting enables reliable parsing of LLM outputs throughout the application. The constants file also defines user tier levels and associated payment amounts, which could be used for feature gating or access control in extended implementations.

Additionally, constants.ts includes terminal color codes used for formatted console output in scripts, and a comprehensive set of font options for UI rendering. These centralized definitions ensure consistency across different components and prevent configuration drift. The API endpoint is also defined here, currently pointing to https://api.internet.dev/api, which serves as the backend service for user authentication and data operations.

**Section sources**
- [constants.ts](file://common/constants.ts#L0-L126)

## Server Utilities in server.ts

The server.ts utility file provides essential middleware and helper functions for server-side operations, with a focus on security and request handling. The file implements CORS (Cross-Origin Resource Sharing) configuration through the initMiddleware function, which wraps the Cors module with predefined settings allowing GET, POST, DELETE, and OPTIONS methods. This configuration ensures proper browser security while enabling necessary API interactions.

A critical security feature is the decrypt function, which uses AES encryption to decrypt data using keys provided through environment variables (API_AES_KEY and API_IV_KEY). This function is essential for accessing protected endpoints on the backend API and demonstrates the application's security architecture. The setup function handles session management by extracting the sitekey from cookies and validating it against the backend API to retrieve user information.

The server.ts file also includes the tryKeyWithoutCookie function, which provides an alternative authentication method by directly using an API key without relying on cookie-based sessions. These utilities are consistently imported as Server across API routes, creating a standardized interface for common server operations and promoting code reuse throughout the application.

**Section sources**
- [server.ts](file://common/server.ts#L0-L98)

## Next.js Configuration Settings

The Next.js configuration is minimal but purposeful, defined in the next.config.js file. The configuration sets devIndicators to false, which disables development indicators in the application. This setting improves the user experience by removing visual debugging elements in development mode, presenting a cleaner interface during development and testing.

While the configuration file itself is simple, the application leverages Next.js API routes extensively, with each API endpoint configured with responseLimit: false in their config export. This setting is crucial for handling large responses from the LLM processing, preventing timeouts or truncation of lengthy introspection results. The API routes are organized in the pages/api directory and follow Next.js conventions for serverless function deployment.

Although the documentation objective mentioned port 10000, no explicit port configuration was found in the codebase. The application likely relies on default Next.js port assignment (typically 3000) or environment-based port configuration that is not explicitly defined in the provided files. The application structure follows standard Next.js conventions with app directory for the new routing system and pages directory for API routes and legacy pages.

**Section sources**
- [next.config.js](file://next.config.js#L0-L4)

## Customizing Prompt Templates and LLM Models

The application supports customization of both prompt templates and LLM models, allowing users to tailor the introspection process to their specific needs. The prompt template is stored in the public/__prompt.txt file and can be modified through the update-prompt API endpoint. The default prompt instructs the system to produce 10 meaningful insights, identify logical disconnects with the real world, and respond as one of the world's best professors without self-reference.

Users can customize the prompt by sending a POST request to /api/update-prompt with a new prompt in the request body. This change is persisted by writing the new prompt to the __prompt.txt file in the public directory. The application reads this file whenever generating introspections, ensuring that custom prompts are consistently applied. The UI also provides a direct interface for updating the prompt, allowing users to modify it through a text area and save changes with a single click.

The LLM model is currently hardcoded to 'gemma3:27b' in both the introspect API and the run script. To change the model, developers must modify the model parameter in the JSON payload sent to the Ollama API. This requires editing the source code in multiple locations, as the model specification appears in both introspect.ts and run.js. Switching models may require consideration of hardware requirements, as larger models like gemma3:27b demand significant computational resources.

**Section sources**
- [__prompt.txt](file://public/__prompt.txt#L0-L2)
- [introspect.ts](file://pages/api/introspect.ts#L94-L148)
- [update-prompt.ts](file://pages/api/update-prompt.ts#L0-L49)
- [run.js](file://scripts/run.js#L124-L162)

## Common Configuration Issues

Several common configuration issues can prevent the application from functioning correctly. The most frequent issue is an incorrect Ollama URL, where the hardcoded http://localhost:11434 may not match the actual Ollama server address. This can occur if Ollama is running on a different port, on a remote server, or within a Docker container with different networking. When this happens, the fetch operation in queryOllamaHTTP fails, resulting in null responses and preventing introspection generation.

Missing environment variables represent another critical configuration issue. If API_AES_KEY or API_IV_KEY are not set, the decrypt function throws errors, breaking functionality that depends on server-side decryption. This affects operations like password recovery and Google authentication, potentially limiting user functionality. The application provides clear error messages in these cases, helping diagnose the missing environment variables.

File system issues can also arise from incorrect directory configurations. The application assumes audio files and transcriptions are stored in the public directory, and if this directory is missing or has incorrect permissions, file operations will fail. Additionally, if the __prompt.txt file does not exist in the public directory, the get-prompt and introspect endpoints will return 404 errors, preventing prompt retrieval and processing.

**Section sources**
- [introspect.ts](file://pages/api/introspect.ts#L43-L97)
- [server.ts](file://common/server.ts#L0-L31)
- [get-prompt.ts](file://pages/api/get-prompt.ts#L0-L42)

## Performance Considerations

Performance optimization in this application involves careful consideration of timeout settings and LLM model selection based on available hardware. The application configures HTTP requests to the Ollama API with no timeout limits using the undici Agent with headersTimeout: 0 and bodyTimeout: 0. This is essential for processing large audio files and generating comprehensive introspections, as these operations can take several minutes to complete. However, this approach should be used judiciously in production environments to prevent resource exhaustion.

The choice of LLM model significantly impacts performance and hardware requirements. The currently configured model, gemma3:27b, is a large language model that requires substantial computational resources, including significant RAM and GPU memory. Users with limited hardware may experience slow processing times or out-of-memory errors. For such cases, switching to smaller models like gemma:2b or other lightweight alternatives can dramatically improve performance at the cost of reduced reasoning capability.

Other performance considerations include the 15MB file size limit enforced by MAX_SIZE_BYTES, which prevents excessively large audio files from overwhelming the system. The transcription process using nodejs-whisper is also resource-intensive, particularly with the large-v3-turbo model. Users can optimize performance by using shorter audio clips or by adjusting the whisperOptions to reduce processing complexity, such as disabling word-level timestamps or using simpler output formats.

**Section sources**
- [introspect.ts](file://pages/api/introspect.ts#L0-L150)
- [run.js](file://scripts/run.js#L0-L247)
- [constants.ts](file://common/constants.ts#L0-L10)