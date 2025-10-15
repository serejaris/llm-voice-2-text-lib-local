/**
 * Shared utilities used across the application.
 * This contains only the essential functions needed for the MVP.
 */

/**
 * Checks if a value is empty (null, undefined, empty string, or whitespace-only).
 * Numbers (including 0) are not considered empty.
 * 
 * @param text - The value to check
 * @returns True if the value is empty
 */
export function isEmpty(text: any): boolean {
  // Numbers are not considered empty, even zero
  if (text === 0) {
    return false;
  }

  if (!text) {
    return true;
  }

  if (typeof text === 'object') {
    return true;
  }

  if (text.length === 0) {
    return true;
  }

  text = text.toString();

  return Boolean(!text.trim());
}

/**
 * Truncates a string to a specified length and adds ellipsis.
 * 
 * @param string - The string to truncate
 * @param length - Maximum length before truncation (default: 140)
 * @param emptyState - String to return if input is empty (default: '...')
 * @returns Truncated string with ellipsis, or the original if shorter than length
 */
export function elide(string: string, length: number = 140, emptyState: string = '...'): string {
  if (isEmpty(string)) {
    return emptyState;
  }

  if (string.length < length) {
    return string.trim();
  }

  return `${string.substring(0, length)}...`;
}

/**
 * Converts bytes to a human-readable size string.
 * 
 * @param bytes - Number of bytes
 * @param decimals - Number of decimal places (default: 2)
 * @returns Formatted size string (e.g., "1.23 MB")
 */
export function bytesToSize(bytes: number, decimals: number = 2): string {
  if (bytes === 0) return '0 Bytes';

  const k = 1000;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];

  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return `${(bytes / Math.pow(k, i)).toFixed(dm)} ${sizes[i]}`;
}

/**
 * Creates a debounced version of a function that delays execution until after
 * a specified delay has elapsed since the last time it was invoked.
 * 
 * @param fn - The function to debounce
 * @param delay - Delay in milliseconds
 * @returns Debounced function with a flush method
 */
export function debounce<Args extends unknown[]>(fn: (...args: Args) => void, delay: number) {
  let timeoutID: number | undefined;
  let lastArgs: Args | undefined;

  const run = () => {
    if (lastArgs) {
      fn(...lastArgs);
      lastArgs = undefined;
    }
  };

  const debounced = (...args: Args) => {
    clearTimeout(timeoutID);
    lastArgs = args;
    timeoutID = window.setTimeout(run, delay);
  };

  debounced.flush = () => {
    clearTimeout(timeoutID);
  };

  return debounced;
}

/**
 * Combines multiple CSS class names into a single string.
 * Handles strings, numbers, arrays, and objects.
 * 
 * @param args - Class names to combine
 * @returns Combined class string
 */
export function classNames(...args: any[]): string {
  const hasOwn = {}.hasOwnProperty;
  let classes: string[] = [];

  for (let i = 0; i < arguments.length; i++) {
    let arg = arguments[i];
    if (!arg) continue;

    let argType = typeof arg;

    if (argType === 'string' || argType === 'number') {
      classes.push(arg);
    } else if (Array.isArray(arg)) {
      if (arg.length) {
        let inner = classNames.apply(null, arg);
        if (inner) {
          classes.push(inner);
        }
      }
    } else if (argType === 'object') {
      if (arg.toString !== Object.prototype.toString) {
        classes.push(arg.toString());
      } else {
        for (let key in arg) {
          if (hasOwn.call(arg, key) && arg[key]) {
            classes.push(key);
          }
        }
      }
    }
  }

  return classes.join(' ');
}

/**
 * Retrieves a font preference from localStorage with a fallback default.
 * Safe to use in both browser and server contexts.
 * 
 * @param key - LocalStorage key
 * @param defaultValue - Default value if key doesn't exist
 * @returns Stored value or default
 */
export function getFontPreference(key: string, defaultValue: string): string {
  if (typeof window === 'undefined') {
    return defaultValue;
  }

  try {
    const stored = localStorage.getItem(key);
    return stored !== null ? stored : defaultValue;
  } catch (error) {
    console.warn('Failed to read from localStorage:', error);
    return defaultValue;
  }
}

/**
 * Stores a font preference in localStorage.
 * Safe to use in both browser and server contexts.
 * 
 * @param key - LocalStorage key
 * @param value - Value to store
 * @returns True if successful, false otherwise
 */
export function setFontPreference(key: string, value: string): boolean {
  if (typeof window === 'undefined') {
    return false;
  }

  try {
    localStorage.setItem(key, value);
    return true;
  } catch (error) {
    console.warn('Failed to write to localStorage:', error);
    return false;
  }
}

/**
 * No-op function that returns null.
 * Useful as a placeholder or default callback.
 */
export function noop() {
  return null;
}
