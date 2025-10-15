/**
 * Application constants.
 * Only includes constants actually used in the MVP.
 */

/**
 * Maximum file size for uploads (15MB).
 */
export const MAX_SIZE_BYTES = 15728640;

export interface FontOption {
  name: string;
  value: string;
  category: 'monospace' | 'serif' | 'sans-serif';
}

export const FONT_OPTIONS: FontOption[] = [
  {
    name: 'SF Mono',
    value: "'SFMonoSquare-Regular', 'SF Mono', Consolas, monaco, monospace",
    category: 'monospace',
  },
  {
    name: 'Consolas',
    value: 'Consolas, monaco, monospace',
    category: 'monospace',
  },
  {
    name: 'Monaco',
    value: 'Monaco, Consolas, monospace',
    category: 'monospace',
  },
  {
    name: 'Courier New',
    value: "'Courier New', Courier, monospace",
    category: 'monospace',
  },
  {
    name: 'Menlo',
    value: 'Menlo, Monaco, Consolas, monospace',
    category: 'monospace',
  },
  {
    name: 'Ubuntu Mono',
    value: "'Ubuntu Mono', monospace",
    category: 'monospace',
  },
  {
    name: 'Roboto Mono',
    value: "'Roboto Mono', monospace",
    category: 'monospace',
  },
  {
    name: 'Silvana',
    value: "'Silvana-Regular', 'Times New Roman', serif",
    category: 'serif',
  },
  {
    name: 'System Default',
    value: '-apple-system, BlinkMacSystemFont, Helvetica, sans-serif',
    category: 'sans-serif',
  },
];

export const DEFAULT_TRANSCRIPTION_FONT = FONT_OPTIONS[0].value;
export const TRANSCRIPTION_FONT_STORAGE_KEY = 'transcription-font-preference';
