# System Design — Kiểm Tra Phát Âm Tiếng Anh

---

## 1. High-Level Architecture

```mermaid
graph TB
    subgraph CLIENT["🖥️ Client (Browser)"]
        direction TB
        SPA["React SPA\n(Vite bundle)"]
        SPEECH["Web Speech API\n(built-in browser)"]
        TTS["Speech Synthesis API\n(built-in browser)"]
        LS["localStorage\n(guest words)"]
    end

    subgraph VERCEL["☁️ Vercel (CDN)"]
        CDN["Global Edge Network\nStatic File Hosting\nHTTPS / SSL"]
    end

    subgraph FIREBASE["🔥 Firebase (Google Cloud)"]
        AUTH["Firebase Auth\nEmail / Password"]
        FSDB["Firestore Database\nNoSQL Document Store"]
    end

    subgraph EXTERNAL["🌐 External Services"]
        GOOGLE["Google Search\npronunciation lookup"]
    end

    USER["👤 User\n(Chrome / Edge)"] -->|"HTTPS request"| CDN
    CDN -->|"Serve static bundle"| SPA
    SPA <-->|"Record audio"| SPEECH
    SPA <-->|"Play audio"| TTS
    SPA <-->|"Read / Write words\n(guest mode)"| LS
    SPA <-->|"Sign in / Sign up\nREST over HTTPS"| AUTH
    SPA <-->|"CRUD word list\nWebSocket realtime"| FSDB
    SPA -->|"Open new tab"| GOOGLE
```

---

## 2. Frontend Component Architecture

```mermaid
graph TB
    APP["App.jsx\n─────────────\nuseAuth()\nuseWordList()\nuseLocalWordList()\nscreen state"]

    APP --> AUTH_S["AuthScreen\n─────────────\nLogin form\nRegister form\nForgot password\nGuest button"]

    APP --> HOME["HomeScreen\n─────────────\nMascot animation\nWord count card\nUser / Guest bar\nNavigation buttons"]

    APP --> WM["WordManager\n─────────────\nAdd single word\nPaste word list\nUpload .txt file\nDelete / Clear all"]

    APP --> PM["PracticeMode\n─────────────\nWord card display\nSyllable breakdown\nTTS button\nProgress bar\nShuffle mode"]

    PM --> MIC["MicButton\n─────────────\nPulse animation\nRecording state\nError display"]

    PM --> SD["ScoreDisplay\n─────────────\nScore 1–10\nStar rating\nConfetti\nConfidence bar\nEmoji reaction\nGoogle link"]

    style APP fill:#7c3aed,color:#fff
    style AUTH_S fill:#db2777,color:#fff
    style HOME fill:#0891b2,color:#fff
    style WM fill:#059669,color:#fff
    style PM fill:#d97706,color:#fff
    style MIC fill:#dc2626,color:#fff
    style SD fill:#7c3aed,color:#fff
```

---

## 3. State & Data Flow

```mermaid
flowchart LR
    subgraph HOOKS["React Hooks Layer"]
        UA["useAuth\n────────\nuser state\nlogin()\nlogout()\nregister()"]
        UWL["useWordList\n────────\nFirestore sync\naddWord()\nremoveWordAt()\nimportWords()"]
        ULWL["useLocalWordList\n────────\nlocalStorage sync\naddWord()\nremoveWordAt()\nimportWords()"]
        USR["useSpeechRecognition\n────────\ntranscript\nconfidence\nstartRecording()\nstopRecording()"]
    end

    subgraph STORAGE["Persistence Layer"]
        FS[("Firestore\nusers/{uid}\n  words: string[]\n  updatedAt: ts")]
        LST[("localStorage\nenglish_pronunciation_words\n  words: string[]")]
    end

    subgraph BROWSER_API["Browser Native APIs"]
        WSR["Web Speech\nRecognition API\nlang: en-US\nconfidence: 0–1"]
        WSYN["Web Speech\nSynthesis API\nrate: 0.85\nvoice: en-US"]
    end

    UA <-->|"onAuthStateChanged"| FIREBASE_AUTH[("Firebase Auth")]
    UWL <-->|"onSnapshot (realtime)"| FS
    ULWL <-->|"getItem / setItem"| LST
    USR <-->|"start / result / error"| WSR

    UA --> APP_STATE["App.jsx\nScreen Router"]
    UWL --> APP_STATE
    ULWL --> APP_STATE
    USR --> PM_STATE["PracticeMode\nScore State"]

    PM_STATE --> SCORE["calculateScore()\ntarget, transcript, confidence\n→ score 1–10"]

    style FIREBASE_AUTH fill:#f97316,color:#fff
    style FS fill:#f97316,color:#fff
    style LST fill:#6366f1,color:#fff
    style WSR fill:#16a34a,color:#fff
    style WSYN fill:#16a34a,color:#fff
```

---

## 4. Authentication Flow

