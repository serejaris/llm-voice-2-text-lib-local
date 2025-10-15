import { Agent } from 'undici';

/**
 * Ollama endpoint configuration.
 * Can be overridden with OLLAMA_HOST environment variable.
 */
export const OLLAMA_ENDPOINT = process.env.OLLAMA_HOST || 'http://localhost:11434';

/**
 * Ollama model to use for introspection.
 * Can be overridden with OLLAMA_MODEL environment variable.
 */
export const OLLAMA_MODEL = process.env.OLLAMA_MODEL || 'gemma3:27b';

/**
 * Query directives for LLM responses.
 * Instructs the LLM to wrap responses in specific tags.
 */
export const QUERY_DIRECTIVES = `
- Return a response with <plain_text_response> and </plain_text_response> tags around the answer.`;

/**
 * HTTP agent with no timeout for long-running LLM requests.
 */
export const noTimeoutAgent = new Agent({
  headersTimeout: 0,
  bodyTimeout: 0,
});

/**
 * Extracts plain text from LLM response, removing XML tags if present.
 * 
 * @param rawOutput - Raw output from LLM (can be string or array)
 * @returns Extracted plain text or null if extraction fails
 */
export function extractPlainText(rawOutput: any): string | null {
  if (!rawOutput) return null;

  if (Array.isArray(rawOutput)) {
    if (typeof rawOutput[1] === 'string') {
      return rawOutput[1].trimEnd();
    }
    rawOutput = rawOutput[0];
  }

  if (typeof rawOutput === 'string') {
    const tagRegex = /<plain_text_response>\s*([\s\S]*?)\s*<\/plain_text_response>/i;
    const match = rawOutput.match(tagRegex);
    if (match && typeof match[1] === 'string') {
      return match[1].trimEnd();
    }
    return rawOutput.trimEnd();
  }

  return null;
}

/**
 * Normalizes multi-line text by removing extra whitespace and handling line breaks.
 * Preserves hyphenation and proper spacing between words.
 * 
 * @param input - Multi-line text to normalize
 * @returns Normalized single-line text
 */
export function normalizeMultilineText(input: string): string {
  const lines = input
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => line.length > 0);

  const result: string[] = [];

  for (let i = 0; i < lines.length; i++) {
    const current = lines[i];
    const next = lines[i + 1] || '';

    if (current.endsWith('-') && next) {
      result.push(current.slice(0, -1));
    } else {
      if (current.match(/[a-zA-Z0-9)]$/) && next && !next.startsWith(',') && !next.startsWith('.') && !next.startsWith(';') && !next.startsWith(':')) {
        result.push(current + ' ');
      } else {
        result.push(current);
      }
    }
  }

  return result.join('').replace(/\s+/g, ' ').trim();
}

/**
 * Queries Ollama LLM with a prompt and returns the response.
 * Uses the configured endpoint and model from environment or defaults.
 * 
 * @param promptText - The complete prompt to send to the LLM
 * @returns Extracted plain text response or null if query fails
 */
export async function queryOllamaHTTP(promptText: string): Promise<string | null> {
  try {
    const response = await fetch(`${OLLAMA_ENDPOINT}/api/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: OLLAMA_MODEL,
        prompt: promptText,
        stream: false,
      }),
      // @ts-ignore - undici dispatcher for no timeout
      dispatcher: noTimeoutAgent,
    });

    if (!response.ok) {
      console.error(`Ollama query failed with status: ${response.status}`);
      return null;
    }

    const jsonResp = await response.json();

    let introspectionResult = jsonResp.response.trim();
    const jsonRegex = /<plain_text_response>\s*([\s\S]*?)\s*<\/plain_text_response>/i;
    const jsonMatch = introspectionResult.match(jsonRegex);

    return extractPlainText(jsonMatch);
  } catch (error) {
    console.error('Error querying Ollama:', error);
    return null;
  }
}
