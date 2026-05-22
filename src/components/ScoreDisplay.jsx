import React, { useState, useEffect, useRef } from 'react';
import { getFeedback, scoreToStars } from '../utils/scoring';

// Confetti colors
const CONFETTI_COLORS = [
  '#f59e0b', '#ef4444', '#10b981', '#3b82f6',
  '#8b5cf6', '#ec4899', '#06b6d4', '#f97316',
];

function ConfettiPiece({ index }) {
  const left = `${Math.random() * 100}%`;
  const delay = `${Math.random() * 1.5}s`;
  const duration = `${2 + Math.random() * 2}s`;
  const color = CONFETTI_COLORS[index % CONFETTI_COLORS.length];

  return (
    <div
      className="confetti-piece"
      style={{
        left,
        backgroundColor: color,
        animationDelay: delay,
        animationDuration: duration,
        top: `${-10 - Math.random() * 20}px`,
      }}
    />
  );
}

function Confetti() {
  const pieces = Array.from({ length: 60 }, (_, i) => i);

  return (
    <div className="confetti-container">
      {pieces.map(i => (
        <ConfettiPiece key={i} index={i} />
      ))}
    </div>
  );
}

function StarRating({ score }) {
  const totalStars = 5;
  const filledStars = scoreToStars(score);

  return (
    <div className="flex gap-1 justify-center" aria-label={`${filledStars} trong 5 sao`}>
      {Array.from({ length: totalStars }, (_, i) => (
        <span
          key={i}
          className="text-3xl md:text-4xl star-animated"
          style={{ animationDelay: `${i * 0.1 + 0.3}s`, opacity: 0 }}
        >
          {i < filledStars ? '⭐' : '☆'}
        </span>
      ))}
    </div>
  );
}

import { syllabifyDisplay, countSyllables } from '../utils/scoring';

export default function ScoreDisplay({ score, recognized, targetWord, confidence, onRetry, onNext }) {
  const feedback = getFeedback(score);
  const [showEmojis, setShowEmojis] = useState(false);
  const [mainEmojiIndex, setMainEmojiIndex] = useState(0);
  const intervalRef = useRef(null);

  const googleSearchUrl = `https://www.google.com/search?q=how+to+pronounce+${encodeURIComponent(targetWord)}+english`;

  useEffect(() => {
    // Trigger emoji animation after mount
    const t = setTimeout(() => setShowEmojis(true), 200);

    // Cycle through emojis
    if (feedback.emojis.length > 1) {
      intervalRef.current = setInterval(() => {
        setMainEmojiIndex(prev => (prev + 1) % feedback.emojis.length);
      }, 1200);
    }

    return () => {
      clearTimeout(t);
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [score]);

  // Score color
  const scoreColor =
    score >= 8 ? 'text-green-600' :
    score >= 5 ? 'text-blue-600' :
    'text-purple-600';

  const scoreBg =
    score >= 8 ? 'from-green-50 to-emerald-50 border-green-200' :
    score >= 5 ? 'from-blue-50 to-sky-50 border-blue-200' :
    'from-purple-50 to-violet-50 border-purple-200';

  return (
    <div className="w-full">
      {/* Confetti for excellent scores */}
      {feedback.showConfetti && <Confetti />}

      <div className={`rounded-2xl border-2 p-5 md:p-6 bg-gradient-to-br ${scoreBg} relative overflow-hidden`}>

        {/* Main emoji reaction */}
        <div className="text-center mb-4">
          {showEmojis && (
            <span
              className="text-6xl md:text-7xl inline-block emoji-bounce select-none"
              key={mainEmojiIndex}
            >
              {feedback.emojis[mainEmojiIndex]}
            </span>
          )}
        </div>

        {/* Score number */}
        <div className="text-center mb-4">
          <div className={`text-7xl md:text-8xl font-black score-reveal inline-block ${scoreColor}`}>
            {score}
            <span className="text-3xl md:text-4xl text-gray-400 font-normal">/10</span>
          </div>
        </div>

        {/* Stars */}
        <div className="mb-4">
          <StarRating score={score} />
        </div>

        {/* Feedback message */}
        <div className="text-center mb-4">
          <p className={`text-xl md:text-2xl font-bold ${scoreColor} mb-1`}>
            {feedback.message}
          </p>
          <p className="text-gray-600 text-sm md:text-base">
            {feedback.subMessage}
          </p>
        </div>

        {/* What was recognized */}
        {recognized && recognized.trim() !== '' && (
          <div className="bg-white rounded-xl p-3 mb-4 border border-gray-200 text-center">
            <p className="text-xs text-gray-500 mb-1">Bạn đọc:</p>
            <p className="text-lg font-semibold text-gray-800 italic">"{recognized}"</p>
          </div>
        )}

        {/* Target word + syllable breakdown */}
        <div className="bg-white rounded-xl p-3 mb-4 border border-gray-100 text-center">
          <p className="text-xs text-gray-500 mb-1">Từ cần phát âm:</p>
          <p className="text-2xl font-bold text-purple-700 mb-1">{targetWord}</p>
          {(() => {
            const syl = syllabifyDisplay(targetWord);
            const count = countSyllables(targetWord);
            return syl !== targetWord && count > 1 ? (
              <p className="text-sm text-gray-400 font-mono tracking-widest">{syl} · {count} âm tiết</p>
            ) : null;
          })()}
        </div>

        {/* Confidence bar */}
        {typeof confidence === 'number' && confidence > 0 && (
          <div className="bg-white rounded-xl p-3 mb-4 border border-gray-100">
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs text-gray-500 font-medium">Độ rõ ràng giọng đọc</span>
              <span className="text-xs font-bold text-gray-600">{Math.round(confidence * 100)}%</span>
            </div>
            <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all ${
                  confidence >= 0.7 ? 'bg-green-400' :
                  confidence >= 0.4 ? 'bg-yellow-400' : 'bg-red-400'
                }`}
                style={{ width: `${Math.round(confidence * 100)}%` }}
              />
            </div>
            {confidence < 0.5 && (
              <p className="text-xs text-orange-600 mt-1 font-medium">
                💡 Hãy đọc to hơn và chú ý nhấn đúng trọng âm!
              </p>
            )}
          </div>
        )}

        {/* Google search link */}
        <div className="text-center mb-5">
          <a
            href={googleSearchUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-800 underline text-sm font-medium transition-colors"
          >
            <span>🔍</span>
            <span>Xem cách phát âm trên Google</span>
            <span className="text-xs">↗</span>
          </a>
        </div>

        {/* Action buttons */}
        <div className="flex gap-3 justify-center">
          <button
            onClick={onRetry}
            className="flex items-center gap-2 px-5 py-3 bg-white border-2 border-purple-300 text-purple-700 rounded-xl font-semibold hover:bg-purple-50 transition-all btn-press text-sm md:text-base"
          >
            <span>🔄</span>
            <span>Thử lại</span>
          </button>
          {onNext && (
            <button
              onClick={onNext}
              className="flex items-center gap-2 px-5 py-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-xl font-semibold hover:from-purple-600 hover:to-pink-600 transition-all shadow-md btn-press text-sm md:text-base"
            >
              <span>Tiếp theo</span>
              <span>▶</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
