# TASK.md — Status Implementasi & Roadmap API Takluk (RuangKuliah Hub)

Dokumen ini menyajikan audit komprehensif status implementasi Backend API **Takluk** berdasarkan 4 dokumen spesifikasi utama:
1. `PRD.md` (Product Requirements Document v1.1)
2. `SCHEMA.md` (Database Blueprint PostgreSQL & Drizzle ORM)
3. `ARCHITECTURE.md` (Arsitektur Sistem & Kontrak API)
4. `DESIGN.md` (Takluk Design System & Aturan Konten)

---

## 📊 Ringkasan Eksekutif (Progress Overview)

| Area / Modul | Total Fitur / API | Status Selesai | Status Tertunda | Persentase |
| :--- | :---: | :---: | :---: | :---: |
| **1. Core Configuration & Database** | 6 | 6 | 0 | **100%** |
| **2. Middlewares Penjaga Gerbang** | 3 | 3 | 0 | **100%** |
| **3. Modul Autentikasi (`auth`)** | 2 | 2 | 0 | **100%** |
| **4. Modul Video & Materi (`courses`)** | 3 | 3 | 0 | **100%** |
| **5. Modul Progres & Royalti (`progress`)** | 3 | 3 | 0 | **100%** |
| **6. Modul Arsip Soal & Kuis (`archives`)** | 2 | 2 | 0 | **100%** |
| **7. Modul Pembayaran QRIS (`payments`)** | 4 | 4 | 0 | **100%** |
| **8. Dokumentasi Swagger / OpenAPI** | 3 | 3 | 0 | **100%** |
| **9. Modul Profil & Perangkat (`profile`)** | 5 | 5 | 0 | **100%** |
| **10. Modul Admin & Royalti Tutor (`admin`)** | 1 | 1 | 0 | **100%** |
| **11. Modul Panam Academy Hub (`hub`)** | 2 | 2 | 0 | **100%** |
| **12. Migrasi Fisik & Database Setup** | 2 | 1 | 1 | **50%** |
| **TOTAL KESELURUHAN (MVP Core)** | **36** | **35** | **1** | **97.2%** |

---

## ✅ BAGIAN A: FITUR & API YANG SUDAH SELESAI (COMPLETED)

Seluruh komponen pada bagian ini telah diimplementasikan secara penuh (*production-ready*), tervalidasi dengan Zod, *type-safe*, bebas dari komentar `// TODO`, dan mengikuti aturan emas database serta kontrak API JSON seragam.

### 1. Inisialisasi & Konfigurasi Core
- [x] **Validasi Environment Variables (`src/config/env.ts`):** Menggunakan Zod untuk memvalidasi `PORT`, `NODE_ENV`, `JWT_SECRET`, `DATABASE_URL`, `RESEND_API_KEY`, `MIDTRANS_*`, dan `CF_*` dengan nilai *fallback* aman untuk mode *development*.
- [x] **Template Environment (`.env.example` & `.env`):** Setup konfigurasi siap pakai untuk integrasi PostgreSQL (Supabase), Resend Email, Midtrans Sandbox, dan Cloudflare Stream.
- [x] **Koneksi Database Postgres (`src/db/index.ts`):** Menggunakan *driver* `postgres` dengan *connection pooling* (max 10 koneksi, idle timeout 20 detik) terintegrasi ke Drizzle ORM.
- [x] **Skema Database Relasional (`src/db/schema.ts`):** Salinan 100% presisi sesuai `SCHEMA.md` (10 tabel, 5 ENUM, UUID v4 primary keys, TIMESTAMPTZ, nilai uang & detik berbasis `INTEGER`, larangan *hard-delete*).
- [x] **File Migrasi SQL Fisik Drizzle (`src/db/migrations/0000_old_umar.sql`):** Berhasil di-generate via `bun run db:generate` mencakup 10 tabel dan indeks.
- [x] **Seeder Data Dummy (`src/db/seed.ts`):** Menanam 3 mata kuliah (Kalkulus `∫`, Statistika `σ`, Pemrograman `</>`), 2 voucher promo (`PANAM10` diskon Rp10.000 & `UINSUSKA` diskon Rp5.000), user demo Aisyah Putri, profil tutor Rizki Pratama, 9 video *micro-learning* (1 gratis per matkul), bab materi, bank soal arsip, dan OTP dummy `123456` untuk testing.
- [x] **Standarisasi Kontrak Respons API (`src/utils/api-response.ts`):** Helper seragam untuk format respons sukses `{ success: true, message, data }` dan format error `{ success: false, error_code, message }`.

