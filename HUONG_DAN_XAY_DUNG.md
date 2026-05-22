# Hướng Dẫn Xây Dựng App "Kiểm Tra Phát Âm Tiếng Anh"

> Tài liệu đầy đủ để xây dựng lại app từ đầu.  
> Phiên bản cuối: tháng 5/2026

---

## Mục lục

1. [Tổng quan](#1-tổng-quan)
2. [Tech Stack](#2-tech-stack)
3. [Chuẩn bị môi trường](#3-chuẩn-bị-môi-trường)
4. [Tạo dự án](#4-tạo-dự-án)
5. [Cài đặt Firebase](#5-cài-đặt-firebase)
6. [Cấu trúc thư mục](#6-cấu-trúc-thư-mục)
7. [Source code đầy đủ](#7-source-code-đầy-đủ)
8. [Biến môi trường](#8-biến-môi-trường)
9. [Chạy locally](#9-chạy-locally)
10. [Triển khai lên Vercel](#10-triển-khai-lên-vercel)
11. [Cập nhật & redeploy](#11-cập-nhật--redeploy)

---

## 1. Tổng quan

App giúp trẻ tiểu học luyện phát âm tiếng Anh:

- **Nhận dạng giọng nói** bằng Web Speech API (có sẵn trong Chrome/Edge)
- **Chấm điểm 1–10** dựa trên: độ chính xác từ, số âm tiết, độ rõ ràng (confidence)
- **Phản hồi cảm xúc**: 🎉 confetti khi ≥7 điểm, emoji khích lệ khi thấp hơn
- **Text-to-Speech**: nghe phát âm mẫu bằng giọng en-US
- **Google search link**: tìm cách phát âm nếu khó
- **Quản lý từ vựng**: thêm từng từ, paste danh sách, upload file .txt
- **2 chế độ**: đăng nhập (lưu Firestore) hoặc dùng thử (lưu localStorage)
- **Responsive**: mobile, iPad, desktop

---

## 2. Tech Stack

| Thành phần | Công nghệ | Phiên bản |
|---|---|---|
| Frontend framework | React | 19 |
| Build tool | Vite | 8 |
| CSS | Tailwind CSS | v3 |
| Auth + Database | Firebase (Auth + Firestore) | 12 |
| Hosting | Vercel | Free |
| Speech Recognition | Web Speech API | Browser built-in |
| Speech Synthesis | Web Speech Synthesis API | Browser built-in |

---

## 3. Chuẩn bị môi trường

### Cần cài đặt
- **Node.js** ≥ 18: https://nodejs.org
- **npm** ≥ 9 (đi kèm Node.js)
- Trình duyệt **Chrome** hoặc **Edge** để test (Safari không hỗ trợ Speech Recognition)

### Kiểm tra
```bash
node --version   # phải ≥ 18
npm --version    # phải ≥ 9
```

### Fix lỗi npm permissions (macOS)
Nếu gặp lỗi `EACCES` khi npm install:
```bash
# Đổi cache dir, không cần sudo
npm config set cache ~/.npm-new-cache
```

---

## 4. Tạo dự án

```bash
# 1. Tạo project Vite + React
npm create vite@latest english-pronunciation -- --template react
cd english-pronunciation

# 2. Cài dependencies chính
npm install

# 3. Cài Tailwind CSS v3
npm install -D tailwindcss postcss autoprefixer
npx tailwindcss init -p

# 4. Cài Firebase
npm install firebase

# 5. Cài Vercel CLI (để deploy sau)
npm install --save-dev vercel
```

---

## 5. Cài đặt Firebase

### 5.1 Tạo Firebase Project
1. Vào **https://console.firebase.google.com**
2. Nhấn **"Add project"** → đặt tên (vd: `phat-am-tieng-anh`) → Continue → Tắt Google Analytics → **Create project**

### 5.2 Lấy Firebase Config
1. Trong project, nhấn biểu tượng **`</>`** (Web app)
2. Đặt tên app → **Register app**
3. Copy đoạn config (dạng object có `apiKey`, `authDomain`, v.v.)

### 5.3 Bật Email/Password Authentication
1. Menu trái → **Authentication** → **Get started**
2. Tab **Sign-in method** → **Email/Password** → Enable → **Save**

### 5.4 Tạo Firestore Database
1. Menu trái → **Firestore Database** → **Create database**
2. Chọn **"Start in production mode"**
3. Chọn region: **asia-southeast1** (gần Việt Nam nhất)
4. Nhấn **Enable**

### 5.5 Thiết lập Firestore Security Rules
Vào **Firestore Database** → tab **Rules** → dán nội dung sau → nhấn **Publish**:

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
  }
}
```

> Rule này đảm bảo mỗi user chỉ đọc/ghi dữ liệu của chính mình.

---

## 6. Cấu trúc thư mục

```
english-pronunciation/
├── public/
├── src/
│   ├── components/
│   │   ├── AuthScreen.jsx          ← Màn hình đăng nhập / đăng ký
│   │   ├── HomeScreen.jsx          ← Màn hình chính
│   │   ├── WordManager.jsx         ← Quản lý danh sách từ
│   │   ├── PracticeMode.jsx        ← Luyện tập phát âm
│   │   ├── ScoreDisplay.jsx        ← Hiển thị điểm + phản hồi
│   │   └── MicButton.jsx           ← Nút microphone
│   ├── hooks/
│   │   ├── useAuth.js              ← Firebase Authentication hook
│   │   ├── useWordList.js          ← Firestore word list hook
│   │   ├── useLocalWordList.js     ← localStorage word list hook (guest)
│   │   └── useSpeechRecognition.js ← Web Speech API hook
│   ├── utils/
│   │   ├── scoring.js              ← Thuật toán chấm điểm
│   │   └── storage.js              ← localStorage helpers + default words
│   ├── App.jsx                     ← Root component + routing
│   ├── firebase.js                 ← Firebase initialization
│   ├── index.css                   ← Tailwind + custom animations
│   └── main.jsx                    ← Entry point
├── index.html
├── package.json
├── vite.config.js
├── tailwind.config.js
├── postcss.config.js
├── vercel.json
├── .env.local                      ← Firebase config (KHÔNG commit)
└── .env.example                    ← Template biến môi trường
```

---

## 7. Source code đầy đủ

Sao chép từng file theo thứ tự dưới đây.

---

### `index.html`

```html
<!doctype html>
<html lang="vi">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=5.0" />
    <meta name="description" content="Ứng dụng luyện phát âm tiếng Anh cho trẻ tiểu học - kiểm tra phát âm bằng giọng nói" />
    <meta name="theme-color" content="#7c3aed" />
    <link rel="icon" type="image/svg+xml" href="data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><text y='.9em' font-size='90'>🎤</text></svg>" />
    <title>Kiểm Tra Phát Âm Tiếng Anh</title>
    <link rel="preconnect" href="https://fonts.googleapis.com" />
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.jsx"></script>
  </body>
</html>
```

---

### `vite.config.js`

```js
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
})
```

---

### `tailwind.config.js`

```js
/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      animation: {
        'bounce-slow': 'bounce 2s infinite',
        'pulse-ring': 'pulse-ring 1.5s cubic-bezier(0.215, 0.61, 0.355, 1) infinite',
        'confetti-fall': 'confetti 3s linear forwards',
        'star-pop': 'star-pop 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards',
        'wiggle': 'wiggle 0.5s ease-in-out',
        'float': 'float 3s ease-in-out infinite',
      },
      keyframes: {
        'pulse-ring': {
          '0%': { transform: 'scale(1)', opacity: '1' },
          '50%': { transform: 'scale(1.2)', opacity: '0.7' },
          '100%': { transform: 'scale(1)', opacity: '1' },
        },
        'star-pop': {
          '0%': { transform: 'scale(0) rotate(-30deg)', opacity: '0' },
          '70%': { transform: 'scale(1.2) rotate(5deg)', opacity: '1' },
          '100%': { transform: 'scale(1) rotate(0deg)', opacity: '1' },
        },
        'wiggle': {
          '0%, 100%': { transform: 'rotate(-5deg)' },
          '50%': { transform: 'rotate(5deg)' },
        },
        'float': {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-10px)' },
        },
      },
    },
  },
  plugins: [],
}
```

---

### `postcss.config.js`

```js
export default {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
  },
}
```

---

### `vercel.json`

```json
{
  "buildCommand": "npm run build",
  "outputDirectory": "dist",
  "framework": "vite"
}
```

---

### `.env.example`

```
VITE_FIREBASE_API_KEY=your_api_key_here
VITE_FIREBASE_AUTH_DOMAIN=your_project_id.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_project_id.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_app_id
```

---

### `src/main.jsx`

```jsx
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
```

---

### `src/firebase.js`

```js
import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export default app;
```

---

### `src/index.css`

```css
@tailwind base;
@tailwind components;
@tailwind utilities;

/* ── Keyframe Animations ─────────────────────────────────── */
@keyframes confetti-fall {
  0%   { transform: translateY(-20px) rotate(0deg); opacity: 1; }
  100% { transform: translateY(100vh) rotate(720deg); opacity: 0; }
}
@keyframes confetti-sway {
  0%,100% { transform: translateX(0px) rotate(0deg); }
  25%     { transform: translateX(30px) rotate(180deg); }
  75%     { transform: translateX(-30px) rotate(540deg); }
}
@keyframes pulse-ring {
  0%   { box-shadow: 0 0 0 0 rgba(168,85,247,0.7); transform: scale(1); }
  50%  { box-shadow: 0 0 0 20px rgba(168,85,247,0); transform: scale(1.05); }
  100% { box-shadow: 0 0 0 0 rgba(168,85,247,0); transform: scale(1); }
}
@keyframes star-pop {
  0%   { transform: scale(0) rotate(-30deg); opacity: 0; }
  70%  { transform: scale(1.3) rotate(5deg); opacity: 1; }
  100% { transform: scale(1) rotate(0deg); opacity: 1; }
}
@keyframes emoji-bounce {
  0%,100% { transform: translateY(0) scale(1); }
  30%     { transform: translateY(-20px) scale(1.1); }
  60%     { transform: translateY(-10px) scale(1.05); }
}
@keyframes float-up {
  0%   { transform: translateY(0) scale(0.5); opacity: 1; }
  100% { transform: translateY(-150px) scale(1.5); opacity: 0; }
}
@keyframes wiggle {
  0%,100% { transform: rotate(-8deg) scale(1.1); }
  25%     { transform: rotate(8deg) scale(1.1); }
  50%     { transform: rotate(-5deg) scale(1.05); }
  75%     { transform: rotate(5deg) scale(1.05); }
}
@keyframes shimmer {
  0%   { background-position: -200% center; }
  100% { background-position: 200% center; }
}
@keyframes score-reveal {
  0%   { transform: scale(0) rotate(-180deg); opacity: 0; }
  60%  { transform: scale(1.2) rotate(10deg); opacity: 1; }
  100% { transform: scale(1) rotate(0deg); opacity: 1; }
}
@keyframes float-anim {
  0%,100% { transform: translateY(0px); }
  50%     { transform: translateY(-12px); }
}

/* ── Utility Classes ─────────────────────────────────────── */
.confetti-container {
  position: fixed; top: 0; left: 0;
  width: 100%; height: 100%;
  pointer-events: none; z-index: 9999; overflow: hidden;
}
.confetti-piece {
  position: absolute; top: -20px;
  width: 10px; height: 14px;
  animation: confetti-sway 3s linear forwards;
  border-radius: 2px;
}
.confetti-piece:nth-child(odd)  { border-radius: 50%; width: 8px; height: 8px; }
.confetti-piece:nth-child(3n)   { width: 12px; height: 6px; border-radius: 4px; }

.mic-recording  { animation: pulse-ring 1.5s cubic-bezier(0.215,0.61,0.355,1) infinite !important; }
.star-animated  { animation: star-pop 0.4s cubic-bezier(0.175,0.885,0.32,1.275) forwards; }
.emoji-bounce   { display: inline-block; animation: emoji-bounce 0.8s ease-in-out; }
.float-up       { position: absolute; animation: float-up 1.5s ease-out forwards; }
.score-reveal   { animation: score-reveal 0.6s cubic-bezier(0.175,0.885,0.32,1.275) forwards; }
.float-animation { animation: float-anim 3s ease-in-out infinite; }
.progress-bar-fill { transition: width 0.5s ease-in-out; }

.shimmer-text {
  background: linear-gradient(90deg,#7c3aed,#ec4899,#f59e0b,#ec4899,#7c3aed);
  background-size: 200% auto;
  -webkit-background-clip: text; background-clip: text;
  -webkit-text-fill-color: transparent;
  animation: shimmer 3s linear infinite;
}

.word-card { transition: transform 0.2s ease, box-shadow 0.2s ease; }
.word-card:hover { transform: translateY(-2px); box-shadow: 0 8px 25px rgba(168,85,247,0.2); }

.btn-press { transition: transform 0.1s ease; }
.btn-press:active { transform: scale(0.95) !important; }

/* ── Base Reset ──────────────────────────────────────────── */
*, *::before, *::after { box-sizing: border-box; }
body {
  margin: 0; padding: 0;
  font-family: 'Segoe UI', system-ui, -apple-system, BlinkMacSystemFont, sans-serif;
  -webkit-font-smoothing: antialiased;
  min-height: 100vh;
}
#root { min-height: 100vh; }

/* ── Custom Scrollbar ────────────────────────────────────── */
::-webkit-scrollbar       { width: 6px; }
::-webkit-scrollbar-track { background: #f1f1f1; border-radius: 10px; }
::-webkit-scrollbar-thumb { background: #c084fc; border-radius: 10px; }
::-webkit-scrollbar-thumb:hover { background: #a855f7; }
```

---

### `src/utils/storage.js`

```js
const STORAGE_KEY = 'english_pronunciation_words';

export const DEFAULT_WORDS = [
  'apple', 'banana', 'cat', 'dog', 'elephant', 'fish', 'grape', 'hat',
  'ice cream', 'jacket', 'kite', 'lemon', 'monkey', 'nose', 'orange',
  'penguin', 'queen', 'rabbit', 'sun', 'tiger', 'umbrella', 'violin',
  'water', 'yellow', 'zebra', 'book', 'chair', 'door', 'egg', 'flower',
  'green', 'house', 'island', 'jump', 'king', 'love', 'milk', 'night',
  'open', 'park', 'rain', 'snow', 'tree', 'under', 'very', 'wind',
  'box', 'year', 'zoo', 'bird', 'cloud', 'dream', 'earth', 'frog',
];

export function loadWords() {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch (e) {
    console.warn('Failed to load words from localStorage:', e);
  }
  return [];
}

export function saveWords(words) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(words));
  } catch (e) {
    console.warn('Failed to save words to localStorage:', e);
  }
}

export function parseWordList(text) {
  return text
    .split(/[\n,]+/)
    .map(w => w.trim())
    .filter(w => w.length > 0);
}

export function mergeWords(existing, newWords) {
  const existingLower = new Set(existing.map(w => w.toLowerCase()));
  const toAdd = newWords.filter(w => !existingLower.has(w.toLowerCase()));
  return [...existing, ...toAdd];
}

export function shuffleArray(array) {
  const arr = [...array];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}
```

---

### `src/utils/scoring.js`

```js
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

export function countSyllables(word) {
  const w = word.toLowerCase().replace(/[^a-z]/g, '');
  if (!w) return 0;
  if (w.length <= 3) return 1;
  const cleaned = w.replace(/e$/, '');
  const groups = cleaned.match(/[aeiouy]+/g);
  return Math.max(1, groups ? groups.length : 1);
}

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
        if (lastVowelGroupEnd >= 0 && i - lastVowelGroupEnd > 1) {
          const consLen = i - lastVowelGroupEnd;
          const splitAt = lastVowelGroupEnd + Math.max(1, Math.floor(consLen / 2));
          parts.push(w.slice(start, splitAt));
          start = splitAt;
        }
        inVowel = true;
      }
    } else {
      if (inVowel) { lastVowelGroupEnd = i; inVowel = false; }
    }
  }
  if (start < w.length) parts.push(w.slice(start));
  return parts.length > 1 ? parts.join('·') : word;
}

