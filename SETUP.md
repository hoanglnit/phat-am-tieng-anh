# 🎤 Hướng Dẫn Cài Đặt & Sử Dụng

> Hướng dẫn từng bước để bất kỳ ai cũng có thể tự cài đặt và chạy ứng dụng **hoàn toàn miễn phí**.  
> Không cần kinh nghiệm lập trình. Chỉ cần làm theo đúng thứ tự.

---

## 📋 Tổng quan

Ứng dụng gồm 3 phần cần cài đặt — tất cả đều **miễn phí mãi mãi**:

| Phần | Dịch vụ | Dùng để làm gì |
|---|---|---|
| **Database & Auth** | Firebase (Google) | Lưu tài khoản & danh sách từ |
| **Hosting** | Vercel | Đưa app lên internet |
| **Source code** | GitHub | Tải code về máy |

**Thời gian ước tính:** 30–45 phút

---

## 🖥️ Yêu cầu máy tính

- Hệ điều hành: **Windows 10/11**, **macOS**, hoặc **Linux**
- Trình duyệt: **Google Chrome** (để test tính năng giọng nói)
- Kết nối internet

---

## PHẦN 1 — Cài đặt công cụ

### Bước 1 — Cài Node.js

Node.js là môi trường chạy JavaScript trên máy tính, cần thiết để build app.

1. Vào **https://nodejs.org**
2. Nhấn nút **"LTS"** (phiên bản ổn định) để tải về
3. Chạy file cài đặt, nhấn **Next** liên tục đến khi xong
4. Mở **Terminal** (macOS/Linux) hoặc **Command Prompt** (Windows) và kiểm tra:

```bash
node --version
```

✅ Nếu thấy `v20.x.x` hoặc cao hơn là thành công.

---

### Bước 2 — Tải source code

**Cách 1: Dùng Git (khuyến nghị)**

```bash
# Cài Git nếu chưa có: https://git-scm.com/downloads
git clone https://github.com/hoanglnit/phat-am-tieng-anh.git
cd phat-am-tieng-anh
```

**Cách 2: Tải file ZIP**

1. Vào **https://github.com/hoanglnit/phat-am-tieng-anh**
2. Nhấn nút xanh **"Code"** → **"Download ZIP"**
3. Giải nén file ZIP
4. Mở Terminal/Command Prompt, `cd` vào thư mục vừa giải nén

---

### Bước 3 — Cài dependencies

```bash
npm install
```

⏳ Chờ khoảng 1–2 phút để tải các thư viện.

---

## PHẦN 2 — Cài đặt Firebase (Database & Tài khoản)

Firebase là dịch vụ của Google, miễn phí cho mức dùng nhỏ.  
Bạn cần tài khoản **Google** để đăng nhập.

---

### Bước 4 — Tạo Firebase Project