### 2. Middlewares Penjaga Gerbang
- [x] **Global Error Handler (`src/middlewares/error.middleware.ts`):** Menangkap `HTTPException`, `ZodError`, dan error tak terduga, mengubahnya menjadi respons JSON berstandar dengan kode status HTTP yang tepat (400, 401, 402, 403, 404, 422, 500) dan pesan ramah berbahasa Indonesia dengan kata ganti "kamu".
- [x] **Otentikasi JWT Bearer (`src/middlewares/auth.middleware.ts`):** Memverifikasi header `Authorization: Bearer <TOKEN>`, mengecek masa kedaluwarsa 7 hari, dan menginjeksi `jwtPayload` ke context Hono.
- [x] **Single Device Binding Guard (`src/middlewares/device.middleware.ts`):** Mengecek header `X-Device-ID` terhadap kolom `users.active_device_id` di database. Jika berbeda, request langsung ditolak dengan HTTP `403` dan `error_code: "DEVICE_MISMATCH"` untuk mencegah pembajakan akun kelas.

### 3. Modul Autentikasi (`src/modules/auth/`)
- [x] **`POST /api/auth/request-otp`:**
  - Generate kode OTP 6-digit dengan masa aktif 5 menit (`email_otps`).
  - Rate limiting jeda 60 detik antar request untuk mencegah spam.
  - Template email HTML responsif bermerek Takluk (ungu `#462B92` dan oranye `#F89C05`).
  - Integrasi Resend Email API + Fallback OTP dummy `123456` di lingkungan development.
- [x] **`POST /api/auth/verify-otp`:**
  - Verifikasi kode OTP dengan toleransi maksimal 5 kali percobaan salah.
  - Pendaftaran otomatis user baru (wajib Nama & NIM, otomatis terbitkan `referral_code`).
  - Pembaruan profil mahasiswa lama.
  - Penimpaan *atomic* `active_device_id` dan `device_updated_at` (*Single Device Binding*).
  - Penerbitan JWT Token berlaku 7 hari.

### 4. Modul Profil & Manajemen Sesi Perangkat (`src/modules/profile/`)
- [x] **`GET /api/profile/me`:**
  - Mengambil data profil lengkap (Nama, NIM, Email, Kampus, Semester, WhatsApp, Kode Referral).
  - Menghitung sisa hari langganan aktif (`subscription_valid_until - NOW()`) dan status kartu langganan di Beranda.
- [x] **`PATCH /api/profile/me`:**
  - Memperbarui data profil yang diizinkan (Nomor HP/WA untuk koordinasi kelas, Semester aktif, Program Studi).
- [x] **`GET /api/profile/device`:**
  - Menampilkan informasi perangkat aktif saat ini (`active_device_id`) dan tanggal ganti HP terakhir.
- [x] **`POST /api/profile/device/reset`:**
  - Prosedur penggantian perangkat fisik aman: kirim OTP ke email jika belum ada kode, lalu perbarui `active_device_id` baru saat OTP divalidasi.
- [x] **`GET /api/profile/referral`:**
  - Menampilkan kode referral mahasiswa, teks ajakan untuk share, jumlah teman yang diajak, dan akumulasi bonus hari langganan gratis (+7 hari/teman).

### 5. Modul Mata Kuliah & Video Player (`src/modules/courses/`)
- [x] **`GET /api/courses`:** Menampilkan katalog seluruh mata kuliah aktif (`is_published = true`) diurutkan berdasarkan `sort_order`.
- [x] **`GET /api/courses/videos`:** Filter modul video berdasarkan `course_id`, `category` (`MATERI`/`UTS`/`UAS`), dan tag kampus lokal `university_tag` (`UNRI`/`UIN_SUSKA`/`PCR`/`UIR`).
- [x] **`GET /api/courses/videos/:id/play`:**
  - Proteksi middleware `auth` dan `device` (*Single Device Binding*).
  - Pengecekan status video: jika `is_free = false`, sistem memverifikasi `subscription_valid_until > NOW()`.
  - Mengembalikan HTTP `402 PAYMENT_REQUIRED` jika akun belum berlangganan.
  - Generator *Cloudflare Stream Signed HLS URL* (`.m3u8`) berlaku 2 jam.
  - Mengembalikan daftar bab (`video_chapters`) dan catatan ringkasan rumus berformat LaTeX Markdown (`summary_markdown`).

### 6. Modul Progres & Royalti Tutor Sebaya (`src/modules/progress/`)
- [x] **`POST /api/progress/sync`:**
  - Endpoint *heartbeat* 30 detik untuk sinkronisasi posisi detik terakhir (`last_position_sec`).
  - Operasi *atomic* `INSERT ... ON CONFLICT (user_id, video_id) DO UPDATE` pada tabel `watch_histories`.
  - Akumulasi total detik tontonan (`total_watched_sec`) untuk royalti tutor.
  - Kalkulasi otomatis status selesai (`is_completed = true`) jika tontonan $\ge 85\%$ durasi video.
  - Toggle status *Bookmark* video.
