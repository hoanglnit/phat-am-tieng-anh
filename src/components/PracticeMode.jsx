import React, { useState, useCallback, useEffect } from 'react';
import MicButton from './MicButton';
import ScoreDisplay from './ScoreDisplay';
import { useSpeechRecognition } from '../hooks/useSpeechRecognition';
import { calculateScore, syllabifyDisplay, countSyllables } from '../utils/scoring';
import { shuffleArray } from '../utils/storage';

const WORD_COLORS = [
  'text-purple-700', 'text-pink-600', 'text-blue-700',
  'text-green-700', 'text-orange-600', 'text-teal-700',
  'text-rose-600', 'text-indigo-700', 'text-violet-700',
  'text-fuchsia-700',
];

function speak(text) {
  if (!window.speechSynthesis) return;
  window.speechSynthesis.cancel();
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = 'en-US';
  utterance.rate = 0.85;
  utterance.pitch = 1.0;
  utterance.volume = 1.0;

  // Try to find an English voice
  const voices = window.speechSynthesis.getVoices();
  const engVoice = voices.find(v => v.lang === 'en-US') ||
                   voices.find(v => v.lang.startsWith('en'));
  if (engVoice) utterance.voice = engVoice;

  window.speechSynthesis.speak(utterance);
}

export default function PracticeMode({ words, onBack, shuffled: initialShuffled }) {
  const [wordList, setWordList] = useState(() =>
    initialShuffled ? shuffleArray(words) : [...words]
  );
  const [currentIndex, setCurrentIndex] = useState(0);
  const [scoreData, setScoreData] = useState(null); // { score, recognized }
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isShuffled, setIsShuffled] = useState(initialShuffled || false);
  const [speakReady, setSpeakReady] = useState(false);

  const {
    isRecording,
    isSupported,
    startRecording,
    stopRecording,
    error,
    clearError,
  } = useSpeechRecognition();

  const currentWord = wordList[currentIndex];
  const totalWords = wordList.length;

  // Preload TTS voices
  useEffect(() => {
    const loadVoices = () => setSpeakReady(true);
    if (window.speechSynthesis) {
      if (window.speechSynthesis.getVoices().length > 0) {
        setSpeakReady(true);
      } else {
        window.speechSynthesis.addEventListener('voiceschanged', loadVoices);
      }
    }
    return () => {
      window.speechSynthesis?.removeEventListener('voiceschanged', loadVoices);
      window.speechSynthesis?.cancel();
    };
  }, []);

  // Reset score when word changes
  useEffect(() => {
    setScoreData(null);
    clearError();
  }, [currentIndex, currentWord]);

  const handleSpeak = useCallback(() => {
    if (!currentWord) return;
    setIsSpeaking(true);
    speak(currentWord);
    setTimeout(() => setIsSpeaking(false), 2000);
  }, [currentWord]);

  const handleMicClick = useCallback(() => {
    if (isRecording) {
      stopRecording();
      return;
    }
    setScoreData(null);
    clearError();
    startRecording((transcript, confidence) => {
      const score = calculateScore(currentWord, transcript, confidence);
      setScoreData({ score, recognized: transcript, confidence });
    });
  }, [isRecording, currentWord, startRecording, stopRecording, clearError]);

  const handleNext = useCallback(() => {
    if (currentIndex < totalWords - 1) {
      setCurrentIndex(prev => prev + 1);
    } else {
      // Loop back to start
      setCurrentIndex(0);
    }
  }, [currentIndex, totalWords]);

  const handlePrev = useCallback(() => {
    if (currentIndex > 0) {
      setCurrentIndex(prev => prev - 1);
    }
  }, [currentIndex]);

  const handleRetry = useCallback(() => {
    setScoreData(null);
    clearError();
  }, [clearError]);

  const handleShuffle = useCallback(() => {
    const shuffled = shuffleArray(words);
    setWordList(shuffled);
    setCurrentIndex(0);
    setScoreData(null);
    setIsShuffled(true);
  }, [words]);

  const handleOrder = useCallback(() => {
    setWordList([...words]);
    setCurrentIndex(0);
    setScoreData(null);
    setIsShuffled(false);
  }, [words]);

  const progressPercent = totalWords > 0 ? ((currentIndex + 1) / totalWords) * 100 : 0;
  const wordColorClass = WORD_COLORS[currentIndex % WORD_COLORS.length];

  return (
    <div className="min-h-screen bg-gradient-to-br from-violet-100 via-pink-50 to-yellow-100 flex flex-col">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-white/80 backdrop-blur-sm border-b border-purple-100 px-4 py-3">
        <div className="max-w-2xl mx-auto flex items-center justify-between gap-4">
          {/* Back button */}
          <button
            onClick={onBack}
            className="flex items-center gap-1 text-purple-600 hover:text-purple-800 font-semibold btn-press shrink-0"
          >
            <span>←</span>
            <span className="hidden sm:inline">Quay lại</span>
          </button>

          {/* Progress */}
          <div className="flex-1 max-w-xs">
            <div className="flex justify-between text-xs text-gray-500 mb-1">
              <span>Từ {currentIndex + 1}/{totalWords}</span>
              <span>{Math.round(progressPercent)}%</span>
            </div>
            <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-purple-500 to-pink-500 rounded-full progress-bar-fill"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          </div>

          {/* Shuffle toggle */}
          <button
            onClick={isShuffled ? handleOrder : handleShuffle}
            className={`text-xs px-2 py-1 rounded-lg font-medium transition-all btn-press shrink-0 ${
              isShuffled
                ? 'bg-purple-100 text-purple-700'
                : 'bg-gray-100 text-gray-600 hover:bg-purple-50'
            }`}
            title={isShuffled ? 'Theo thứ tự' : 'Trộn ngẫu nhiên'}
          >
            {isShuffled ? '🔀 Ngẫu nhiên' : '📋 Theo thứ tự'}
          </button>
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 flex flex-col items-center justify-start px-4 py-6 max-w-2xl mx-auto w-full">

        {/* Word card */}
        <div className="w-full mb-6">
          <div className="bg-white rounded-3xl shadow-lg border-2 border-purple-100 p-6 md:p-8 text-center relative overflow-hidden">
            {/* Decorative circles */}
            <div className="absolute -top-8 -right-8 w-24 h-24 bg-pink-100 rounded-full opacity-50" />
            <div className="absolute -bottom-6 -left-6 w-20 h-20 bg-violet-100 rounded-full opacity-50" />

            {/* Word display */}
            <div className="relative z-10">
              <p className="text-sm text-gray-500 mb-2 font-medium">Hãy đọc từ này:</p>
              <div
                className={`text-6xl sm:text-7xl md:text-8xl font-black mb-2 leading-tight ${wordColorClass} capitalize tracking-wide`}
              >
                {currentWord}
              </div>

              {/* Syllable breakdown + stress hint */}
              {(() => {
                const sylDisplay = syllabifyDisplay(currentWord);
                const sylCount = countSyllables(currentWord);
                const showBreak = sylDisplay !== currentWord && sylCount > 1;
                return showBreak ? (
                  <div className="mb-4 flex items-center justify-center gap-2 flex-wrap">
                    <span className="text-base text-gray-400 font-mono tracking-widest">
                      {sylDisplay}
                    </span>
                    <span className="text-xs bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full font-semibold">
                      {sylCount} âm tiết
                    </span>
                  </div>
                ) : <div className="mb-4" />;
              })()}

              {/* Speak button */}
              <button
                onClick={handleSpeak}
                disabled={isSpeaking || !currentWord}
                className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all btn-press
                  ${isSpeaking
                    ? 'bg-blue-100 text-blue-500 cursor-wait'
                    : 'bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 hover:border-blue-300'
                  }`}
              >
                <span className={`text-lg ${isSpeaking ? 'animate-bounce' : ''}`}>🔊</span>
                <span>{isSpeaking ? 'Đang phát...' : 'Nghe phát âm mẫu'}</span>
              </button>
            </div>
          </div>
        </div>

        {/* Not supported notice */}
        {!isSupported && (
          <div className="w-full mb-4 p-4 bg-yellow-50 border border-yellow-200 rounded-xl text-center">
            <p className="text-yellow-800 font-semibold">⚠️ Trình duyệt chưa hỗ trợ nhận dạng giọng nói</p>
            <p className="text-yellow-700 text-sm mt-1">Vui lòng dùng Chrome hoặc Microsoft Edge để sử dụng tính năng này.</p>
          </div>
        )}

        {/* Error notice */}
        {error && (
          <div className="w-full mb-4 p-4 bg-red-50 border border-red-200 rounded-xl text-center">
            <p className="text-red-700 font-medium">😅 {error}</p>
            <button onClick={clearError} className="text-red-500 text-sm underline mt-1">Đóng</button>
          </div>
        )}

        {/* Score display OR mic button */}
        {scoreData ? (
          <div className="w-full">
            <ScoreDisplay
              score={scoreData.score}
              recognized={scoreData.recognized}
              confidence={scoreData.confidence}
              targetWord={currentWord}
              onRetry={handleRetry}
              onNext={currentIndex < totalWords - 1 ? handleNext : null}
            />
          </div>
        ) : (
          <div className="flex flex-col items-center gap-4 w-full">
            {/* Mic button */}
            <MicButton
              isRecording={isRecording}
              onClick={handleMicClick}
              disabled={!isSupported}
            />

            {/* Hint */}
            {!isRecording && !error && (
              <p className="text-gray-500 text-sm text-center max-w-xs">
                Nhấn nút microphone, sau đó đọc từ <strong className="text-purple-600">{currentWord}</strong> thật to!
              </p>
            )}
          </div>
        )}

        {/* Navigation buttons */}
        <div className="flex gap-4 mt-6 w-full justify-between max-w-xs">
          <button
            onClick={handlePrev}
            disabled={currentIndex === 0}
            className="flex items-center gap-2 px-4 py-2.5 bg-white border-2 border-gray-200 text-gray-600 rounded-xl font-semibold hover:border-purple-300 hover:text-purple-600 transition-all btn-press disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <span>◀</span>
            <span>Trước</span>
          </button>

          <button
            onClick={handleNext}
            className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-xl font-semibold hover:from-purple-600 hover:to-pink-600 transition-all shadow-md btn-press"
          >
            <span>{currentIndex < totalWords - 1 ? 'Tiếp theo' : 'Bắt đầu lại'}</span>
            <span>▶</span>
          </button>
        </div>

        {/* Word list mini indicator */}
        <div className="mt-6 flex flex-wrap gap-1.5 justify-center max-w-sm">
          {wordList.map((_, i) => (
            <button
              key={i}
              onClick={() => { setCurrentIndex(i); setScoreData(null); clearError(); }}
              className={`w-2.5 h-2.5 rounded-full transition-all ${
                i === currentIndex
                  ? 'bg-purple-600 scale-125'
                  : 'bg-purple-200 hover:bg-purple-400'
              }`}
              title={wordList[i]}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
