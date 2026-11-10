# 🎓 Takluk (RuangKuliah Hub) — Backend API

Backend API untuk aplikasi EdTech **Takluk (RuangKuliah Hub)**: platform *micro-learning* (video 5–10 menit), bedah arsip soal ujian lokal, dan bimbingan belajar terpadu untuk mahasiswa di kawasan Panam, Pekanbaru (Universitas Riau, UIN Suska Riau, Politeknik Caltex Riau, Universitas Islam Riau).

Dibangun dengan arsitektur **Feature-First Modular Monolith** menggunakan performa tinggi dari **Bun**, framework **Hono.js**, **Drizzle ORM**, dan **PostgreSQL (Supabase)**.

---

## 🌟 Fitur Utama & Prinsip Arsitektur

- **🛡️ Anti-Pembajakan Konten (Single Device Binding):**
  Setiap akun mahasiswa hanya dapat aktif pada **1 perangkat fisik** sekaligus via header `X-Device-ID`. Jika perangkat tidak cocok, request langsung ditolak dengan HTTP `403 DEVICE_MISMATCH`. Prosedur pergantian HP dilindungi verifikasi OTP email.
- **🔒 Signed HLS Video Stream:**
  Video disimpan secara aman di Cloudflare Stream tanpa mempublikasikan URL video asli. API hanya menerbitkan token URL bertanda tangan kriptografis (*HMAC SHA-256 Signed HLS URL* `.m3u8`) dengan masa kedaluwarsa 2 jam khusus untuk pengguna berlangganan aktif (`is_free = false` dicek via `subscription_valid_until`).
- **💳 Transaksi Keuangan ACID (Midtrans Dynamic QRIS):**
  Integrasi pembayaran QRIS langganan Rp25.000/bulan dengan validasi kuota & diskon voucher promo (`PANAM10`, `UINSUSKA`). Pemrosesan webhook Midtrans tervalidasi tanda tangan SHA-512 dan dieksekusi secara atomik (`db.transaction`) untuk mencegah *double claim*.
- **📊 Poling Status & Riwayat Pembayaran:**
  Endpoint polling ringan untuk aplikasi mobile (Flutter) guna mengecek status transaksi seketika saat pembayaran QRIS berhasil.
- **⏱️ Sinkronisasi Detik Tonton & Pool Royalti Tutor:**
  Endpoint heartbeat 30 detik untuk mencatat progres belajar (`INSERT ... ON CONFLICT DO UPDATE`), kalkulasi otomatis kelulusan materi ($\ge 85\%$ durasi), serta laporan bagi hasil bulanan *Pool Royalti Tutor Sebaya* (Rp3.500.000) berdasarkan total menit tontonan.
- **📚 Bank Arsip Soal Ujian Lokal:**
  Bank soal UTS/UAS bertarget kampus lokal dengan formula matematika format LaTeX Markdown (`$...$`), kunci jawaban berbobot, pembahasan detail langkah demi langkah, dan video rekomendasi.
- **🏢 Layanan Offline Panam Academy Hub (O2O):**
  Katalog layanan fisik (Crash Course H-7 Ujian, Bootcamp Olah Data Skripsi, Quiet Study Space) dan reservasi online langsung dari aplikasi.
- **📖 Dokumentasi Swagger Interaktif Berdesain Kustom:**
  Swagger UI interaktif bawaan di rute `/docs` dengan palet warna resmi Takluk (Deep Violet `#462B92` & Radiant Gold `#F89C05`).

---

## 🛠️ Tech Stack

