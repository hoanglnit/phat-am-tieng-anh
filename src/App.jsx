import { useState, useCallback } from 'react';
import HomeScreen from './components/HomeScreen';
import WordManager from './components/WordManager';
import PracticeMode from './components/PracticeMode';
import AuthScreen from './components/AuthScreen';
import { useAuth } from './hooks/useAuth';
import { useWordList } from './hooks/useWordList';
import { useLocalWordList } from './hooks/useLocalWordList';
import './index.css';

const SCREEN = { HOME: 'home', WORD_MANAGER: 'word_manager', PRACTICE: 'practice' };

function LoadingSpinner() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-violet-100 via-pink-50 to-yellow-100 flex items-center justify-center">
      <div className="text-center">
        <div className="text-6xl float-animation inline-block mb-4">🎤</div>
        <div className="flex items-center justify-center gap-2 text-purple-600 font-semibold">
          <span className="w-5 h-5 border-2 border-purple-500 border-t-transparent rounded-full animate-spin inline-block" />
          <span>Đang tải...</span>
        </div>
      </div>
    </div>
  );
}

export default function App() {
  const { user, isInitializing, logout } = useAuth();
  const [guestMode, setGuestMode] = useState(() =>
    localStorage.getItem('guestMode') === 'true'
  );
  const [screen, setScreen] = useState(SCREEN.HOME);

  const isGuest = !user && guestMode;
  const isLoggedIn = Boolean(user);

  // Both hooks always called — React rules of hooks
  const firestoreWordList = useWordList(isLoggedIn ? user.uid : null);
  const localWordList = useLocalWordList(isGuest);

  // Pick the right word list based on auth state
  const wl = isLoggedIn ? firestoreWordList : localWordList;

  const handleEnterGuestMode = useCallback(() => {
    localStorage.setItem('guestMode', 'true');
    setGuestMode(true);
  }, []);

  const handleLoginFromGuest = useCallback(() => {
    localStorage.removeItem('guestMode');
    setGuestMode(false);
  }, []);

  const handleLogout = useCallback(async () => {
    await logout();
    localStorage.removeItem('guestMode');
    setGuestMode(false);
    setScreen(SCREEN.HOME);
  }, [logout]);

  const handleStart = useCallback(() => setScreen(SCREEN.PRACTICE), []);
  const handleGoHome = useCallback(() => setScreen(SCREEN.HOME), []);
  const handleManageWords = useCallback(() => setScreen(SCREEN.WORD_MANAGER), []);

  // ── Auth gates ────────────────────────────────────────────
  if (isInitializing) return <LoadingSpinner />;
  if (!user && !guestMode) return <AuthScreen onGuestMode={handleEnterGuestMode} />;

  // ── App screens ───────────────────────────────────────────
  if (screen === SCREEN.WORD_MANAGER) {
    return (
      <WordManager
        words={wl.words}
        saving={wl.saving}
        saveError={wl.saveError}
        wordsLoading={wl.loading}
        onAddWord={wl.addWord}
        onRemoveWordAt={wl.removeWordAt}
        onImportWords={wl.importWords}
        onClearWords={wl.clearWords}
        onLoadDefaultWords={wl.loadDefaultWords}
        onBack={handleGoHome}
        isGuest={isGuest}
        onLoginFromGuest={handleLoginFromGuest}
      />
    );
  }

  if (screen === SCREEN.PRACTICE) {
    return <PracticeMode words={wl.words} onBack={handleGoHome} shuffled={false} />;
  }

  return (
    <HomeScreen
      words={wl.words}
      wordsLoading={wl.loading}
      user={user}
      isGuest={isGuest}
      onStart={handleStart}
      onManageWords={handleManageWords}
      onLogout={handleLogout}
      onLoginFromGuest={handleLoginFromGuest}
    />
  );
}