```mermaid
sequenceDiagram
    actor U as 👤 User
    participant APP as React App
    participant FA as Firebase Auth
    participant FS as Firestore

    Note over U,FS: ── Đăng ký ──────────────────────────────
    U->>APP: Nhập email + password
    APP->>FA: createUserWithEmailAndPassword()
    FA-->>APP: UserCredential (uid)
    APP-->>U: Vào app ngay (không cần verify email)
    APP->>FS: Tạo doc users/{uid} (words: [])

    Note over U,FS: ── Đăng nhập ────────────────────────────
    U->>APP: Nhập email + password
    APP->>FA: signInWithEmailAndPassword()
    FA-->>APP: UserCredential
    APP->>FS: onSnapshot(users/{uid})
    FS-->>APP: Stream word list realtime
    APP-->>U: Hiển thị HomeScreen

    Note over U,FS: ── Chế độ khách ─────────────────────────
    U->>APP: Nhấn "Dùng thử"
    APP->>APP: localStorage.setItem('guestMode','true')
    APP-->>U: Hiển thị HomeScreen (words từ localStorage)

    Note over U,FS: ── Đăng xuất ────────────────────────────
    U->>APP: Nhấn "Đăng xuất"
    APP->>FA: signOut()
    APP->>APP: localStorage.removeItem('guestMode')
    APP-->>U: Về AuthScreen
```

---

## 5. Pronunciation Scoring Pipeline

```mermaid
flowchart TB
    START(["🎤 User nói từ"])
    START --> WSR

    WSR["Web Speech Recognition API\nlang = en-US\nmaxAlternatives = 3\ntimeout = 10s"]
    WSR -->|"transcript + confidence"| CALC

    subgraph CALC["calculateScore(target, recognized, confidence)"]
        direction TB

        T1["① Text Similarity\n─────────────────────\nLevenshtein distance\ntarget vs recognized words\n→ textSim ∈ [0, 1]"]

        T2["② Syllable Mismatch Penalty\n─────────────────────\ncountSyllables(target)\ncountSyllables(recognized)\ndiff × 0.20, max 0.40\n→ sylPenalty ∈ [0, 0.4]"]

        T3["③ Confidence Factor\n─────────────────────\nAPI confidence 0–1\nconfFactor = 0.5 + conf×0.5\n→ confFactor ∈ [0.5, 1.0]"]

        FORMULA["④ Final Formula\n─────────────────────────────────\nbaseSim = textSim^1.9\n         × (1 – sylPenalty)\n         × confFactor\nscore = round(baseSim × 9) + 1\nclamp to [1, 10]"]

        T1 --> FORMULA
        T2 --> FORMULA
        T3 --> FORMULA
    end

    CALC --> SCORE["Score 1–10"]

    SCORE --> S1{"Score?"}
    S1 -->|"≥ 9"| R1["🏆 Hoàn hảo!\nConfetti\n5 sao"]
    S1 -->|"7–8"| R2["🎉 Rất giỏi!\nConfetti\n4 sao"]
    S1 -->|"5–6"| R3["👍 Khá tốt!\n3 sao"]
    S1 -->|"3–4"| R4["💪 Cố thêm!\n2 sao"]
    S1 -->|"1–2"| R5["🌈 Thử lại!\n1 sao"]

    style FORMULA fill:#7c3aed,color:#fff
    style SCORE fill:#059669,color:#fff
```

---

## 6. Firestore Data Model

```mermaid
erDiagram
    FIREBASE_AUTH {
        string uid PK
        string email
        timestamp createdAt
    }

    FIRESTORE_USERS {
        string uid PK "= Firebase Auth uid"
        string[] words "danh sách từ của user"
        timestamp updatedAt
    }

    FIREBASE_AUTH ||--|| FIRESTORE_USERS : "uid matches"
```

---

## 7. Deployment Architecture

```mermaid
graph LR
    subgraph DEV["💻 Local Development"]
        SRC["Source Code\nsrc/"]
        ENV_L[".env.local\nFirebase config"]
        VITE_DEV["Vite Dev Server\nlocalhost:5173\nHMR"]
    end

    subgraph CI["🚀 Vercel Build"]
        BUILD["npm run build\nvite build"]
        DIST["dist/\nindex.html\nassets/*.js\nassets/*.css"]
        ENV_V["Environment Variables\n(set in Vercel dashboard)"]
    end

    subgraph PROD["🌍 Production"]
        EDGE["Vercel Edge Network\n100+ PoP globally\nHTTPS auto"]
        URL["english-pronunciation-eta\n.vercel.app"]
    end

    SRC --> VITE_DEV
    ENV_L --> VITE_DEV

    SRC -->|"vercel --prod"| BUILD
    ENV_V --> BUILD
    BUILD --> DIST
    DIST --> EDGE
    EDGE --> URL
```

---

## 8. Tóm tắt kiến trúc

| Layer | Công nghệ | Vai trò |
|---|---|---|
| **UI** | React 19 + Tailwind CSS v3 | Render giao diện, quản lý state |
| **Build** | Vite 8 | Bundle, HMR, optimize |
| **Speech I/O** | Web Speech API (browser) | Nhận dạng giọng & phát âm mẫu |
| **Scoring** | Levenshtein + syllable + confidence | Chấm điểm 1–10 |
| **Auth** | Firebase Authentication | Email/password, session management |
| **Database** | Cloud Firestore | Lưu word list theo account, realtime sync |
| **Guest Storage** | Browser localStorage | Lưu word list không cần account |
| **Hosting** | Vercel (CDN) | Serve static bundle, HTTPS, global |
| **External** | Google Search | Tra cứu phát âm |

### Đặc điểm kiến trúc

- **Serverless hoàn toàn** — không có backend server riêng, toàn bộ logic chạy ở client
- **Realtime** — Firestore `onSnapshot` tự động sync word list khi có thay đổi
- **Offline-capable** — Guest mode dùng localStorage hoạt động không cần internet
- **Zero-cost** — Vercel free tier + Firebase Spark free tier đủ cho hàng nghìn users
- **Browser-native AI** — Speech Recognition chạy trên Google/Microsoft servers thông qua browser API, không cần tích hợp AI API riêng
