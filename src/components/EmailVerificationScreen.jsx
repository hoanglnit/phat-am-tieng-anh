import React, { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';

export default function EmailVerificationScreen() {
  const { user, logout, resendVerification, refreshUser, loading, error, clearError } = useAuth();
  const [resent, setResent] = useState(false);
  const [checking, setChecking] = useState(false);
  const [countdown, setCountdown] = useState(0);

  // Auto-check every 5s if the user has verified
  useEffect(() => {
    const interval = setInterval(async () => {
      await refreshUser();
    }, 5000);
    return () => clearInterval(interval);
  }, [refreshUser]);

  const handleResend = async () => {
    clearError();
    const result = await resendVerification();
    if (result.success) {
      setResent(true);
      setCountdown(60);
    }
  };

  // Countdown timer after resend
  useEffect(() => {
    if (countdown <= 0) return;
    const t = setTimeout(() => setCountdown(c => c - 1), 1000);
    return () => clearTimeout(t);
  }, [countdown]);

  const handleCheckNow = async () => {
    setChecking(true);
    await refreshUser();
    setTimeout(() => setChecking(false), 1000);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-violet-100 via-pink-50 to-yellow-100 flex items-center justify-center px-4">
      <div className="w-full max-w-sm bg-white rounded-3xl shadow-xl p-8 text-center">
        {/* Icon */}
        <div className="text-7xl mb-4 float-animation inline-block">📧</div>

        <h2 className="text-2xl font-black text-purple-800 mb-2">
          Xác nhận email nhé!
        </h2>

        <p className="text-gray-600 mb-1 text-sm">
          Chúng tôi đã gửi email xác nhận tới:
        </p>
        <p className="font-bold text-purple-700 mb-5 break-all text-sm">
          {user?.email}
        </p>

        <div className="bg-purple-50 rounded-2xl p-4 mb-6 text-left">
          <p className="text-purple-800 text-sm font-semibold mb-2">Hướng dẫn:</p>
          <ol className="text-purple-700 text-sm space-y-1 list-decimal list-inside">
            <li>Mở email của bạn</li>
            <li>Tìm email từ Firebase / noreply</li>
            <li>Nhấn vào link xác nhận</li>
            <li>Quay lại đây và nhấn "Đã xác nhận"</li>
          </ol>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm">
            ❌ {error}
          </div>
        )}

        {resent && (
          <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-xl text-green-700 text-sm">
            ✅ Email đã được gửi lại! Hãy kiểm tra hộp thư.
          </div>
        )}

        <div className="space-y-3">
          {/* Check verification */}
          <button
            onClick={handleCheckNow}
            disabled={checking}
            className="w-full py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white font-bold rounded-2xl hover:from-purple-700 hover:to-pink-700 transition-all shadow-md btn-press disabled:opacity-60 flex items-center justify-center gap-2"
          >
            {checking ? (
              <span className="inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : '✅'}
            <span>{checking ? 'Đang kiểm tra...' : 'Tôi đã xác nhận rồi!'}</span>
          </button>

          {/* Resend */}
          <button
            onClick={handleResend}
            disabled={loading || countdown > 0}
            className="w-full py-3 bg-white border-2 border-purple-300 text-purple-700 font-semibold rounded-2xl hover:bg-purple-50 transition-all btn-press disabled:opacity-50 text-sm"
          >
            {countdown > 0
              ? `Gửi lại sau ${countdown}s`
              : (loading ? 'Đang gửi...' : '📨 Gửi lại email xác nhận')
            }
          </button>

          {/* Logout */}
          <button
            onClick={logout}
            className="w-full py-2.5 text-gray-400 hover:text-gray-600 text-sm font-medium transition-colors"
          >
            Đăng xuất
          </button>
        </div>

        <p className="text-xs text-gray-400 mt-4">
          Tự động kiểm tra mỗi 5 giây...
        </p>
      </div>
    </div>
  );
}
