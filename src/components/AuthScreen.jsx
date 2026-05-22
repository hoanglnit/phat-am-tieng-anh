import React, { useState, useCallback } from 'react';
import { useAuth } from '../hooks/useAuth';

function Spinner() {
  return (
    <span className="inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
  );
}

export default function AuthScreen({ onGuestMode }) {
  const [mode, setMode] = useState('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [localError, setLocalError] = useState(null);

  const [showForgot, setShowForgot] = useState(false);
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotSent, setForgotSent] = useState(false);

  const { login, register, resetPassword, loading, error, clearError } = useAuth();

  const handleModeSwitch = (newMode) => {
    setMode(newMode);
    setLocalError(null);
    clearError();
    setPassword('');
    setConfirmPassword('');
    setShowForgot(false);
    setRegistered(false);
  };

  const handleSubmit = useCallback(async (e) => {
    e.preventDefault();
    setLocalError(null);
    clearError();
    if (mode === 'register') {
      if (password.length < 6) {
        setLocalError('Mật khẩu phải có ít nhất 6 ký tự.');
        return;
      }
      if (password !== confirmPassword) {
        setLocalError('Mật khẩu xác nhận không khớp. Hãy kiểm tra lại.');
        return;
      }
      // register() also signs in automatically via Firebase
      await register(email, password);
    } else {
      await login(email, password);
    }
  }, [mode, email, password, confirmPassword, login, register, clearError]);

  const handleForgot = useCallback(async (e) => {
    e.preventDefault();
    if (!forgotEmail.trim()) { setLocalError('Vui lòng nhập email.'); return; }
    clearError();
    setLocalError(null);
    const result = await resetPassword(forgotEmail.trim());
    if (result.success) setForgotSent(true);
  }, [forgotEmail, resetPassword, clearError]);

  const displayError = localError || error;


  // ── Forgot password ───────────────────────────────────────
  if (showForgot) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-violet-100 via-pink-50 to-yellow-100 flex items-center justify-center px-4">
        <div className="w-full max-w-sm bg-white rounded-3xl shadow-xl p-8">
          <button
            onClick={() => { setShowForgot(false); setForgotSent(false); setLocalError(null); clearError(); }}
            className="flex items-center gap-1 text-purple-600 hover:text-purple-800 font-semibold mb-6 btn-press"
          >
            ← Quay lại
          </button>
          {forgotSent ? (
            <div className="text-center">
              <div className="text-6xl mb-4">✅</div>
              <h2 className="text-2xl font-black text-purple-800 mb-2">Email đã được gửi!</h2>
              <p className="text-gray-600 mb-6">Kiểm tra hộp thư và làm theo hướng dẫn để đặt lại mật khẩu.</p>
              <button
                onClick={() => { setShowForgot(false); setForgotSent(false); }}
                className="w-full py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white font-bold rounded-2xl btn-press"
              >
                Về trang đăng nhập
              </button>
            </div>
          ) : (
            <>
              <div className="text-5xl text-center mb-4">🔑</div>
              <h2 className="text-2xl font-black text-purple-800 mb-1 text-center">Quên mật khẩu?</h2>
              <p className="text-gray-500 text-sm mb-6 text-center">Nhập email để nhận link đặt lại mật khẩu.</p>
              {displayError && (
                <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm text-center">
                  ❌ {displayError}
                </div>
              )}
              <form onSubmit={handleForgot} className="space-y-4">
                <input
                  type="email"
                  value={forgotEmail}
                  onChange={e => setForgotEmail(e.target.value)}
                  placeholder="Email của bạn..."
                  className="w-full px-4 py-3 border-2 border-purple-200 rounded-xl focus:outline-none focus:border-purple-500 transition-colors"
                  required
                  autoFocus
                />
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white font-bold rounded-2xl hover:from-purple-700 hover:to-pink-700 transition-all shadow-lg btn-press disabled:opacity-60 flex items-center justify-center gap-2"
                >
                  {loading ? <Spinner /> : '📨'}
                  <span>{loading ? 'Đang gửi...' : 'Gửi email đặt lại'}</span>
                </button>
              </form>
            </>
          )}
        </div>
      </div>
    );
  }

  // ── Main Auth Screen ──────────────────────────────────────
  return (
    <div className="min-h-screen bg-gradient-to-br from-violet-100 via-pink-50 to-yellow-100 flex flex-col items-center justify-center px-4 py-8">
      <div className="w-full max-w-sm">

        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-purple-500 to-pink-500 rounded-3xl shadow-lg shadow-purple-300 mb-4">
            <span className="text-4xl">🎤</span>
          </div>
          <h1 className="text-2xl font-black text-purple-900 mb-1">
            Kiểm Tra <span className="shimmer-text">Phát Âm</span>
          </h1>
          <p className="text-gray-500 text-sm">Tiếng Anh cho bé</p>
        </div>

        {/* Auth card */}
        <div className="bg-white rounded-3xl shadow-xl overflow-hidden">
          {/* Tab switch */}
          <div className="flex border-b border-gray-100">
            <button
              onClick={() => handleModeSwitch('login')}
              className={`flex-1 py-4 font-bold text-sm transition-all ${
                mode === 'login'
                  ? 'text-purple-700 border-b-2 border-purple-600 bg-purple-50'
                  : 'text-gray-400 hover:text-gray-600'
              }`}
            >
              🔑 Đăng nhập
            </button>
            <button
              onClick={() => handleModeSwitch('register')}
              className={`flex-1 py-4 font-bold text-sm transition-all ${
                mode === 'register'
                  ? 'text-purple-700 border-b-2 border-purple-600 bg-purple-50'
                  : 'text-gray-400 hover:text-gray-600'
              }`}
            >
              ✨ Tạo tài khoản
            </button>
          </div>

          <div className="p-6">
            {displayError && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm text-center">
                ❌ {displayError}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1.5">Email</label>
                <input
                  type="email"
                  value={email}
                  onChange={e => { setEmail(e.target.value); setLocalError(null); clearError(); }}
                  placeholder="email@example.com"
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-purple-500 transition-colors text-sm"
                  required
                  autoComplete="email"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1.5">Mật khẩu</label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={e => { setPassword(e.target.value); setLocalError(null); clearError(); }}
                    placeholder={mode === 'register' ? 'Ít nhất 6 ký tự...' : 'Nhập mật khẩu...'}
                    className="w-full px-4 py-3 pr-12 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-purple-500 transition-colors text-sm"
                    required
                    autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(p => !p)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 text-lg"
                  >
                    {showPassword ? '🙈' : '👁️'}
                  </button>
                </div>
              </div>

              {mode === 'register' && (
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1.5">Xác nhận mật khẩu</label>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={confirmPassword}
                    onChange={e => { setConfirmPassword(e.target.value); setLocalError(null); }}
                    placeholder="Nhập lại mật khẩu..."
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-purple-500 transition-colors text-sm"
                    required
                    autoComplete="new-password"
                  />
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3.5 bg-gradient-to-r from-purple-600 to-pink-600 text-white font-black rounded-2xl hover:from-purple-700 hover:to-pink-700 transition-all shadow-lg shadow-purple-200 btn-press disabled:opacity-60 flex items-center justify-center gap-2 text-base"
              >
                {loading ? <Spinner /> : (mode === 'login' ? '🚀' : '🌟')}
                <span>
                  {loading
                    ? (mode === 'login' ? 'Đang đăng nhập...' : 'Đang tạo tài khoản...')
                    : (mode === 'login' ? 'Đăng nhập' : 'Tạo tài khoản')
                  }
                </span>
              </button>
            </form>

            {mode === 'login' && (
              <div className="text-center mt-4">
                <button
                  onClick={() => { setShowForgot(true); setForgotEmail(email); setLocalError(null); clearError(); }}
                  className="text-purple-600 hover:text-purple-800 text-sm font-medium underline underline-offset-2"
                >
                  Quên mật khẩu?
                </button>
              </div>
            )}
          </div>
        </div>

        {/* ── Guest mode separator ── */}
        <div className="flex items-center gap-3 my-5">
          <div className="flex-1 h-px bg-gray-300" />
          <span className="text-gray-400 text-xs font-medium">HOẶC</span>
          <div className="flex-1 h-px bg-gray-300" />
        </div>

        {/* Guest mode button */}
        <button
          onClick={onGuestMode}
          className="w-full py-3.5 bg-white border-2 border-gray-200 text-gray-600 font-bold rounded-2xl hover:border-purple-300 hover:text-purple-600 hover:bg-purple-50 transition-all btn-press flex items-center justify-center gap-2 text-sm shadow-sm"
        >
          <span>🎈</span>
          <span>Dùng thử không cần đăng nhập</span>
        </button>

        <p className="text-center text-gray-400 text-xs mt-4">
          Chế độ khách: từ vựng lưu trên thiết bị, không đồng bộ
        </p>

        <p className="text-center text-gray-400 text-xs mt-2">
          Dùng Chrome hoặc Edge để có trải nghiệm tốt nhất 🌐
        </p>
      </div>
    </div>
  );
}
