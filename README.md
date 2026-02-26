# سامانه مدیریت پایانه بار اشتهارد

## راه‌اندازی سریع

### پیش‌نیازها
- Docker + Docker Compose
- Node.js 20+ (برای توسعه محلی)

### با Docker

```bash
# کپی فایل تنظیمات
cp backend/.env.example backend/.env
# ویرایش backend/.env و تنظیم کلیدها

docker-compose up -d
# مایگریشن دیتابیس
docker-compose exec backend npx prisma migrate dev
# سیدینگ داده‌های اولیه
docker-compose exec backend npm run db:seed
```

برنامه در آدرس‌های زیر قابل دسترس است:
- Frontend: http://localhost:3000
- Backend API: http://localhost:4000/api/v1
- Health check: http://localhost:4000/api/v1/health

### توسعه محلی

**Backend:**
```bash
cd backend
npm install
cp .env.example .env
# تنظیم DATABASE_URL در .env
npx prisma migrate dev
npm run db:seed
npm run dev
```

**Frontend:**
```bash
cd frontend
npm install
npm run dev
```

## حساب‌های آزمایشی (بعد از seed)

| شماره | نقش |
|---|---|
| 09000000000 | مدیر پایانه |
| 09111111111 | شرکت باربری |
| 09222222222 | تولیدکننده |
| 09333333333 | راننده |

> در محیط development کد OTP در console سرور چاپ می‌شود.

## ساختار پروژه

```
eshtehard/
├── backend/          # Node.js + Express + Prisma
│   ├── prisma/       # Schema + Migrations + Seed
│   └── src/
│       ├── config/   # env, database, sms
│       ├── middleware/
│       └── modules/  # auth, cargo, halls, appointments, ...
├── frontend/         # React + Vite + MUI RTL
│   └── src/
│       ├── pages/    # driver/, freight/, producer/, terminal/
│       ├── components/
│       ├── services/ # Axios API services
│       └── store/    # Redux auth slice
└── docker-compose.yml
```

## API Endpoints (prefix: `/api/v1`)

| Module | Endpoints |
|---|---|
| Auth | `POST /auth/send-otp`, `/auth/verify-otp`, `/auth/refresh`, `/auth/logout` |
| Cargo | `GET/POST /cargo`, `PUT /cargo/:id/submit`, `/accept`, `/set-fare`, `/cancel` |
| Bulk | `POST /cargo/bulk` (Excel upload) |
| Halls | `GET/POST/PUT/DELETE /halls` |
| Terminals | `GET/POST/PUT /terminals` |
| Announcements | `GET/POST /announcements`, `PUT /:id/suspend`, `/:id/resume` |
| Appointments | `GET/POST /appointments`, `PUT /:id/status` |
| Waybills | `GET/POST /waybills`, `GET /:id/pdf` |
| Drivers | `GET/POST/PUT /drivers` |
| Fleet | `GET/POST/PUT/DELETE /fleet` |
| Reports | `GET /reports/dashboard`, `/cargo-summary`, `/driver-performance`, `/hall-activity` |
| Tickets | `GET/POST /tickets`, `POST /:id/messages`, `PUT /:id/status` |
| Users | `GET /users`, `GET/PUT /users/:id`, `GET/PUT /users/me` |
