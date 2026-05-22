/**
 * Levenshtein distance between two strings
 */
export function levenshteinDistance(a, b) {
  const m = a.length, n = b.length;
  const dp = Array.from({ length: m + 1 }, (_, i) =>
    Array.from({ length: n + 1 }, (_, j) => (i === 0 ? j : j === 0 ? i : 0))
  );
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      dp[i][j] = a[i - 1] === b[j - 1]
        ? dp[i - 1][j - 1]
        : 1 + Math.min(dp[i - 1][j], dp[i][j - 1], dp[i - 1][j - 1]);
    }
  }
  return dp[m][n];
}

/**
 * Count approximate syllables in an English word.
 * Used to detect syllable-count mismatch (stress indicator).
 */
export function countSyllables(word) {
  const w = word.toLowerCase().replace(/[^a-z]/g, '');
  if (!w) return 0;
  if (w.length <= 3) return 1;
  // Remove silent trailing 'e'
  const cleaned = w.replace(/e$/, '');
  const groups = cleaned.match(/[aeiouy]+/g);
  return Math.max(1, groups ? groups.length : 1);
}

/**
 * Split word into syllables for display (dot-separated).
 * e.g. "elephant" → "el·e·phant"
 */
export function syllabifyDisplay(word) {
  const w = word.toLowerCase().replace(/[^a-z]/g, '');
  if (!w || w.length <= 3) return word;

  const vowels = new Set('aeiouy');
  const parts = [];
  let start = 0;
  let lastVowelGroupEnd = -1;
  let inVowel = false;

  for (let i = 0; i < w.length; i++) {
    const isV = vowels.has(w[i]);
    if (isV) {
      if (!inVowel) {
        // Start of a new vowel group — find split point in preceding consonants
        if (lastVowelGroupEnd >= 0 && i - lastVowelGroupEnd > 1) {
          const consLen = i - lastVowelGroupEnd;
          // Keep at least 1 consonant at end of previous syllable, rest go to next
          const splitAt = lastVowelGroupEnd + Math.max(1, Math.floor(consLen / 2));
          parts.push(w.slice(start, splitAt));
          start = splitAt;
        }
        inVowel = true;
      }
    } else {
      if (inVowel) {
        lastVowelGroupEnd = i;
        inVowel = false;
      }
    }
  }
  if (start < w.length) parts.push(w.slice(start));

  return (parts.length > 1 ? parts.join('·') : word);
}

/**
 * Calculate pronunciation score 1–10.
 *
 * Scoring factors:
 *  1. Text similarity   — Levenshtein, quadratic penalty curve (strict)
 *  2. Syllable match    — mismatch in syllable count penalises stress errors
 *  3. API confidence    — low confidence → unclear/wrong stress even if text matches
 *
 * @param {string} target      Target word
 * @param {string} recognized  What the Speech API heard
 * @param {number} confidence  0–1 from SpeechRecognition API (default 0)
 */
export function calculateScore(target, recognized, confidence = 0) {
  if (!recognized?.trim()) return 1;

  const t = target.toLowerCase().trim();
  const r = recognized.toLowerCase().trim();
  const words = r.split(/\s+/);

  // ── 1. Text similarity ───────────────────────────────────
  const exactMatch = t === r || words.some(w => w === t);

  let textSim;
  if (exactMatch) {
    textSim = 1.0;
  } else {
    // Best single-word match
    let best = 0;
    for (const w of words) {
      const maxLen = Math.max(t.length, w.length);
      if (!maxLen) continue;
      const sim = 1 - levenshteinDistance(t, w) / maxLen;
      if (sim > best) best = sim;
    }
    // Full-text match as fallback
    const fullMax = Math.max(t.length, r.length);
    const fullSim = fullMax ? 1 - levenshteinDistance(t, r) / fullMax : 0;
    textSim = Math.max(best, fullSim);
  }

  // ── 2. Syllable mismatch penalty (stress indicator) ──────
  let sylPenalty = 0;
  const tSyl = countSyllables(t);
  if (tSyl > 1) {
    // Find the recognised word closest to target
    const closest = words.reduce((b, w) =>
      levenshteinDistance(t, w) < levenshteinDistance(t, b) ? w : b
    , r);
    const rSyl = countSyllables(closest);
    const diff = Math.abs(tSyl - rSyl);
    // Each missing/extra syllable costs ~0.20 of the score
    sylPenalty = Math.min(0.40, diff * 0.20);
  }

  // ── 3. Confidence factor ─────────────────────────────────
  // conf = 0  →  factor 0.50  (maximum 50% of text score)
  // conf = 1  →  factor 1.00  (full score)
  // This heavily penalises mumbled / wrong-stress speech
  // that the API still guesses correctly but with low certainty.
  const conf = Math.max(0, Math.min(1, confidence));
  const confFactor = 0.50 + conf * 0.50;

  // ── 4. Final score (quadratic curve = strict) ────────────
  // Old formula:  textSim * 9 + 1           (lenient)
  // New formula:  textSim^1.9 × sylFactor × confFactor × 9 + 1  (strict)
  const baseSim = Math.pow(textSim, 1.9) * (1 - sylPenalty) * confFactor;
  const score = Math.round(baseSim * 9) + 1;
  return Math.max(1, Math.min(10, score));
}

/**
 * Feedback based on score (updated thresholds for stricter scoring).
 */
export function getFeedback(score) {
  if (score >= 9) {
    return {
      level: 'perfect',
      emojis: ['🏆', '🌟', '⭐', '✨', '🎖️'],
      message: 'Hoàn hảo! Phát âm chuẩn 100%!',
      subMessage: 'Trọng âm và phát âm đều xuất sắc!',
      color: 'green',
      showConfetti: true,
    };
  }
  if (score >= 7) {
    return {
      level: 'excellent',
      emojis: ['🎉', '🥳', '🌟', '👏', '🎊'],
      message: 'Rất giỏi! Gần hoàn hảo rồi!',
      subMessage: 'Chú ý nhấn đúng âm tiết để đạt điểm tuyệt đối!',
      color: 'green',
      showConfetti: true,
    };
  }
  if (score >= 5) {
    return {
      level: 'good',
      emojis: ['👍', '💪', '😊', '⭐', '🌈'],
      message: 'Khá tốt! Còn cải thiện được!',
      subMessage: 'Hãy chú ý trọng âm — nhấn mạnh đúng âm tiết in hoa nhé!',
      color: 'blue',
      showConfetti: false,
    };
  }
  if (score >= 3) {
    return {
      level: 'try-more',
      emojis: ['💪', '🌈', '😤', '🔥'],
      message: 'Cố gắng thêm chút nữa!',
      subMessage: 'Nhấn 🔊 nghe mẫu, chú ý âm tiết được nhấn mạnh rồi đọc lại!',
      color: 'orange',
      showConfetti: false,
    };
  }
  return {
    level: 'keep-trying',
    emojis: ['🌈', '💪', '😊', '🌸', '💫'],
    message: 'Không sao! Thử lại nào!',
    subMessage: 'Nghe 🔊 và bắt chước thật kỹ cách phát âm nhé!',
    color: 'purple',
    showConfetti: false,
  };
}

/**
 * Convert score to filled stars out of 5.
 */
export function scoreToStars(score) {
  if (score >= 9) return 5;
  if (score >= 7) return 4;
  if (score >= 5) return 3;
  if (score >= 3) return 2;
  return 1;
}
