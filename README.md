# HUIT Social Credits

Hệ thống quản lý điểm công tác xã hội tại Trường Đại học Công Thương TP.HCM (HUIT).

## Tính năng nổi bật

- **Quản lý sinh viên**: Theo dõi thông tin, điểm công tác xã hội.
- **Quản lý hoạt động**: Tạo và quản lý các hoạt động, sự kiện.
- **Phản hồi sinh viên**: Phản hồi điểm khi có sai sót.
- **Thông báo nhắc nhở**: Gửi thông báo nhắc nhở cho sinh viên.
- **Điểm danh tự động**: Điểm danh tự động bằng nhận diện khuôn mặt.
- **Báo cáo & Thống kê**: Xuất báo cáo PDF/Excel và biểu đồ thống kê.
- **Hội đồng xét điểm**: Thành lập hội đồng xét điểm CTXH cho sinh viên.
- **Progressive Web App (PWA)**: Hỗ trợ cài đặt ứng dụng trên thiết bị.

## Công nghệ sử dụng

### Frontend (Client)

- **Core**: ReactJS 18 + Vite 7
- **UI Library**: Ant Design 5, Material UI (MUI) 7
- **State Management**: Zustand, TanStack Query
- **Styling**: SCSS (sass-embedded)
- **Icons**: Lucide React, Font Awesome
- **Rich Text Editor**: React Quill
- **Utilities**: Axios, Recharts, face-api.js, React Webcam, Swiper, DOMPurify
- **PWA**: vite-plugin-pwa

### Backend (Server)

- **Runtime**: Node.js
- **Framework**: Express 5
- **Database**: PostgreSQL (via Prisma ORM)
- **Storage & Auth**: Supabase
- **Authentication**: JWT (JSON Web Token), bcrypt
- **Security**: Helmet, express-rate-limit, sanitize-html
- **Validation**: Yup
- **Email**: Nodemailer
- **Export**: PDFKit (PDF), xlsx (Excel)
- **Testing**: Jest, Supertest

## Cài đặt và Chạy dự án

### Yêu cầu tiên quyết

- Node.js (v18 trở lên)
- npm hoặc yarn
- PostgreSQL (hoặc sử dụng Supabase Database)

### 1. Clone dự án

```bash
git clone https://github.com/hdhq1504/HUIT-Social-Credits.git
cd HUIT-Social-Credits
```

### 2. Cài đặt dependencies

**Frontend:**

```bash
cd client
npm install
```

**Backend:**

```bash
cd server
npm install
```

### 3. Cấu hình biến môi trường

Tạo file `.env` trong thư mục `client` và `server` với các thông tin cấu hình cần thiết.

**Client (`client/.env`):**

```env
VITE_API_URL=http://localhost:8080/api
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

**Server (`server/.env`):**

```env
PORT=8080
DATABASE_URL="postgresql://user:password@host:port/dbname?schema=public"

# JWT
JWT_ACCESS_SECRET=your_access_secret
JWT_REFRESH_SECRET=your_refresh_secret

# Supabase
SUPABASE_URL=your_supabase_url
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
SUPABASE_PUBLIC_URL=your_supabase_public_url

# Email (SMTP)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your_email@gmail.com
SMTP_PASS=your_app_password
```

### 4. Chạy dự án

**Backend:**

```bash
cd server
npx prisma generate
npx prisma migrate deploy # Chạy nếu cần migrate DB
npm run dev
```

**Frontend:**

```bash
cd client
npm run dev
```

Truy cập `http://localhost:5173` để xem ứng dụng.

### 5. Chạy Tests (Optional)

```bash
cd server
npm run test           # Chạy tất cả tests
npm run test:watch     # Chạy tests ở chế độ watch
npm run test:coverage  # Chạy tests với coverage report
```

## 📂 Cấu trúc dự án

```
HUIT-Social-Credits/
├── client/                 # Source code Frontend
│   ├── src/
│   │   ├── admin/          # Trang và component dành cho Admin
│   │   ├── api/            # Định nghĩa các API calls
│   │   ├── assets/         # Tài nguyên tĩnh (ảnh, icon...)
│   │   ├── components/     # Component tái sử dụng chung
│   │   ├── config/         # Cấu hình (Supabase, theme...)
│   │   ├── context/        # React Context (AuthContext...)
│   │   ├── hooks/          # Custom React Hooks
│   │   ├── layouts/        # Layout chính của ứng dụng
│   │   ├── pages/          # Trang dùng chung
│   │   ├── routes/         # Cấu hình routing
│   │   ├── services/       # Các service phức tạp (FaceAPI, Upload...)
│   │   ├── stores/         # State management (Zustand)
│   │   ├── teacher/        # Trang và component dành cho Giảng viên
│   │   ├── user/           # Trang và component dành cho Sinh viên
│   │   └── utils/          # Các hàm tiện ích
├── server/                 # Source code Backend
│   ├── prisma/             # Prisma schema và migrations
│   ├── src/
│   │   ├── assets/         # Tài nguyên tĩnh (fonts, templates...)
│   │   ├── controllers/    # Logic xử lý request
│   │   ├── middlewares/    # Middleware (Auth, Upload, Error...)
│   │   ├── routes/         # Định nghĩa API routes
│   │   ├── seed/           # Script tạo dữ liệu mẫu
│   │   ├── tests/          # Unit tests và integration tests
│   │   ├── utils/          # Các hàm tiện ích
│   │   ├── env.js          # Kiểm tra biến môi trường
│   │   └── prisma.js       # Prisma client instance
└── README.md
```