/**
 * Chấm điểm phát âm 1–10.
 * 3 yếu tố:
 *   1. Text similarity (Levenshtein, đường cong bậc 1.9 — nghiêm khắc)
 *   2. Syllable mismatch (sai số âm tiết = sai trọng âm, trừ điểm)
 *   3. API confidence (nói nhỏ / không rõ trọng âm → hệ số giảm)
 */
export function calculateScore(target, recognized, confidence = 0) {
  if (!recognized?.trim()) return 1;

  const t = target.toLowerCase().trim();
  const r = recognized.toLowerCase().trim();
  const words = r.split(/\s+/);

  // 1. Text similarity
  const exactMatch = t === r || words.some(w => w === t);
  let textSim;
  if (exactMatch) {
    textSim = 1.0;
  } else {
    let best = 0;
    for (const w of words) {
      const maxLen = Math.max(t.length, w.length);
      if (!maxLen) continue;
      const sim = 1 - levenshteinDistance(t, w) / maxLen;
      if (sim > best) best = sim;
    }
    const fullMax = Math.max(t.length, r.length);
    const fullSim = fullMax ? 1 - levenshteinDistance(t, r) / fullMax : 0;
    textSim = Math.max(best, fullSim);
  }

  // 2. Syllable mismatch penalty
  let sylPenalty = 0;
  const tSyl = countSyllables(t);
  if (tSyl > 1) {
    const closest = words.reduce((b, w) =>
      levenshteinDistance(t, w) < levenshteinDistance(t, b) ? w : b
    , r);
    const rSyl = countSyllables(closest);
    sylPenalty = Math.min(0.40, Math.abs(tSyl - rSyl) * 0.20);
  }

  // 3. Confidence factor (0→0.5, 1→1.0)
  const conf = Math.max(0, Math.min(1, confidence));
  const confFactor = 0.50 + conf * 0.50;

  // 4. Final score
  const baseSim = Math.pow(textSim, 1.9) * (1 - sylPenalty) * confFactor;
  return Math.max(1, Math.min(10, Math.round(baseSim * 9) + 1));
}

