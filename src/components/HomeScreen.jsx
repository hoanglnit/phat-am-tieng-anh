import React, { useState, useEffect } from 'react';

const MASCOTS = ['🦁', '🐯', '🐻', '🦊', '🐸', '🐧', '🦋', '🐬'];

export default function HomeScreen({ words, wordsLoading, user, isGuest, onStart, onManageWords, onLogout, onLoginFromGuest }) {
  const [mascotIndex, setMascotIndex] = useState(0);
  const [isWiggling, setIsWiggling] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

  const count = Array.isArray(words) ? words.length : 0;

  useEffect(() => {
    const interval = setInterval(() => {
      setMascotIndex(prev => (prev + 1) % MASCOTS.length);
      setIsWiggling(true);
      setTimeout(() => setIsWiggling(false), 600);
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  const handleMascotClick = () => {
    setMascotIndex(prev => (prev + 1) % MASCOTS.length);
    setIsWiggling(true);
    setTimeout(() => setIsWiggling(false), 600);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-violet-100 via-pink-50 to-yellow-100 flex flex-col items-center justify-center px-4 py-8">
      <div className="w-full max-w-md">

        {/* ── Guest banner ── */}
        {isGuest && (
          <div className="bg-blue-50 border border-blue-200 rounded-2xl px-4 py-3 mb-4 flex items-center justify-between gap-3">
            <div className="flex items-center gap-2 min-w-0">
              <span className="text-xl shrink-0">🎈</span>
              <div className="min-w-0">
                <p className="text-blue-800 text-xs font-bold">Chế độ khách</p>
                <p className="text-blue-600 text-xs truncate">Từ vựng chỉ lưu trên thiết bị này</p>
              </div>
            </div>
            <button
              onClick={onLoginFromGuest}
              className="shrink-0 text-xs px-3 py-1.5 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 transition-all btn-press"
            >
              Đăng nhập
            </button>
          </div>
        )}

        {/* ── User bar (logged in) ── */}
        {!isGuest && user && (
          <div className="flex items-center justify-between bg-white/70 backdrop-blur-sm rounded-2xl px-4 py-2.5 mb-4 border border-white/80 shadow-sm">
            <div className="flex items-center gap-2 min-w-0">
              <span className="text-lg shrink-0">👤</span>
              <span className="text-xs text-gray-600 font-medium truncate">{user.email}</span>
            </div>
            {showLogoutConfirm ? (
              <div className="flex items-center gap-2 shrink-0 ml-2">
                <span className="text-xs text-gray-500">Đăng xuất?</span>
                <button onClick={onLogout} className="text-xs px-2.5 py-1 bg-red-100 text-red-600 rounded-lg font-bold hover:bg-red-200 transition-all btn-press">Có</button>
                <button onClick={() => setShowLogoutConfirm(false)} className="text-xs px-2.5 py-1 bg-gray-100 text-gray-600 rounded-lg font-semibold hover:bg-gray-200 transition-all btn-press">Không</button>
              </div>
            ) : (
              <button
                onClick={() => setShowLogoutConfirm(true)}
                className="text-xs px-3 py-1.5 bg-gray-100 text-gray-500 rounded-lg font-semibold hover:bg-gray-200 hover:text-gray-700 transition-all btn-press shrink-0 ml-2"
              >
                Đăng xuất
              </button>
            )}
          </div>
        )}

        {/* Logo + Title */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-24 h-24 bg-gradient-to-br from-purple-500 to-pink-500 rounded-3xl shadow-lg shadow-purple-300 mb-4">
            <span className="text-5xl">🎤</span>
          </div>
          <h1 className="text-3xl md:text-4xl font-black text-purple-900 leading-tight mb-2">
            Kiểm Tra{' '}
            <span className="shimmer-text">Phát Âm</span>
          </h1>
          <h2 className="text-xl md:text-2xl font-bold text-pink-600 mb-1">Tiếng Anh</h2>
          <p className="text-gray-600 text-sm">Luyện phát âm cùng bé mỗi ngày! 🌟</p>
        </div>

        {/* Mascot */}
        <div className="text-center mb-6">
          <button onClick={handleMascotClick} className="cursor-pointer focus:outline-none" title="Nhấn để đổi bạn đồng hành!">
            <span className={`text-8xl md:text-9xl inline-block float-animation select-none ${isWiggling ? 'wiggle-animation' : ''}`}>
              {MASCOTS[mascotIndex]}
            </span>
          </button>
          <p className="text-gray-500 text-xs mt-2">Nhấn để đổi bạn đồng hành!</p>
        </div>

        {/* Word count card */}
        <div className="bg-white rounded-2xl shadow-sm border border-purple-100 p-4 mb-6 text-center">
          {wordsLoading ? (
            <div className="flex items-center justify-center gap-2 text-purple-500 py-1">
              <span className="w-4 h-4 border-2 border-purple-400 border-t-transparent rounded-full animate-spin inline-block" />
              <span className="text-sm font-medium">Đang tải danh sách từ...</span>
            </div>
          ) : count > 0 ? (
            <div>
              <div className="flex items-center justify-center gap-3 mb-1">
                <span className="text-3xl font-black text-purple-700">{count}</span>
                <span className="text-gray-600 font-medium">từ trong danh sách</span>
              </div>
              <p className="text-green-600 text-sm font-medium">✅ Sẵn sàng luyện tập!</p>
            </div>
          ) : (
            <div>
              <div className="text-3xl mb-2">📭</div>
              <p className="text-gray-600 font-semibold">Chưa có từ nào!</p>
              <p className="text-gray-500 text-sm mt-1">Vào "Quản lý từ vựng" để thêm từ hoặc dùng từ mẫu có sẵn.</p>
            </div>
          )}
        </div>

        {/* Action buttons */}
        <div className="flex flex-col gap-3">
          <button
            onClick={count > 0 ? onStart : onManageWords}
            disabled={wordsLoading}
            className="w-full py-4 bg-gradient-to-r from-purple-600 to-pink-600 text-white text-xl font-black rounded-2xl shadow-lg shadow-purple-300 hover:from-purple-700 hover:to-pink-700 transition-all btn-press active:scale-95 flex items-center justify-center gap-3 disabled:opacity-60"
          >
            <span>{count > 0 ? '🎯' : '📚'}</span>
            <span>{count > 0 ? 'Bắt đầu luyện tập!' : 'Thêm từ để bắt đầu!'}</span>
          </button>

          <button
            onClick={onManageWords}
            className="w-full py-3.5 bg-white border-2 border-purple-300 text-purple-700 text-lg font-bold rounded-2xl hover:bg-purple-50 hover:border-purple-500 transition-all btn-press flex items-center justify-center gap-2"
          >
            <span>📚</span>
            <span>Quản lý từ vựng</span>
          </button>
        </div>

        {/* Feature highlights */}
        <div className="mt-8 grid grid-cols-3 gap-3">
          {[
            { icon: '🎤', label: 'Nhận dạng giọng nói' },
            { icon: '⭐', label: 'Chấm điểm 1-10' },
            { icon: '🎉', label: 'Phản hồi vui vẻ' },
          ].map((f, i) => (
            <div key={i} className="bg-white/70 rounded-xl p-3 text-center border border-white">
              <div className="text-2xl mb-1">{f.icon}</div>
              <p className="text-xs text-gray-600 font-medium leading-tight">{f.label}</p>
            </div>
          ))}
        </div>

        <p className="text-center text-gray-400 text-xs mt-6">
          Dùng Chrome hoặc Edge để có trải nghiệm tốt nhất 🌐
        </p>
      </div>
    </div>
  );
}
