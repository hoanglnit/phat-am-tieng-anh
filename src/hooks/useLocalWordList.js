import { useState, useCallback, useEffect, useRef } from 'react';
import { loadWords, saveWords, parseWordList, mergeWords, DEFAULT_WORDS } from '../utils/storage';

// Same interface as useWordList but persists to localStorage instead of Firestore
export function useLocalWordList(active) {
  const [words, setWords] = useState(() => (active ? loadWords() : []));
  const wordsRef = useRef(words);
  wordsRef.current = words;

  useEffect(() => {
    if (active) setWords(loadWords());
  }, [active]);

  useEffect(() => {
    if (active) saveWords(words);
  }, [words, active]);

  const addWord = useCallback(async (word) => {
    const trimmed = word.trim().toLowerCase();
    if (!trimmed) return { added: false, reason: 'empty' };
    if (wordsRef.current.some(w => w.toLowerCase() === trimmed)) {
      return { added: false, reason: 'duplicate' };
    }
    setWords(prev => [...prev, trimmed]);
    return { added: true };
  }, []);

  const removeWord = useCallback(async (word) => {
    setWords(prev => prev.filter(w => w !== word));
    return true;
  }, []);

  const removeWordAt = useCallback(async (index) => {
    setWords(prev => prev.filter((_, i) => i !== index));
    return true;
  }, []);

  const importWords = useCallback(async (text) => {
    const parsed = parseWordList(text);
    if (parsed.length === 0) return { added: 0, total: 0 };
    const merged = mergeWords(wordsRef.current, parsed);
    const added = merged.length - wordsRef.current.length;
    setWords(merged);
    return { added, total: parsed.length };
  }, []);

  const clearWords = useCallback(async () => {
    setWords([]);
    return true;
  }, []);

  const loadDefaultWords = useCallback(async () => {
    const merged = mergeWords(wordsRef.current, DEFAULT_WORDS);
    const added = merged.length - wordsRef.current.length;
    setWords(merged);
    return added;
  }, []);

  return {
    words: active ? words : [],
    loading: false,
    saving: false,
    saveError: null,
    addWord,
    removeWord,
    removeWordAt,
    importWords,
    clearWords,
    loadDefaultWords,
  };
}
