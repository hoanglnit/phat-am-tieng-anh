import React from 'react';

export default function MicButton({ isRecording, onClick, disabled }) {
  return (
    <div className="flex flex-col items-center gap-3">
      <button
        onClick={onClick}
        disabled={disabled}
        className={`
          relative flex items-center justify-center
          w-32 h-32 md:w-36 md:h-36
          rounded-full border-4
          text-white font-bold
          transition-all duration-200
          btn-press
          focus:outline-none focus:ring-4 focus:ring-purple-300
          ${isRecording
            ? 'bg-red-500 border-red-300 mic-recording scale-110 shadow-lg shadow-red-300'
            : disabled
              ? 'bg-gray-300 border-gray-200 cursor-not-allowed opacity-60'
              : 'bg-gradient-to-br from-purple-500 to-pink-500 border-purple-300 hover:from-purple-600 hover:to-pink-600 hover:scale-105 shadow-lg shadow-purple-300 cursor-pointer'
          }
        `}
        aria-label={isRecording ? 'Dừng ghi âm' : 'Bắt đầu ghi âm'}
      >
        {/* Ripple rings when recording */}
        {isRecording && (
          <>
            <span className="absolute inset-0 rounded-full bg-red-400 opacity-40 animate-ping" />
            <span className="absolute inset-0 rounded-full bg-red-300 opacity-20 animate-ping" style={{ animationDelay: '0.3s' }} />
          </>
        )}

        {/* Mic icon */}
        <span className={`text-5xl md:text-6xl relative z-10 select-none ${isRecording ? 'animate-bounce' : ''}`}>
          {isRecording ? '🔴' : '🎤'}
        </span>
      </button>

      {/* Label */}
      <div className="text-center">
        {isRecording ? (
          <div className="flex items-center gap-2">
            <span className="inline-block w-2.5 h-2.5 bg-red-500 rounded-full animate-pulse" />
            <span className="text-red-600 font-bold text-base md:text-lg">
              Đang nghe... nói to nhé!
            </span>
          </div>
        ) : (
          <p className="text-gray-600 font-medium text-sm md:text-base">
            {disabled ? 'Không hỗ trợ' : 'Nhấn để nói'}
          </p>
        )}
      </div>
    </div>
  );
}