export function getFeedback(score) {
  if (score >= 9) return {
    emojis: ['🏆', '🌟', '⭐', '✨', '🎖️'],
    message: 'Hoàn hảo! Phát âm chuẩn 100%!',
    subMessage: 'Trọng âm và phát âm đều xuất sắc!',
    showConfetti: true,
  };
  if (score >= 7) return {
    emojis: ['🎉', '🥳', '🌟', '👏', '🎊'],
    message: 'Rất giỏi! Gần hoàn hảo rồi!',
    subMessage: 'Chú ý nhấn đúng âm tiết để đạt điểm tuyệt đối!',
    showConfetti: true,
  };
  if (score >= 5) return {
    emojis: ['👍', '💪', '😊', '⭐', '🌈'],
    message: 'Khá tốt! Còn cải thiện được!',
    subMessage: 'Hãy chú ý trọng âm — nhấn mạnh đúng âm tiết in hoa nhé!',
    showConfetti: false,
  };
  if (score >= 3) return {
    emojis: ['💪', '🌈', '😤', '🔥'],
    message: 'Cố gắng thêm chút nữa!',
    subMessage: 'Nhấn 🔊 nghe mẫu, chú ý âm tiết được nhấn mạnh rồi đọc lại!',
    showConfetti: false,
  };
  return {
    emojis: ['🌈', '💪', '😊', '🌸', '💫'],
    message: 'Không sao! Thử lại nào!',
    subMessage: 'Nghe 🔊 và bắt chước thật kỹ cách phát âm nhé!',
    showConfetti: false,
  };
}

