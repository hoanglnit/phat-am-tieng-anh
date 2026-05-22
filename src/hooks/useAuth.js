import { useState, useEffect, useCallback } from 'react';
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  sendPasswordResetEmail,
  signOut,
  onAuthStateChanged,
  reload,
} from 'firebase/auth';
import { auth } from '../firebase';

const AUTH_ERRORS = {
  'auth/email-already-in-use': 'Email này đã được sử dụng. Hãy đăng nhập hoặc dùng email khác.',
  'auth/invalid-email': 'Email không hợp lệ.',
  'auth/weak-password': 'Mật khẩu quá yếu. Hãy dùng ít nhất 6 ký tự.',
  'auth/user-not-found': 'Email chưa được đăng ký. Hãy tạo tài khoản mới.',
  'auth/wrong-password': 'Mật khẩu không đúng. Hãy thử lại.',
  'auth/too-many-requests': 'Quá nhiều lần thử. Vui lòng đợi vài phút rồi thử lại.',
  'auth/invalid-credential': 'Email hoặc mật khẩu không đúng.',
  'auth/network-request-failed': 'Lỗi kết nối mạng. Vui lòng kiểm tra internet.',
  'auth/user-disabled': 'Tài khoản này đã bị vô hiệu hóa.',
  'auth/operation-not-allowed': 'Phương thức đăng nhập này chưa được bật.',
};

function getErrorMessage(code) {
  return AUTH_ERRORS[code] || `Đã xảy ra lỗi (${code}). Hãy thử lại!`;
}

export function useAuth() {
  // undefined = still loading, null = not logged in, object = logged in
  const [user, setUser] = useState(undefined);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (u) => {
      setUser(u);
    });
    return unsubscribe;
  }, []);

  const clearError = useCallback(() => setError(null), []);

  const register = useCallback(async (email, password) => {
    setLoading(true);
    setError(null);
    try {
      await createUserWithEmailAndPassword(auth, email, password);
      return { success: true };
    } catch (e) {
      setError(getErrorMessage(e.code));
      return { success: false };
    } finally {
      setLoading(false);
    }
  }, []);

  const login = useCallback(async (email, password) => {
    setLoading(true);
    setError(null);
    try {
      await signInWithEmailAndPassword(auth, email, password);
      return { success: true };
    } catch (e) {
      setError(getErrorMessage(e.code));
      return { success: false };
    } finally {
      setLoading(false);
    }
  }, []);

  const logout = useCallback(async () => {
    await signOut(auth);
  }, []);


  const resetPassword = useCallback(async (email) => {
    setLoading(true);
    setError(null);
    try {
      await sendPasswordResetEmail(auth, email);
      return { success: true };
    } catch (e) {
      setError(getErrorMessage(e.code));
      return { success: false };
    } finally {
      setLoading(false);
    }
  }, []);

  const refreshUser = useCallback(async () => {
    if (auth.currentUser) {
      await reload(auth.currentUser);
      // Force re-render by creating new reference
      setUser(Object.assign(Object.create(Object.getPrototypeOf(auth.currentUser)), auth.currentUser));
    }
  }, []);

  return {
    user,
    isInitializing: user === undefined,
    error,
    loading,
    register,
    login,
    logout,
    resetPassword,
    clearError,
  };
}