| Komponen | Teknologi |
| :--- | :--- |
| **Runtime** | [Bun](https://bun.sh/) (v1.2+) |
| **Web Framework** | [Hono.js](https://hono.dev/) v4 (TypeScript) |
| **Database & ORM** | PostgreSQL ([Supabase](https://supabase.com/)) & [Drizzle ORM](https://orm.drizzle.team/) |
| **Data Validation** | [Zod](https://zod.dev/) & `@hono/zod-validator` |
| **Payment Gateway** | [Midtrans](https://midtrans.com/) (Dynamic QRIS / Core API) |
| **Email Service** | [Resend](https://resend.com/) (Email OTP Transactional) |
| **Video Infrastructure** | [Cloudflare Stream](https://www.cloudflare.com/products/cloudflare-stream/) (HLS Signed URL) |
| **Documentation** | OpenAPI 3.0.3 & Custom Swagger UI |

---

## 📁 Struktur Direktori

Struktur project menggunakan pola **Feature-First Monolith** yang modular, rapi, dan minim kopling antar domain bisnis:

```text
takluk_be/
├── docs/                       # Dokumentasi spesifikasi arsitektur & PRD
│   ├── PRD.md                  # Product Requirements Document
│   ├── SCHEMA.md               # Definisi Skema Database PostgreSQL
│   ├── ARCHITECTURE.md         # Blueprint Arsitektur & Kontrak API
│   ├── DESIGN.md               # Takluk Design System & Aturan Konten
│   └── TASK.md                 # Status Audit & Roadmap Implementasi
├── src/
│   ├── config/
│   │   └── env.ts              # Validasi Zod Environment Variables
│   ├── db/
│   │   ├── index.ts            # Pool Koneksi Postgres & Drizzle Client
│   │   ├── schema.ts           # Skema 10 Tabel & 5 ENUM Relasional
│   │   ├── seed.ts             # Seeder Data Matkul, Tutor, Video, Voucher, & Soal
│   │   └── migrations/         # File SQL Migrasi Resmi Drizzle Kit
│   ├── docs/
│   │   ├── index.ts            # Hono Route untuk /docs & /swagger
│   │   ├── openapi.ts          # OpenAPI 3.0.3 Full Specification
│   │   └── swagger-ui.ts       # HTML UI Swagger bertema Takluk (Ungu-Oranye)
│   ├── middlewares/
│   │   ├── auth.middleware.ts   # Verifikasi Bearer Token JWT (7 hari)
│   │   ├── device.middleware.ts # Enforce Single Device Binding (X-Device-ID)
│   │   └── error.middleware.ts  # Global Error Handler seragam
│   ├── modules/
│   │   ├── admin/              # Laporan Royalti Tutor Bulanan
│   │   ├── archives/           # Arsip Soal Ujian UTS/UAS & Evaluasi Kuis
│   │   ├── auth/               # Request & Verify Email OTP + Device Binding
│   │   ├── courses/            # Katalog Matkul & Player Signed HLS URL
│   │   ├── hub/                # Layanan Fisik Panam Academy Hub (O2O)
│   │   ├── payments/           # Dynamic QRIS, Webhook Lunas, Polling & Riwayat
│   │   ├── profile/            # Profil User, Reset HP, & Referral Program
│   │   └── progress/           # Sync Riwayat Tontonan & Bookmark
│   ├── utils/
│   │   ├── api-response.ts     # Helper JSON Response Sukses/Gagal
│   │   ├── cloudflare.ts       # HMAC SHA-256 Cloudflare Stream Signed URL
│   │   ├── jwt.ts              # Generator & Verifier JWT Token (HS256)
│   │   └── otp.ts              # Generator OTP 6 Digit & Template HTML Email
│   └── index.ts                # Server Entry Point Hono (CORS, Logger, Routes)
├── .env.example                # Template Variabel Lingkungan
├── drizzle.config.ts           # Konfigurasi Drizzle Kit
├── package.json
└── tsconfig.json
```

---

## ⚙️ Persyaratan Sistem & Instalasi

Pastikan runtime **Bun** telah terpasang di komputer kamu ([Panduan Instalasi Bun](https://bun.sh/docs/installation)).

### 1. Kloning & Masuk ke Folder Project

```powershell
cd "d:\semester 7\Takluk\takluk_be"
```

### 2. Install Seluruh Dependensi

```powershell
bun install
```

### 3. Konfigurasi Lingkungan (`.env`)

Salin file `.env.example` menjadi `.env`:

```powershell
cp .env.example .env
```

Sesuaikan nilai variabel lingkungan di dalam file `.env`:

```env
# Server
PORT=3000
NODE_ENV=development
JWT_SECRET=rahasia_jwt_takluk_panam_2026_super_aman_minimal_32_karakter

# Database (Supabase / Local PostgreSQL)
DATABASE_URL=postgresql://postgres:[PASSWORD]@db.[PROJECT_REF].supabase.co:5432/postgres

# Email OTP Service (Resend)
RESEND_API_KEY=re_xxxxxxxxxxxxxxxxxxxxxxxxxxxx
EMAIL_FROM=Takluk RuangKuliah <auth@takluk.dev>

# Payment Gateway (Midtrans Sandbox / Production)
MIDTRANS_SERVER_KEY=SB-Mid-server-xxxxxxxxxxxxxxxxxxxx
MIDTRANS_CLIENT_KEY=SB-Mid-client-xxxxxxxxxxxxxxxxxxxx
MIDTRANS_IS_PRODUCTION=false
MIDTRANS_WEBHOOK_SECRET=token_verifikasi_webhook_anda

# Cloudflare Stream
CF_ACCOUNT_ID=id_akun_cloudflare
CF_API_TOKEN=token_api_cloudflare
CF_STREAM_SIGNING_KEY_ID=key_id_cloudflare
CF_STREAM_SIGNING_KEY_JWK=base64_jwk_cloudflare_signing_key
```

> **💡 Catatan Mode Development:**
> Di lingkungan lokal (`NODE_ENV=development`), jika API key eksternal belum diisi, sistem menyediakan *fallback* otomatis: OTP dummy `123456`, token mock pembayaran QRIS, dan signed URL tiruan tanpa memblokir alur pengujian.

---

## 🗄️ Database: Migrasi & Seeding

### Jalankan Migrasi Database

Untuk menerapkan tabel dan relasi skema ke instance PostgreSQL:

```powershell
# Menjalankan file migrasi SQL fisik
bun run db:migrate
```

*(Opsional: Jika ada modifikasi pada `src/db/schema.ts`, buat file migrasi baru menggunakan: `bun run db:generate`)*

### Menanam Data Dummy Awal (*Seeding*)

Menanam 3 mata kuliah (Kalkulus, Statistika, Pemrograman), akun demo Aisyah Putri, profil tutor Rizki Pratama, 9 modul video (1 gratis per matkul), bab materi, voucher promo `PANAM10` & `UINSUSKA`, serta bank soal arsip ujian:

```powershell
bun run db:seed
```

### Membuka Drizzle Studio (Database GUI)

Untuk melihat dan mengelola isi tabel secara visual di browser:

```powershell
bun run db:studio
```

---

## 🚀 Menjalankan Server

### Mode Development (Hot Reload)

```powershell
bun dev
```

### Mode Production

```powershell
bun start
```

Server akan aktif di:
- **API Base URL**: `http://localhost:3000`
- **Swagger Documentation**: `http://localhost:3000/docs` *(atau `http://localhost:3000/swagger`)*
- **OpenAPI 3.0.3 JSON**: `http://localhost:3000/openapi.json`

---

## 📋 Daftar Rute & Endpoint API

Semua respons API mengikuti standar kontrak seragam:
- **Format Sukses:** `{ "success": true, "message": "...", "data": { ... } }`
- **Format Gagal:** `{ "success": false, "error_code": "...", "message": "..." }`

### 1. Autentikasi (`/api/auth`)
| Method | Endpoint | Auth | Deskripsi |
| :--- | :--- | :---: | :--- |
| `POST` | `/api/auth/request-otp` | Publik | Kirim 6 digit OTP ke email mahasiswa (cooldown 60 detik) |
| `POST` | `/api/auth/verify-otp` | Publik | Verifikasi OTP (maks. 5x), daftar/update profil, bind device, terbitkan JWT |

### 2. Profil & Perangkat (`/api/profile`)
| Method | Endpoint | Auth | Deskripsi |
| :--- | :--- | :---: | :--- |
| `GET` | `/api/profile/me` | JWT + Device | Ambil data profil, sisa hari langganan, dan status kartu akun |
| `PATCH` | `/api/profile/me` | JWT + Device | Update WhatsApp, semester aktif, dan program studi |
| `GET` | `/api/profile/device` | JWT + Device | Status perangkat terikat saat ini (*Single Device Binding*) |
| `POST` | `/api/profile/device/reset` | JWT | Minta OTP konfirmasi / selesaikan alur perpindahan perangkat fisik |
| `GET` | `/api/profile/referral` | JWT + Device | Statistik kode referral mahasiswa dan reward bonus hari langganan |

### 3. Mata Kuliah & Video (`/api/courses`)
| Method | Endpoint | Auth | Deskripsi |
| :--- | :--- | :---: | :--- |
| `GET` | `/api/courses` | Publik | Katalog seluruh mata kuliah aktif diurutkan berurutan |
| `GET` | `/api/courses/videos` | Publik | Filter video berdasarkan `course_id`, `category` (MATERI/UTS/UAS), & kampus |
| `GET` | `/api/courses/videos/:id/play` | JWT + Device | Signed HLS URL (.m3u8), chapters, & rumus LaTeX (402 jika terkunci) |

### 4. Progres Belajar & Royalti (`/api/progress`)
| Method | Endpoint | Auth | Deskripsi |
| :--- | :--- | :---: | :--- |
| `POST` | `/api/progress/sync` | JWT + Device | Heartbeat 30 detik: posisi tonton, akumulasi durasi, status selesai ($\ge 85\%$) |
| `GET` | `/api/progress/resume` | JWT + Device | 5 video terakhir belum selesai untuk widget *"Lanjut Menonton"* |
| `GET` | `/api/progress/bookmarks` | JWT + Device | Daftar seluruh video yang dibookmark oleh mahasiswa |

### 5. Bank Arsip Soal Ujian (`/api/archives`)
| Method | Endpoint | Auth | Deskripsi |
| :--- | :--- | :---: | :--- |
| `GET` | `/api/archives` | Publik | Bank latihan soal arsip UTS/UAS kampus lokal (UNRI/UIN/PCR/UIR) |
| `POST` | `/api/archives/:id/evaluate` | Publik | Evaluasi jawaban pilihan ganda, pembahasan detail, & link video terkait |

### 6. Pembayaran QRIS & Langganan (`/api/payments`)
| Method | Endpoint | Auth | Deskripsi |
| :--- | :--- | :---: | :--- |
| `POST` | `/api/payments/qris` | JWT + Device | Checkout QRIS Midtrans Rp25.000 dengan validasi kuota voucher diskon |
| `GET` | `/api/payments/history` | JWT + Device | Riwayat transaksi pembayaran langganan mahasiswa |
| `GET` | `/api/payments/:invoice_number/status` | JWT + Device | Endpoint polling ringan aplikasi Flutter untuk status invoice |
| `POST` | `/api/payments/webhook` | Publik | Webhook verifikasi signature SHA-512 Midtrans & perpanjang langganan 30 hari |

### 7. Laporan Royalti Tutor (`/api/admin`)
| Method | Endpoint | Auth | Deskripsi |
| :--- | :--- | :---: | :--- |
| `GET` | `/api/admin/royalties/monthly` | Admin | Laporan bagi hasil proporsional dari Pool Royalti Rp3,5 Juta per bulan |

### 8. Panam Academy Hub O2O (`/api/hub`)
| Method | Endpoint | Auth | Deskripsi |
| :--- | :--- | :---: | :--- |
| `GET` | `/api/hub/services` | Publik | Katalog layanan fisik: Crash Course H-7, Bootcamp Skripsi, Quiet Study Space |
| `POST` | `/api/hub/book` | Publik | Form pemesanan tiket kelas / ruang belajar offline Panam Hub |

---

## 🧪 Skenario Pengujian Cepat (cURL)

### 1. Request OTP (Pengembangan)
```bash
curl -X POST http://localhost:3000/api/auth/request-otp \
  -H "Content-Type: application/json" \
  -d '{"email": "aisyah@takluk.dev"}'
```

### 2. Verifikasi OTP & Binding Perangkat
```bash
curl -X POST http://localhost:3000/api/auth/verify-otp \
  -H "Content-Type: application/json" \
  -d '{
    "email": "aisyah@takluk.dev",
    "otp_code": "123456",
    "device_id": "demo-device-samsung-01"
  }'
```

### 3. Akses Endpoint Terproteksi
Gunakan token JWT yang diperoleh dari response verifikasi OTP:
```bash
curl -X GET http://localhost:3000/api/profile/me \
  -H "Authorization: Bearer <TOKEN_JWT_KAMU>" \
  -H "X-Device-ID: demo-device-samsung-01"
```

---

## 📄 Lisensi

Hak Cipta © 2026 **Takluk (RuangKuliah Hub)**. Seluruh hak cipta dilindungi undang-undang.