export function scoreToStars(score) {
  if (score >= 9) return 5;
  if (score >= 7) return 4;
  if (score >= 5) return 3;
  if (score >= 3) return 2;
  return 1;
}
```

---

### `src/hooks/useAuth.js`

```js
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
};

function getErrorMessage(code) {
  return AUTH_ERRORS[code] || `Đã xảy ra lỗi (${code}). Hãy thử lại!`;
}

export function useAuth() {
  // undefined = đang khởi tạo, null = chưa đăng nhập, object = đã đăng nhập
  const [user, setUser] = useState(undefined);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (u) => setUser(u));
    return unsubscribe;
  }, []);

  const clearError = useCallback(() => setError(null), []);

  const register = useCallback(async (email, password) => {
    setLoading(true); setError(null);
    try {
      await createUserWithEmailAndPassword(auth, email, password);
      return { success: true };
    } catch (e) {
      setError(getErrorMessage(e.code));
      return { success: false };
    } finally { setLoading(false); }
  }, []);

  const login = useCallback(async (email, password) => {
    setLoading(true); setError(null);
    try {
      await signInWithEmailAndPassword(auth, email, password);
      return { success: true };
    } catch (e) {
      setError(getErrorMessage(e.code));
      return { success: false };
    } finally { setLoading(false); }
  }, []);

  const logout = useCallback(async () => {
    await signOut(auth);
  }, []);

  const resetPassword = useCallback(async (email) => {
    setLoading(true); setError(null);
    try {
      await sendPasswordResetEmail(auth, email);
      return { success: true };
    } catch (e) {
      setError(getErrorMessage(e.code));
      return { success: false };
    } finally { setLoading(false); }
  }, []);

  return { user, isInitializing: user === undefined, error, loading, register, login, logout, resetPassword, clearError };
}
```

---

### `src/hooks/useWordList.js`
*(Dùng cho user đã đăng nhập — lưu Firestore)*

```js
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
    if (!userId) { setWords([]); setLoading(false); return; }
    setLoading(true);
    const unsubscribe = onSnapshot(
      doc(db, 'users', userId),
      (snap) => { setWords(snap.exists() ? (snap.data().words || []) : []); setLoading(false); },
      (err) => { console.error('Firestore error:', err); setLoading(false); }
    );
    return unsubscribe;
  }, [userId]);

  const persist = useCallback(async (newWords) => {
    if (!userId) return false;
    setSaving(true); setSaveError(null);
    try {
      await setDoc(doc(db, 'users', userId), { words: newWords, updatedAt: new Date() }, { merge: true });
      return true;
    } catch (e) {
      setSaveError('Không lưu được. Kiểm tra kết nối mạng.');
      return false;
    } finally { setSaving(false); }
  }, [userId]);

  const addWord = useCallback(async (word) => {
    const trimmed = word.trim().toLowerCase();
    if (!trimmed) return { added: false, reason: 'empty' };
    if (wordsRef.current.some(w => w.toLowerCase() === trimmed)) return { added: false, reason: 'duplicate' };
    const ok = await persist([...wordsRef.current, trimmed]);
    return { added: ok };
  }, [persist]);

  const removeWordAt = useCallback(async (index) => {
    return persist(wordsRef.current.filter((_, i) => i !== index));
  }, [persist]);

  const importWords = useCallback(async (text) => {
    const parsed = parseWordList(text);
    if (!parsed.length) return { added: 0, total: 0 };
    const merged = mergeWords(wordsRef.current, parsed);
    await persist(merged);
    return { added: merged.length - wordsRef.current.length, total: parsed.length };
  }, [persist]);

  const clearWords = useCallback(async () => persist([]), [persist]);

  const loadDefaultWords = useCallback(async () => {
    const merged = mergeWords(wordsRef.current, DEFAULT_WORDS);
    const added = merged.length - wordsRef.current.length;
    await persist(merged);
    return added;
  }, [persist]);

  return { words, loading, saving, saveError, addWord, removeWordAt, importWords, clearWords, loadDefaultWords };
}
```

---

### `src/hooks/useLocalWordList.js`
*(Dùng cho guest — lưu localStorage)*

```js
import { useState, useCallback, useEffect, useRef } from 'react';
import { loadWords, saveWords, parseWordList, mergeWords, DEFAULT_WORDS } from '../utils/storage';

