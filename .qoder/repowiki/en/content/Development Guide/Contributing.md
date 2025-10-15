# Contributing

<cite>
**Referenced Files in This Document**   
- [README.md](file://README.md)
- [package.json](file://package.json)
- [scripts/run.js](file://scripts/run.js)
- [pages/api/introspect.ts](file://pages/api/introspect.ts)
- [common/constants.ts](file://common/constants.ts)
- [common/utilities.ts](file://common/utilities.ts)
- [common/server.ts](file://common/server.ts)
</cite>

## Table of Contents
1. [Contribution Workflow](#contribution-workflow)
2. [Development Environment Setup (macOS)](#development-environment-setup-macos)
3. [Available NPM Scripts](#available-npm-scripts)
4. [Testing and Debugging](#testing-and-debugging)
5. [Code Style and Best Practices](#code-style-and-best-practices)
6. [Troubleshooting Common Issues](#troubleshooting-common-issues)
7. [Data Privacy and Offline-First Practices](#data-privacy-and-offline-first-practices)
8. [Contact Information](#contact-information)

## Contribution Workflow

To contribute to this project, follow these steps:

1. **Fork the Repository**: Begin by forking the repository on GitHub to your personal account.
2. **Clone Your Fork**: Clone your forked repository to your local machine using `git clone`.
3. **Create a Feature Branch**: Create a new branch for your changes using a descriptive name: `git checkout -b feature/your-feature-name`.
4. **Implement Changes**: Make your changes following the code style guidelines and project architecture.
5. **Test Your Changes**: Use the provided npm scripts to test your changes locally.
6. **Commit and Push**: Commit your changes with a clear message and push them to your forked repository.
7. **Submit a Pull Request**: Open a pull request from your feature branch to the main repository's main branch.

Ensure all contributions align with the offline-first philosophy and maintain data privacy standards.

**Section sources**
- [README.md](file://README.md#L1-L64)

## Development Environment Setup (macOS)

To set up the development environment on macOS:

1. Install Homebrew if not already installed: `/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"`
2. Install required dependencies:
   ```sh
   brew install cmake
   brew install ffmpeg
   brew install ollama
   ```
3. Clone the repository and navigate to the project directory.
4. Install Node.js dependencies:
   ```sh
   npm install
   ```
5. Download the Whisper model:
   ```sh
   npx nodejs-whisper download
   ```
6. Pull the LLM model:
   ```sh
   ollama pull gemma3:27b
   ```

This setup ensures all components necessary for transcription and LLM processing are available locally.

**Section sources**
- [README.md](file://README.md#L30-L50)

## Available NPM Scripts

The following npm scripts are available for development:

### local
Starts the development server on port 10000:
```sh
npm run local
```
After running this command, access the application at `http://localhost:10000`.

### llm
Launches Ollama with specific environment variables for model loading:
```sh
npm run llm
```
This script sets `OLLAMA_LOAD_TIMEOUT=30m`, `OLLAMA_KEEP_ALIVE=10m`, and `OLLAMA_NOHISTORY=true` to optimize LLM performance.

### script
Runs TypeScript scripts via ts-node for pipeline testing:
```sh
npm run script run
```
This command executes the `scripts/run.js` file, which tests the complete transcription and introspection pipeline.

These scripts facilitate development and debugging by providing controlled execution environments.

**Section sources**
- [package.json](file://package.json#L10-L18)

## Testing and Debugging

For testing new features, particularly around file handling and LLM interactions:

1. Use the `npm run script run` command to test the complete pipeline.
2. The test script processes a sample audio file (`the-motivation-mindset-with-risa-williams.mp3`) through transcription and introspection stages.
3. Verify output files are generated correctly in the `public` directory.
4. Check console logs for any errors or warnings during execution.

The pipeline testing script demonstrates proper integration between Whisper transcription and Ollama LLM processing, ensuring end-to-end functionality.

**Section sources**
- [scripts/run.js](file://scripts/run.js#L1-L247)
- [README.md](file://README.md#L50-L60)

## Code Style and Best Practices

When contributing code:

1. Follow existing code style patterns in the repository.
2. Ensure all file operations respect the offline-first principle.
3. Handle audio files securely, maintaining user privacy.
4. Use proper error handling for external service interactions (Ollama).
5. Optimize for performance when processing large audio files.

The codebase emphasizes clean, maintainable patterns with a focus on data security and privacy.

**Section sources**
- [common/utilities.ts](file://common/utilities.ts#L1-L329)
- [common/constants.ts](file://common/constants.ts#L1-L126)

## Troubleshooting Common Issues

### Missing whisper-cli
If you encounter issues with missing `whisper-cli`:
1. Re-run the model download command: `npx nodejs-whisper download`
2. Ensure cmake and ffmpeg are properly installed via Homebrew
3. Verify Node.js dependencies are fully installed

### Ollama Connection Errors
For Ollama connection issues:
1. Ensure Ollama is running: `npm run llm`
2. Verify the gemma3 model is pulled: `ollama pull gemma3:27b`
3. Check that the API endpoint `http://localhost:11434` is accessible

### General Setup Issues
- Ensure Node.js version 18 or higher is installed
- Verify sufficient disk space for model downloads
- Check file permissions for the project directory

**Section sources**
- [README.md](file://README.md#L50-L60)
- [scripts/run.js](file://scripts/run.js#L127-L155)

## Data Privacy and Offline-First Practices

This project follows strict offline-first development practices:

1. All audio transcription occurs locally using Whisper.
2. LLM processing happens on the local machine via Ollama.
3. No user data is transmitted to external servers.
4. The application operates entirely in the browser after initial setup.

These practices ensure maximum data privacy and security, making the application suitable for handling sensitive audio content.

**Section sources**
- [README.md](file://README.md#L1-L15)
- [pages/api/introspect.ts](file://pages/api/introspect.ts#L1-L149)

## Contact Information

For questions or assistance with contributions, contact the maintainers:

- Twitter: [@wwwjim](https://www.twitter.com/wwwjim)
- Twitter: [@internetxstudio](https://x.com/internetxstudio)

Please use GitHub issues for feature proposals or bug reports.

**Section sources**
- [README.md](file://README.md#L62-L64)