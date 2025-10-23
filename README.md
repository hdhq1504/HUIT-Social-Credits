# HUIT Social Credits

### Bước 1 — Clone
```bash
git clone https://github.com/hdhq1504/HUIT-Social-Credits.git
cd HUIT-Social-Credits
```

### Bước 2 — Cài đặt package

```bash
# FE
cd client
npm i

#BE
cd server
npm i
```

### Bước 3 — Chạy dev

```bash
# Backend
cd server
npx prisma generate
npm run dev

# Frontend (cổng mặc định Vite 5173)
cd client
npm run build
npm run dev
```