export function useLocalWordList(active) {
  const [words, setWords] = useState(() => (active ? loadWords() : []));
  const wordsRef = useRef(words);
  wordsRef.current = words;

  useEffect(() => { if (active) setWords(loadWords()); }, [active]);
  useEffect(() => { if (active) saveWords(words); }, [words, active]);

  const addWord = useCallback(async (word) => {
    const trimmed = word.trim().toLowerCase();
    if (!trimmed) return { added: false, reason: 'empty' };
    if (wordsRef.current.some(w => w.toLowerCase() === trimmed)) return { added: false, reason: 'duplicate' };
    setWords(prev => [...prev, trimmed]);
    return { added: true };
  }, []);

  const removeWordAt = useCallback(async (index) => {
    setWords(prev => prev.filter((_, i) => i !== index));
    return true;
  }, []);

  const importWords = useCallback(async (text) => {
    const parsed = parseWordList(text);
    if (!parsed.length) return { added: 0, total: 0 };
    const merged = mergeWords(wordsRef.current, parsed);
    const added = merged.length - wordsRef.current.length;
    setWords(merged);
    return { added, total: parsed.length };
  }, []);

  const clearWords = useCallback(async () => { setWords([]); return true; }, []);

  const loadDefaultWords = useCallback(async () => {
    const merged = mergeWords(wordsRef.current, DEFAULT_WORDS);
    const added = merged.length - wordsRef.current.length;
    setWords(merged);
    return added;
  }, []);

  return {
    words: active ? words : [],
    loading: false, saving: false, saveError: null,
    addWord, removeWordAt, importWords, clearWords, loadDefaultWords,
  };
}
```

---

### `src/hooks/useSpeechRecognition.js`

```js
import { useState, useRef, useCallback, useEffect } from 'react';