1. Vào **https://console.firebase.google.com**
2. Đăng nhập bằng tài khoản Google
3. Nhấn **"Add project"** (hoặc "Thêm dự án")

   ![Nhấn Add project](https://i.imgur.com/placeholder.png)

4. Đặt tên project, ví dụ: `phat-am-tieng-anh`
5. Nhấn **Continue**
6. Tắt **Google Analytics** (không cần thiết) → nhấn **Create project**
7. Chờ khoảng 30 giây → nhấn **Continue**

---

### Bước 5 — Thêm Web App & Lấy Config

1. Trong trang project, nhấn biểu tượng **`</>`** (Web)

   ```
   ← Nút này nằm ở giữa trang, bên cạnh biểu tượng iOS và Android
   ```

2. Đặt tên app: `phat-am-web` → nhấn **Register app**
3. Bạn sẽ thấy đoạn code như thế này — **copy lại toàn bộ phần `firebaseConfig`**:

   ```javascript
   const firebaseConfig = {
     apiKey: "AIzaSy...",
     authDomain: "ten-project.firebaseapp.com",
     projectId: "ten-project",
     storageBucket: "ten-project.appspot.com",
     messagingSenderId: "123456789",
     appId: "1:123456789:web:abcdef"
   };
   ```

4. Nhấn **Continue to console**

---

### Bước 6 — Bật đăng nhập Email/Password

1. Menu bên trái → **Authentication** → nhấn **Get started**
2. Tab **Sign-in method**
3. Tìm dòng **Email/Password** → nhấn để mở
4. Bật **Enable** (gạt sang phải) → nhấn **Save**

✅ Bây giờ người dùng có thể tạo tài khoản bằng email.

---

### Bước 7 — Tạo Firestore Database

Firestore là nơi lưu danh sách từ của từng tài khoản.

1. Menu bên trái → **Firestore Database** → nhấn **Create database**
2. Chọn **"Start in production mode"** → nhấn **Next**
3. Chọn **location**: `asia-southeast1 (Singapore)` — gần Việt Nam nhất → nhấn **Enable**
4. Chờ khoảng 1 phút để khởi tạo

---

### Bước 8 — Thiết lập Security Rules

Rules này đảm bảo mỗi người chỉ đọc được dữ liệu của chính mình.

1. Trong **Firestore Database** → nhấn tab **Rules**
2. **Xóa toàn bộ nội dung** trong ô rules
3. **Dán** đoạn sau vào:

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

4. Nhấn **Publish**

---

## PHẦN 3 — Cấu hình ứng dụng

### Bước 9 — Tạo file cấu hình Firebase

1. Mở thư mục project trong **VS Code** (hoặc bất kỳ text editor nào)
2. Tạo file mới tên **`.env.local`** (chú ý có dấu chấm ở đầu) ở thư mục gốc
3. Dán nội dung sau, **thay thế** các giá trị bằng config của bạn từ Bước 5:

   ```
   VITE_FIREBASE_API_KEY=AIzaSy...
   VITE_FIREBASE_AUTH_DOMAIN=ten-project.firebaseapp.com
   VITE_FIREBASE_PROJECT_ID=ten-project
   VITE_FIREBASE_STORAGE_BUCKET=ten-project.appspot.com
   VITE_FIREBASE_MESSAGING_SENDER_ID=123456789
   VITE_FIREBASE_APP_ID=1:123456789:web:abcdef
   ```

   **Ví dụ thực tế:**
   ```
   VITE_FIREBASE_API_KEY=AIzaSyAg77QavKspq5BuyehQXxp5Jvh3242xhqc
   VITE_FIREBASE_AUTH_DOMAIN=phat-am-tieng-anh-9ead2.firebaseapp.com
   VITE_FIREBASE_PROJECT_ID=phat-am-tieng-anh-9ead2
   VITE_FIREBASE_STORAGE_BUCKET=phat-am-tieng-anh-9ead2.firebasestorage.app
   VITE_FIREBASE_MESSAGING_SENDER_ID=288904887467
   VITE_FIREBASE_APP_ID=1:288904887467:web:b7863948ec38d48224cbee
   ```

4. Lưu file lại

> ⚠️ **Lưu ý bảo mật**: File `.env.local` chứa thông tin nhạy cảm.  
> **Không chia sẻ** file này với ai và **không đưa lên GitHub**.

---

## PHẦN 4 — Chạy ứng dụng

### Bước 10 — Chạy thử trên máy tính

```bash
npm run dev
```

Mở trình duyệt **Chrome** và vào: **http://localhost:5173**

✅ Nếu thấy màn hình đăng nhập với mascot dễ thương là thành công!

**Test thử:**
- Nhấn "Dùng thử không cần đăng nhập" để vào ngay
- Vào "Quản lý từ vựng" → nhấn "Dùng từ mẫu" để thêm 52 từ có sẵn
- Quay lại → nhấn "Bắt đầu luyện tập"
- Nhấn nút 🎤 và đọc to từ hiển thị
- Xem điểm số và nhận xét

> ⚠️ Tính năng nhận dạng giọng nói **chỉ hoạt động trên Chrome hoặc Edge**.  
> Safari (iPhone/Mac) không hỗ trợ.

---

## PHẦN 5 — Đưa lên Internet (Deploy)

Sau bước này, app sẽ có URL riêng để chia sẻ cho bất kỳ ai.

### Bước 11 — Tạo tài khoản Vercel

1. Vào **https://vercel.com**
2. Nhấn **"Sign Up"**
3. Chọn **"Continue with GitHub"** (hoặc email)
4. Xác nhận và hoàn tất đăng ký

---

### Bước 12 — Cài Vercel CLI

```bash
npm install --save-dev vercel
```

---

### Bước 13 — Đăng nhập Vercel

```bash
./node_modules/.bin/vercel login
```

- Chọn **"Continue with GitHub"** (hoặc Email)
- Trình duyệt sẽ mở ra — đăng nhập và xác nhận
- Quay lại terminal, thấy `✓ Logged in` là xong

**Nếu dùng Windows** (Command Prompt):
```
node_modules\.bin\vercel login
```

---

### Bước 14 — Thêm Firebase config lên Vercel

Chạy **từng lệnh** sau, mỗi lần sẽ hỏi bạn nhập giá trị — copy từ file `.env.local` của bạn:

```bash
./node_modules/.bin/vercel env add VITE_FIREBASE_API_KEY production
./node_modules/.bin/vercel env add VITE_FIREBASE_AUTH_DOMAIN production
./node_modules/.bin/vercel env add VITE_FIREBASE_PROJECT_ID production
./node_modules/.bin/vercel env add VITE_FIREBASE_STORAGE_BUCKET production
./node_modules/.bin/vercel env add VITE_FIREBASE_MESSAGING_SENDER_ID production
./node_modules/.bin/vercel env add VITE_FIREBASE_APP_ID production
```

Với mỗi lệnh, terminal sẽ hỏi: `? What's the value of VITE_FIREBASE_API_KEY?`  
→ Paste giá trị tương ứng từ file `.env.local` → Enter

> **Cách khác (dễ hơn):** Sau khi deploy lần đầu, vào **vercel.com** → chọn project → **Settings** → **Environment Variables** → thêm từng biến vào đó.

---

### Bước 15 — Deploy lên Vercel

```bash
./node_modules/.bin/vercel --prod --yes
```

⏳ Chờ khoảng 1–2 phút...

Khi thấy dòng `▲ Aliased https://ten-app.vercel.app` là **deploy thành công**! 🎉

Copy URL đó và chia sẻ cho mọi người.

---

### Bước 16 — Thêm domain vào Firebase (bắt buộc)

Để đăng nhập hoạt động đúng trên URL Vercel:

1. Vào **Firebase Console** → **Authentication** → tab **Settings**
2. Tìm mục **Authorized domains**
3. Nhấn **Add domain**
4. Nhập URL Vercel của bạn, ví dụ: `ten-app.vercel.app`
5. Nhấn **Add**

---

## ✅ Kiểm tra hoàn chỉnh

Sau khi hoàn thành tất cả bước, test lại trên URL Vercel:

- [ ] Trang chủ hiển thị đúng màu sắc
- [ ] Tạo tài khoản mới → vào app thành công
- [ ] Đăng xuất → đăng nhập lại được
- [ ] Thêm từ vựng → lưu và hiển thị đúng
- [ ] Nhấn 🎤 → trình duyệt hỏi quyền microphone → cho phép
- [ ] Đọc từ → nhận được điểm số
- [ ] Test trên điện thoại Android (Chrome) → hoạt động

---

## 🔄 Cập nhật app sau này

Mỗi khi muốn sửa và cập nhật lên internet:

```bash
# Sửa code xong, chạy lệnh này
./node_modules/.bin/vercel --prod --yes
```

---

## ❓ Xử lý lỗi thường gặp

### Lỗi: `npm install` báo lỗi permission (macOS)

```bash
npm config set cache ~/.npm-cache
npm install
```

### Lỗi: Không nghe được giọng nói

- Đảm bảo đang dùng **Chrome** hoặc **Edge** (không phải Safari hay Firefox)
- Vào **chrome://settings/content/microphone** → cho phép trang web truy cập mic
- Thử tải lại trang (F5)

### Lỗi: Đăng nhập không được sau khi deploy

- Kiểm tra đã thêm domain Vercel vào **Firebase → Authentication → Authorized domains** chưa (Bước 16)

### Lỗi: `VITE_FIREBASE_*` undefined

- Kiểm tra file `.env.local` đặt đúng thư mục gốc (cùng cấp với `package.json`)
- Tên biến phải bắt đầu bằng `VITE_`
- Restart server: tắt terminal, chạy lại `npm run dev`

### Lỗi: Firestore permission denied

- Kiểm tra đã publish **Security Rules** ở Bước 8 chưa
- Đăng xuất app → đăng nhập lại

### Lỗi deploy Vercel: build failed

```bash
# Thử build local trước để xem lỗi
npm run build
```

---

## 💰 Chi phí

| Dịch vụ | Gói miễn phí | Giới hạn |
|---|---|---|
| **Firebase Auth** | Spark (Free) | 50,000 tài khoản/tháng |
| **Firestore** | Spark (Free) | 1 GB lưu trữ, 50K đọc/ngày |
| **Vercel** | Hobby (Free) | Băng thông không giới hạn |
| **GitHub** | Free | Repo public không giới hạn |

→ **Đủ dùng cho hàng nghìn học sinh mà không tốn 1 đồng.**

Nếu sau này cần mở rộng (hàng chục nghìn người dùng), Firebase Blaze ~$25/tháng, Vercel Pro ~$20/tháng.

---

## 📞 Hỗ trợ

Nếu gặp vấn đề không tự giải quyết được:

1. Mở **Issues** trên GitHub: https://github.com/hoanglnit/phat-am-tieng-anh/issues
2. Mô tả lỗi + chụp màn hình terminal
3. Ghi rõ bạn đang ở bước nào
