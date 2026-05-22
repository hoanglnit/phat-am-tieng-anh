import { useState, useEffect, useCallback, useRef } from 'react';
import { doc, onSnapshot, setDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { parseWordList, mergeWords, DEFAULT_WORDS } from '../utils/storage';

export function useWordList(userId) {
  const [words, setWords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState(null);
  const wordsRef = useRef(words);
  wordsRef.current = words;

  useEffect(() => {
    if (!userId) {
      setWords([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    const docRef = doc(db, 'users', userId);
    const unsubscribe = onSnapshot(
      docRef,
      (snap) => {
        if (snap.exists()) {
          setWords(snap.data().words || []);
        } else {
          setWords([]);
        }
        setLoading(false);
      },
      (err) => {
        console.error('Firestore snapshot error:', err);
        setLoading(false);
      }
    );

    return unsubscribe;
  }, [userId]);

  const persistWords = useCallback(async (newWords) => {
    if (!userId) return false;
    setSaving(true);
    setSaveError(null);
    try {
      await setDoc(
        doc(db, 'users', userId),
        { words: newWords, updatedAt: new Date() },
        { merge: true }
      );
      return true;
    } catch (e) {
      console.error('Firestore write error:', e);
      setSaveError('Không lưu được. Kiểm tra kết nối mạng.');
      return false;
    } finally {
      setSaving(false);
    }
  }, [userId]);

  const addWord = useCallback(async (word) => {
    const trimmed = word.trim().toLowerCase();
    if (!trimmed) return { added: false, reason: 'empty' };
    const current = wordsRef.current;
    if (current.some(w => w.toLowerCase() === trimmed)) {
      return { added: false, reason: 'duplicate' };
    }
    const ok = await persistWords([...current, trimmed]);
    return { added: ok };
  }, [persistWords]);

  const removeWord = useCallback(async (word) => {
    const newWords = wordsRef.current.filter(w => w !== word);
    return persistWords(newWords);
  }, [persistWords]);

  const removeWordAt = useCallback(async (index) => {
    const newWords = wordsRef.current.filter((_, i) => i !== index);
    return persistWords(newWords);
  }, [persistWords]);

  const importWords = useCallback(async (text) => {
    const parsed = parseWordList(text);
    if (parsed.length === 0) return { added: 0, total: 0 };
    const merged = mergeWords(wordsRef.current, parsed);
    const added = merged.length - wordsRef.current.length;
    await persistWords(merged);
    return { added, total: parsed.length };
  }, [persistWords]);

  const clearWords = useCallback(async () => {
    return persistWords([]);
  }, [persistWords]);

  const loadDefaultWords = useCallback(async () => {
    const merged = mergeWords(wordsRef.current, DEFAULT_WORDS);
    const added = merged.length - wordsRef.current.length;
    await persistWords(merged);
    return added;
  }, [persistWords]);

  return {
    words,
    loading,
    saving,
    saveError,
    addWord,
    removeWord,
    removeWordAt,
    importWords,
    clearWords,
    loadDefaultWords,
  };
}