const TIMEOUT_MS = 10000;

export function useSpeechRecognition() {
  const [isRecording, setIsRecording] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [confidence, setConfidence] = useState(0);
  const [error, setError] = useState(null);
  const recognitionRef = useRef(null);
  const timeoutRef = useRef(null);

  const isSupported = typeof window !== 'undefined' &&
    !!(window.SpeechRecognition || window.webkitSpeechRecognition);

  const cleanup = useCallback(() => {
    if (timeoutRef.current) { clearTimeout(timeoutRef.current); timeoutRef.current = null; }
    if (recognitionRef.current) {
      try { recognitionRef.current.abort(); } catch (_) {}
      recognitionRef.current = null;
    }
    setIsRecording(false);
  }, []);

  useEffect(() => () => cleanup(), [cleanup]);

  const startRecording = useCallback((onResult) => {
    if (!isSupported) {
      setError('Trình duyệt không hỗ trợ. Vui lòng dùng Chrome hoặc Edge.');
      return;
    }
    cleanup();
    setError(null); setTranscript(''); setConfidence(0);

    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    const rec = new SR();
    rec.lang = 'en-US';
    rec.interimResults = false;
    rec.maxAlternatives = 3;
    rec.continuous = false;
    recognitionRef.current = rec;

    rec.onstart = () => setIsRecording(true);

    rec.onresult = (event) => {
      clearTimeout(timeoutRef.current); timeoutRef.current = null;
      let bestTranscript = '', bestConf = 0;
      for (let i = 0; i < event.results.length; i++) {
        for (let j = 0; j < event.results[i].length; j++) {
          const alt = event.results[i][j];
          if (alt.confidence > bestConf) { bestConf = alt.confidence; bestTranscript = alt.transcript; }
        }
      }
      if (!bestTranscript && event.results[0]?.[0]) {
        bestTranscript = event.results[0][0].transcript;
        bestConf = event.results[0][0].confidence || 0;
      }
      setTranscript(bestTranscript); setConfidence(bestConf); setIsRecording(false);
      if (onResult) onResult(bestTranscript, bestConf);
    };

    rec.onerror = (event) => {
      clearTimeout(timeoutRef.current); timeoutRef.current = null;
      const msgs = {
        'no-speech':      'Không nghe thấy giọng nói. Hãy nói to hơn nhé!',
        'audio-capture':  'Không tìm thấy microphone. Vui lòng kiểm tra lại.',
        'not-allowed':    'Bạn chưa cho phép dùng microphone. Vui lòng cấp quyền.',
        'network':        'Lỗi mạng. Vui lòng kiểm tra kết nối internet.',
        'aborted':        null,
      };
      const msg = msgs[event.error];
      if (msg !== null) setError(msg || `Lỗi: ${event.error}. Hãy thử lại!`);
      setIsRecording(false); recognitionRef.current = null;
    };

    rec.onend = () => {
      clearTimeout(timeoutRef.current); timeoutRef.current = null;
      setIsRecording(false); recognitionRef.current = null;
    };

    try {
      rec.start();
      timeoutRef.current = setTimeout(() => {
        if (recognitionRef.current) {
          try { recognitionRef.current.stop(); } catch (_) {}
          setError('Hết thời gian. Hãy nói nhanh hơn nhé!');
        }
      }, TIMEOUT_MS);
    } catch (e) {
      setError('Không thể bắt đầu ghi âm. Hãy thử lại!');
      setIsRecording(false);
    }
  }, [isSupported, cleanup]);

  const stopRecording = useCallback(() => {
    if (recognitionRef.current) { try { recognitionRef.current.stop(); } catch (_) {} }
    cleanup();
  }, [cleanup]);

  return { isRecording, isSupported, transcript, confidence, startRecording, stopRecording, error, clearError: () => setError(null) };
}
```

---

### `src/App.jsx`

```jsx
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
  const [guestMode, setGuestMode] = useState(() => localStorage.getItem('guestMode') === 'true');
  const [screen, setScreen] = useState(SCREEN.HOME);

  const isGuest = !user && guestMode;
  const isLoggedIn = Boolean(user);

  // Cả 2 hooks phải được gọi vô điều kiện (React rules of hooks)
  const firestoreWordList = useWordList(isLoggedIn ? user.uid : null);
  const localWordList = useLocalWordList(isGuest);
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

  if (isInitializing) return <LoadingSpinner />;
  if (!user && !guestMode) return <AuthScreen onGuestMode={handleEnterGuestMode} />;

  if (screen === SCREEN.WORD_MANAGER) {
    return (
      <WordManager
        words={wl.words} saving={wl.saving} saveError={wl.saveError} wordsLoading={wl.loading}
        onAddWord={wl.addWord} onRemoveWordAt={wl.removeWordAt} onImportWords={wl.importWords}
        onClearWords={wl.clearWords} onLoadDefaultWords={wl.loadDefaultWords}
        onBack={() => setScreen(SCREEN.HOME)}
        isGuest={isGuest} onLoginFromGuest={handleLoginFromGuest}
      />
    );
  }

  if (screen === SCREEN.PRACTICE) {
    return <PracticeMode words={wl.words} onBack={() => setScreen(SCREEN.HOME)} shuffled={false} />;
  }

  return (
    <HomeScreen
      words={wl.words} wordsLoading={wl.loading} user={user} isGuest={isGuest}
      onStart={() => setScreen(SCREEN.PRACTICE)}
      onManageWords={() => setScreen(SCREEN.WORD_MANAGER)}
      onLogout={handleLogout} onLoginFromGuest={handleLoginFromGuest}
    />
  );
}
```

---

### `src/components/AuthScreen.jsx`

> File dài — xem file gốc tại `src/components/AuthScreen.jsx` trong project.  
> Tóm tắt chức năng:
> - Tab "Đăng nhập" và "Tạo tài khoản"
> - Form email + password + confirm (register)
> - Show/hide password toggle
> - Màn hình "Quên mật khẩu" (gửi email reset)
> - Nút "Dùng thử không cần đăng nhập" → gọi `onGuestMode()`
> - Hiển thị lỗi bằng tiếng Việt
> - Loading spinner trong button khi đang xử lý

---

### `src/components/HomeScreen.jsx`

> Tóm tắt chức năng:
> - Nếu `isGuest`: hiện banner xanh "Chế độ khách" + nút "Đăng nhập"
> - Nếu đã đăng nhập: hiện email user + nút "Đăng xuất" (có confirm)
> - Mascot emoji xoay vòng mỗi 3 giây (nhấn để đổi)
> - Card hiển thị số từ trong danh sách
> - Nút "Bắt đầu luyện tập!" và "Quản lý từ vựng"

---

### `src/components/WordManager.jsx`

> Tóm tắt chức năng:
> - Header với indicator "Đang lưu..." khi `saving=true`
> - 3 tab: Thêm từng từ / Dán danh sách / Upload file .txt
> - Nút "Dùng từ mẫu" (52 từ mặc định) và "Xóa tất cả"
> - Danh sách từ dạng pills, nhấn ✕ xóa
> - Gọi Firestore (logged in) hoặc localStorage (guest) thông qua props

---

### `src/components/PracticeMode.jsx`

> Tóm tắt chức năng:
> - Progress bar + "Từ X/Y"
> - Thẻ từ font cực lớn (6xl–8xl) + syllable breakdown (`el·e·phant · 3 âm tiết`)
> - Nút 🔊 Text-to-Speech (en-US, rate 0.85)
> - MicButton — nhấn để ghi âm, nhấn lại để dừng
> - Sau khi ghi: hiển thị ScoreDisplay với score + confidence
> - Điều hướng: Trước / Tiếp theo, chấm dot navigation, shuffle 🔀

---

### `src/components/ScoreDisplay.jsx`

> Tóm tắt chức năng:
> - Confetti 60 mảnh CSS khi điểm ≥ 7
> - Điểm số lớn (7xl) với animation xoay vào
> - 5 sao animate lần lượt
> - Emoji xoay vòng theo thời gian
> - Hiện "Bạn đọc: ..." và "Từ cần phát âm: ..." với syllable breakdown
> - Thanh "Độ rõ ràng giọng đọc" (confidence bar, màu xanh/vàng/đỏ)
> - Link Google search cách phát âm
> - Nút "Thử lại" và "Tiếp theo"

---

### `src/components/MicButton.jsx`

```jsx
import React from 'react';

