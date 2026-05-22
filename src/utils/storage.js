const STORAGE_KEY = 'english_pronunciation_words';

export const DEFAULT_WORDS = [
  'apple', 'banana', 'cat', 'dog', 'elephant', 'fish', 'grape', 'hat',
  'ice cream', 'jacket', 'kite', 'lemon', 'monkey', 'nose', 'orange',
  'penguin', 'queen', 'rabbit', 'sun', 'tiger', 'umbrella', 'violin',
  'water', 'yellow', 'zebra', 'book', 'chair', 'door', 'egg', 'flower',
  'green', 'house', 'island', 'jump', 'king', 'love', 'milk', 'night',
  'open', 'park', 'rain', 'snow', 'tree', 'under', 'very', 'wind',
  'box', 'year', 'zoo', 'bird', 'cloud', 'dream', 'earth', 'frog',
];

/**
 * Load words from localStorage
 * @returns {string[]} Array of words
 */
export function loadWords() {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
  } catch (e) {
    console.warn('Failed to load words from localStorage:', e);
  }
  return [];
}

/**
 * Save words to localStorage
 * @param {string[]} words
 */
export function saveWords(words) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(words));
  } catch (e) {
    console.warn('Failed to save words to localStorage:', e);
  }
}

/**
 * Parse a raw text input into an array of words
 * Splits by newlines and/or commas
 * @param {string} text
 * @returns {string[]}
 */
export function parseWordList(text) {
  return text
    .split(/[\n,]+/)
    .map(w => w.trim())
    .filter(w => w.length > 0);
}

/**
 * Merge new words into existing list (deduplicate, case-insensitive)
 * @param {string[]} existing
 * @param {string[]} newWords
 * @returns {string[]}
 */
export function mergeWords(existing, newWords) {
  const existingLower = new Set(existing.map(w => w.toLowerCase()));
  const toAdd = newWords.filter(w => !existingLower.has(w.toLowerCase()));
  return [...existing, ...toAdd];
}

/**
 * Shuffle array using Fisher-Yates algorithm
 * @param {T[]} array
 * @returns {T[]}
 */
export function shuffleArray(array) {
  const arr = [...array];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}