- [x] **`GET /api/progress/resume`:** Mengambil 5 video terakhir yang belum selesai ditonton untuk widget Beranda *"Lanjut Menonton"*.
- [x] **`GET /api/progress/bookmarks`:** Mengambil daftar video yang disimpan oleh mahasiswa pada tab *"Tersimpan"*.

### 7. Modul Bank Arsip Soal Ujian (`src/modules/archives/`)
- [x] **`GET /api/archives`:** Mengambil daftar bank arsip soal UTS/UAS kampus lokal (UNRI, UIN Suska, PCR, UIR) dengan opsi pilihan ganda berformat LaTeX `$...$`.
- [x] **`POST /api/archives/:id/evaluate`:**
  - Mengevaluasi pilihan jawaban mahasiswa (`A`, `B`, `C`, atau `D`).
  - Mengembalikan status kebenaran (`is_correct`), kunci jawaban asli, pembahasan langkah demi langkah (`explanation_md`), dan rujukan `related_video_id`.

### 8. Modul Pembayaran & Langganan QRIS (`src/modules/payments/`)
- [x] **`POST /api/payments/qris`:**
  - Validasi kuota dan masa aktif voucher di tabel `vouchers`.
  - Kalkulasi nominal akhir dari harga dasar Rp25.000 dalam tipe data `INTEGER`.
  - Pembuatan invoice unik (`INV-TKL-YYYYMMDD-XXXXX`) batas waktu 15 menit.
  - Integrasi Midtrans Dynamic QRIS / EMVCo string.
- [x] **`POST /api/payments/webhook`:**
  - Verifikasi keamanan *signature token* SHA-512 Midtrans.
  - Mekanisme *idempotent* dan transaksi atomik database (`db.transaction`):
    1. Update status transaksi menjadi `SUCCESS` dan catat `paid_at`.
    2. Tambah `used_count` voucher sebesar 1.
    3. Perpanjang masa aktif `subscription_valid_until` user selama 30 hari.
- [x] **`GET /api/payments/history`:**
  - Menampilkan riwayat transaksi pembayaran pengguna beserta nominal, status, dan tanggal bayar.
- [x] **`GET /api/payments/:invoice_number/status`:**
  - Polling ringan aplikasi Flutter untuk mengecek apakah status invoice sudah `SUCCESS`.

### 9. Modul Admin & Royalti Tutor (`src/modules/admin/`)
- [x] **`GET /api/admin/royalties/monthly`:**
  - Agregasi resmi SQL: total detik dan menit tonton seluruh mahasiswa per tutor.
  - Pembagian proporsional otomatis dari Pool Royalti Bulanan Rp3.500.000.

### 10. Modul Panam Academy Hub O2O (`src/modules/hub/`)
- [x] **`GET /api/hub/services`:**
  - Katalog layanan offline: *Crash Course H-7 Ujian* (Rp150.000), *Bootcamp Olah Data Skripsi* (Rp450.000), dan *Pass Harian Quiet Study Space* (Rp20.000).
- [x] **`POST /api/hub/book`:**
  - Form reservasi kelas/ruang belajar fisik dengan kode booking otomatis.

### 11. Dokumentasi API Interaktif (Swagger UI)
- [x] **OpenAPI 3.0.3 Specification (`src/docs/openapi.ts`):** Spesifikasi lengkap seluruh skema DTO, parameter, security schemes, dan contoh respons.
- [x] **Swagger UI Berdesain Takluk (`src/docs/swagger-ui.ts`):** Antarmuka web interaktif di URL `/docs` (dan redirect `/swagger`) bertema warna ungu `#462B92` dan oranye `#F89C05`.
- [x] **Export OpenAPI JSON (`GET /openapi.json`):** Endpoint JSON mentah untuk di-import ke Postman atau Insomnia.

---

## 📌 BAGIAN B: LANGKAH AKHIR (KONEKSI DATABASE FISIK)

Satu-satunya langkah yang tersisa sebelum aplikasi siap dipakai penuh di cloud adalah menghubungkan ke instance PostgreSQL nyata (Supabase):

1. **Konfigurasi `DATABASE_URL` di `.env`:**
   Isi URL PostgreSQL Supabase kamu pada file `.env`:
   ```env
   DATABASE_URL=postgresql://postgres:[PASSWORD]@db.[PROJECT_REF].supabase.co:5432/postgres
   ```
2. **Jalankan Migrasi:**
   ```powershell
   bun run db:migrate
   ```
3. **Jalankan Seeder Dummy Data:**
   ```powershell
   bun run db:seed
   ```
4. **Jalankan Server Development:**
   ```powershell
   bun dev
   ```