export default function MicButton({ isRecording, onClick, disabled }) {
  return (
    <div className="flex flex-col items-center gap-3">
      <button
        onClick={onClick}
        disabled={disabled}
        className={`
          relative flex items-center justify-center
          w-32 h-32 md:w-36 md:h-36 rounded-full border-4
          text-white font-bold transition-all duration-200 btn-press
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
        {isRecording && (
          <>
            <span className="absolute inset-0 rounded-full bg-red-400 opacity-40 animate-ping" />
            <span className="absolute inset-0 rounded-full bg-red-300 opacity-20 animate-ping" style={{ animationDelay: '0.3s' }} />
          </>
        )}
        <span className={`text-5xl md:text-6xl relative z-10 select-none ${isRecording ? 'animate-bounce' : ''}`}>
          {isRecording ? '🔴' : '🎤'}
        </span>
      </button>
      <div className="text-center">
        {isRecording ? (
          <div className="flex items-center gap-2">
            <span className="inline-block w-2.5 h-2.5 bg-red-500 rounded-full animate-pulse" />
            <span className="text-red-600 font-bold text-base md:text-lg">Đang nghe... nói to nhé!</span>
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
```

---

## 8. Biến môi trường

### File `.env.local` (local development — KHÔNG commit git)

```
VITE_FIREBASE_API_KEY=AIzaSy...
VITE_FIREBASE_AUTH_DOMAIN=ten-project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=ten-project
VITE_FIREBASE_STORAGE_BUCKET=ten-project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=123456789
VITE_FIREBASE_APP_ID=1:123456789:web:abcdef
```

> Lấy các giá trị này từ Firebase Console → Project Settings → Your apps → SDK setup.

### Vercel (production)

Thêm từng biến một lần đầu:

```bash
./node_modules/.bin/vercel env add VITE_FIREBASE_API_KEY production
./node_modules/.bin/vercel env add VITE_FIREBASE_AUTH_DOMAIN production
./node_modules/.bin/vercel env add VITE_FIREBASE_PROJECT_ID production
./node_modules/.bin/vercel env add VITE_FIREBASE_STORAGE_BUCKET production
./node_modules/.bin/vercel env add VITE_FIREBASE_MESSAGING_SENDER_ID production
./node_modules/.bin/vercel env add VITE_FIREBASE_APP_ID production
```

Hoặc vào **vercel.com** → Project → Settings → Environment Variables để thêm thủ công.

---

## 9. Chạy locally

```bash
# Đảm bảo đã có file .env.local với Firebase config
npm run dev
# Mở http://localhost:5173
```

> **Quan trọng**: Dùng Chrome hoặc Edge để test Speech Recognition.  
> Safari không hỗ trợ `webkitSpeechRecognition`.

---

## 10. Triển khai lên Vercel

### Lần đầu (setup)

```bash
# 1. Đăng nhập Vercel (mở browser xác thực)
./node_modules/.bin/vercel login

# 2. Thêm tất cả env vars (xem mục 8)

# 3. Deploy
./node_modules/.bin/vercel --prod --yes
```

### Kết quả
- URL chính: `https://english-pronunciation-eta.vercel.app` (tên tự động)
- Dashboard: `https://vercel.com/[username]/english-pronunciation`

---

## 11. Cập nhật & redeploy

Mỗi khi sửa code:

```bash
# Build kiểm tra lỗi trước
npm run build

# Deploy lên production
./node_modules/.bin/vercel --prod --yes
```

---

## Kiến trúc dữ liệu Firestore

```
users/
  {uid}/
    words: string[]        ← danh sách từ của user
    updatedAt: timestamp   ← lần cập nhật cuối
```

---

## Luồng hoạt động

```
Mở app
  ├── Firebase đang khởi tạo? → Loading spinner
  ├── Chưa đăng nhập + chưa chọn guest → AuthScreen
  │     ├── Đăng nhập     → vào app, words từ Firestore
  │     ├── Đăng ký       → tạo account, vào app luôn
  │     ├── Quên mật khẩu → gửi email reset
  │     └── Dùng thử      → guest mode, words từ localStorage
  └── Đã auth → App
        ├── HomeScreen    → hiện word count, mascot, nút bắt đầu
        ├── WordManager   → CRUD từ vựng (Firestore hoặc localStorage)
        └── PracticeMode  → ghi âm → chấm điểm → ScoreDisplay

Chấm điểm (calculateScore):
  score = (textSim^1.9) × (1 - sylPenalty) × confFactor × 9 + 1
  - textSim:    Levenshtein similarity (0–1)
  - sylPenalty: abs(targetSyllables - recognizedSyllables) × 0.20, max 0.40
  - confFactor: 0.50 + confidence × 0.50
```

---

## Các lưu ý quan trọng

| Vấn đề | Giải pháp |
|---|---|
| Speech API không hoạt động | Dùng Chrome/Edge; Safari không hỗ trợ |
| Microphone bị block | Vào Settings → Site permissions → Microphone → Allow |
| Điểm thấp dù nói đúng | Nói to hơn, rõ hơn; confidence thấp sẽ giảm điểm |
| Firebase email không nhận được | App đã bỏ yêu cầu verify email; đăng ký xong vào app luôn |
| Lưu Firestore thất bại | Kiểm tra Firestore Rules; phải publish đúng rule |
| npm EACCES error | `npm config set cache ~/.npm-new-cache` |
