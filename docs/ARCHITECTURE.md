# ARCHITECTURE.md — Takluk

Dokumen ini adalah panduan arsitektur teknis utama untuk proyek **Takluk**. Tujuan dokumen ini adalah menjadi _Single Source of Truth_ bagi tim developer agar setiap kali membuka kembali proyek ini (bahkan setelah berbulan-bulan), kita langsung paham **"sistem ini jalannya gimana, kodenya ditaruh di mana, dan kenapa kita pakai teknologi ini"**.

## 1. Gambaran Besar Arsitektur (High-Level Architecture)

Sistem Takluk menggunakan arsitektur **Client-Server Monolith Modular** yang ringan, hemat biaya operasional (OPEX sangat rendah karena menggunakan Email OTP gratis dan streaming efisien), namun sangat aman dari pembajakan konten.

```
[ 📱 Flutter App (Android/iOS) ]
       │
       ├── (1) REST API (JSON + JWT + Device ID Header)
       ▼
[ ⚡ Backend API: Hono.js (TypeScript) ]
       │
       ├── (2) Query / Transaksi Data (Drizzle ORM) ──► [ 🐘 PostgreSQL (Supabase) ]
       │
       ├── (3) Kirim Kode OTP via Email (Gratis) ─────► [ 📧 Email API / SMTP (Resend / Brevo) ]
       │
       ├── (4) Generate QRIS & Webhook Lunas ─────────► [ 💳 Payment Gateway (Xendit/Midtrans) ]
       │
       └── (5) Request Signed URL Video (HLS) ────────► [ ☁️ Cloudflare Stream / R2 CDN ]
                                                                │
       ┌────────────────────────────────────────────────────────┘
       └── (6) Streaming Video Terenkripsi (.m3u8) langsung ke Flutter Player

```

## 2. Tech Stack & Spesifikasi

| Layer                     | Teknologi                                                  | Peran Utama                                                                                                                                                                |
| ------------------------- | ---------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Mobile App (Client)**   | **Flutter (Dart)**                                         | Aplikasi utama mahasiswa (Android & iOS). State management menggunakan **Riverpod** dan routing dengan **GoRouter**.                                                       |
| **Backend API**           | **Hono.js (TypeScript)** _(di atas runtime Node.js / Bun)_ | REST API utama, validasi bisnis, middleware keamanan perangkat, dan orkestrasi layanan pihak ketiga. _(Alternatif: Express.js, namun Hono dipilih sebagai standar utama)._ |
| **Database & ORM**        | **PostgreSQL (Supabase)** + **Drizzle ORM**                | Penyimpanan data relasional (User, Materi, Transaksi, Riwayat Tonton) dengan _type-safety_ penuh di TypeScript.                                                            |
| **Email OTP Service**     | **Resend / Brevo / Nodemailer SMTP**                       | Pengiriman kode OTP 6 digit ke email mahasiswa (Gratis hingga 3.000–9.000 email/bulan, menghemat OPEX bulanan).                                                            |
| **Video Streaming (VOD)** | **Cloudflare Stream / R2 (HLS)**                           | Penyimpanan dan distribusi video _micro-learning_ menggunakan protokol HLS (`.m3u8`) dengan _Signed URL_.                                                                  |
| **Payment Gateway**       | **Xendit / Midtrans**                                      | Pembuatan _Dynamic QRIS_ dan penerimaan _Webhook_ otomatis saat mahasiswa selesai membayar.                                                                                |

## 3. Struktur Folder (Directory Structure)

Aturan utama: **Gunakan pendekatan _Feature-First_ (berdasarkan fitur bisnis), bukan _Layer-First_**. Jika ingin mengedit fitur "Pembayaran", semua filenya mengumpul di satu folder `payment/`, tidak perlu lompat-lompat jauh.

### 3.1 Mobile App (`takluk-mobile/` — Flutter)

```
lib/
├── main.dart                     # Entry point aplikasi & inisialisasi konfigurasi
├── core/                         # Komponen global yang dipakai di seluruh fitur
│   ├── theme/                    # Warna (#462B92, #F89C05), Tipografi Poppins (sesuai DESIGN.md)
│   ├── network/                  # Dio HTTP Client + Interceptor (injeksi JWT & Device ID otomatis)
│   ├── router/                   # Konfigurasi GoRouter (Navigasi 5 Tab & Push Screen)
│   ├── security/                 # Modul Anti-Screen Record (FLAG_SECURE) & Device Info
│   └── widgets/                  # Widget global (Tombol 'B', Input 'In', Custom Toast, BottomSheet)
│
└── features/                     # Modul Fitur Bisnis (Feature-First)
    ├── auth/                     # Login, Register, Email OTP, Device Binding
    │   ├── data/                 # Repository & API call ke Backend
    │   ├── domain/               # Model data User
    │   └── presentation/         # Layar Auth, OTP Sheet, & Riverpod Controller
    ├── home/                     # Beranda, Hitung Mundur UTS, Lanjut Menonton
    ├── explore/                  # Jelajah, Pencarian, & Filter Chip (Kampus/Matkul)
    ├── player/                   # Custom HLS Video Player, Dynamic Watermark, Tab Bab & Catatan
    ├── archive/                  # Arsip Soal UTS/UAS & Kuis Interaktif
    ├── bookmark/                 # Daftar Video Tersimpan
    ├── payment/                  # Checkout Voucher, Layar QRIS Timer, & Confetti Sukses
    └── profile/                  # Profil Mahasiswa, Info Langganan, & Reset Perangkat

```

### 3.2 Backend API (`takluk-api/` — Hono.js / Express.js)

```
src/
├── index.ts                      # Entry point server & registrasi route utama
├── config/                       # Load Environment Variables (.env) & koneksi eksternal
├── db/                           # Database Layer
│   ├── schema.ts                 # Definisi tabel PostgreSQL (Drizzle Schema)
│   ├── index.ts                  # Instance koneksi database
│   └── migrations/               # File SQL hasil migrasi otomatis
├── middlewares/                  # Penjaga gerbang sebelum masuk ke Controller
│   ├── auth.middleware.ts        # Verifikasi JWT Token
│   ├── device.middleware.ts      # Cek apakah Device ID sama dengan yang terdaftar di DB
│   └── error.middleware.ts       # Format standar jika terjadi error
├── modules/                      # Modul Fitur Bisnis
│   ├── auth/                     # Route, Controller, & Service untuk Login & Email OTP
│   ├── courses/                  # Katalog Matkul, Video, & Generate Signed URL HLS
│   ├── archives/                 # Bank Soal UTS/UAS & penilaian latihan soal
│   ├── progress/                 # Pencatatan riwayat tonton (untuk royalti tutor) & Bookmark
│   └── payments/                 # Kalkulasi Voucher, Request QRIS Xendit, & Webhook Handler
└── utils/                        # Fungsi bantuan (Generator OTP, Email Template HTML, Formatter)

```

## 4. Alur Data Antar Service (Core System Flows)

Bagian ini menjelaskan bagaimana Flutter, Backend Hono, Database, dan layanan pihak ketiga saling berbicara pada 4 skenario paling krusial:

### 4.1 Flow Autentikasi Email OTP & _Single Device Binding_ (1 Akun = 1 HP)

**Tujuan:** Mencegah 1 akun patungan dipakai ramai-ramai oleh satu kelas, dengan biaya pengiriman OTP Rp0 (gratis via Email).

1. **Request OTP:** Mahasiswa memasukkan alamat email di Flutter. Flutter mengirim `POST /api/auth/request-otp` berisi `email`.

2. **Kirim Email OTP:** Backend men-generate angka acak 6 digit, menyimpannya di database/memori (berlaku 5 menit), lalu memanggil API **Resend / SMTP** untuk mengirim email berisi kode OTP berdesain rapi (_HTML template_ ungu Takluk) ke inbox mahasiswa.

3. **Verifikasi & Kunci Perangkat:**
   - Mahasiswa membuka email, melihat kode 6 digit, dan memasukkannya ke layar OTP di Flutter.

   - Flutter mengambil ID perangkat fisik (`device_id` unik dari Android/iOS) lalu mengirim `POST /api/auth/verify-otp` (`email`, `otp_code`, `device_id`).

   - Backend memvalidasi OTP. Jika benar, Backend **menimpa kolom `active_device_id`** di tabel `users` dengan `device_id` terbaru tersebut, lalu mengembalikan `JWT Token`.

4. **Penjaga Request Berikutnya (`device.middleware.ts`):**
   - Setiap kali Flutter meminta data ke Backend, Flutter wajib menyertakan header `Authorization: Bearer <JWT>` dan `X-Device-ID: <device_id>`.

   - Middleware Backend mencocokkan `X-Device-ID` dari header dengan `active_device_id` di database. Jika **berbeda** (berarti akun tersebut baru saja login di HP teman), Backend menolak request dengan status `403 DEVICE_MISMATCH` dan Flutter otomatis me-logout akun di HP lama.

### 4.2 Flow Pembayaran Langganan (QRIS Otomatis)

**Tujuan:** Mahasiswa bayar Rp49.000 (dikurangi voucher jika ada) dan akun langsung aktif detik itu juga tanpa perlu kirim bukti transfer manual ke admin.

1. **Checkout:** Di Flutter, mahasiswa klik "Bayar dengan QRIS" (misal pakai kode voucher `PANAM10`). Flutter memanggil `POST /api/payments/qris` (`voucher_code`).

2. **Validasi & Buat Invoice:**
   - Backend mengecek kuota voucher `PANAM10` di PostgreSQL. Harga dipotong dari Rp49.000 menjadi Rp39.000.

   - Backend menyimpan data ke tabel `transactions` dengan status `PENDING`.

   - Backend memanggil API **Xendit/Midtrans** untuk meminta pembuatan _Dynamic QRIS_ senilai Rp39.000.

   - Backend menerima `qris_string` dari Payment Gateway dan meneruskannya ke Flutter untuk dirender menjadi gambar QR Code beserta hitung mundur 15 menit.

3. **Verifikasi Otomatis (Webhook):**
   - Mahasiswa melakukan scan dan membayar via GoPay/DANA/M-Banking.

   - Server Xendit/Midtrans otomatis menembak endpoint rahasia kita: `POST /api/payments/webhook`.

   - Backend memverifikasi _signature token_ dari Xendit, mengubah status transaksi menjadi `SUCCESS`, memperbarui kolom `valid_until` pada tabel `subscriptions` user menjadi `NOW() + 30 hari`, dan mengirim bukti kuitansi lunas ke email mahasiswa.

   - Layar Flutter yang sedang menunggu status pembayaran langsung menampilkan animasi **Sukses + Confetti**.

### 4.3 Flow Streaming Video Aman (DRM, Signed URL & Watermark)

**Tujuan:** Video tidak bisa di-download menggunakan IDM/browser dan tidak bisa direkam layar.

1. **Pilih Video:** Mahasiswa mengklik video _"Bedah Soal UTS Kalkulus UNRI"_ di Flutter. Flutter memanggil `GET /api/courses/videos/:id/play`.

2. **Cek Hak Akses:**
   - Backend mengecek apakah video tersebut berlabel `is_free = true`.

   - Jika `false`, Backend mengecek apakah user memiliki langganan aktif (`valid_until > NOW()`). Jika tidak aktif, tolak dengan error `402 PAYMENT_REQUIRED`.

3. **Generate URL Sementara (Signed URL):**
   - Di database, kita **tidak menyimpan URL publik video**, melainkan hanya `cloudflare_video_id`.

   - Backend meminta/membuat **Signed HLS URL (`.m3u8`)** ke Cloudflare yang **hanya berlaku selama 2 jam**.

   - Backend mengirimkan URL sementara tersebut beserta data bab (`chapters`) dan catatan rumus ke Flutter.

4. **Proteksi Layar di Sisi Flutter:**
   - Saat halaman Player terbuka, Flutter mengaktifkan `FLAG_SECURE` (Android) / deteksi tangkapan layar (iOS).

   - Komponen **Dynamic Watermark** mengambil data `Nama • NIM • Email` dari memori dan menggerakkan teks transparan di atas video setiap 4 detik.

### 4.4 Flow Pencatatan Jam Tonton (Untuk Royalti Tutor)

**Tujuan:** Menghitung bagi hasil _Pool Royalti Tutor_ (OPEX Rp3,5 Juta/bulan) secara adil dan transparan berdasarkan durasi tontonan mahasiswa.

1. Selama video diputar di Flutter, setiap **30 detik** (atau saat video dijeda/selesai), Flutter mengirim sinyal _heartbeat_ ringan di latar belakang: `POST /api/progress/sync` (`video_id`, `last_watched_second`, `watched_duration_delta`).

2. Backend menyimpan posisi terakhir (`last_watched_second`) agar fitur _"Lanjut Menonton"_ di Beranda selalu akurat, sekaligus mengakumulasi total menit tontonan pada video tutor yang bersangkutan.

## 5. Keputusan Teknis (Architecture Decision Records / ADR)

Bagian ini menjawab pertanyaan **"Kenapa dulu kita memilih teknologi/cara ini?"** agar di masa depan tim tidak sembarangan mengganti arsitektur tanpa memahami alasannya.

### ADR-01: Kenapa Flutter untuk Mobile App?

- **Konteks:** Budget pengembangan MVP terbatas (2 bulan) namun target pasar mahasiswa di Panam menggunakan Android dan iOS. Selain itu, desain aplikasi (_Takluk Design System_) menuntut animasi yang sangat halus dan proteksi anti-rekam layar.

- **Keputusan:** Menggunakan **Flutter** dengan **Riverpod**.

- **Alasan:** Satu basis kode (_single codebase_) untuk Android & iOS dengan performa setara _native_ (60/120 fps). Flutter juga sangat mudah diintegrasikan dengan kode native Android (`WindowManager.LayoutParams.FLAG_SECURE`) dan iOS (`UIScreen.isCaptured`) untuk memblokir perekaman layar.

### ADR-02: Kenapa Hono.js (TypeScript) dibanding Express.js biasa?

- **Konteks:** Kita butuh Backend API untuk komunikasi JSON, transaksi database, dan menangkap webhook pembayaran dengan biaya sewa server bulanan yang murah.

- **Keputusan:** Memilih **Hono.js** dengan TypeScript (di atas Node.js atau Bun) sebagai pilihan utama dibandingkan Express.js.

- **Alasan:**
  1. Cara penulisan kode Hono.js **95% mirip dengan Express.js** (`app.get()`, `app.post()`, middleware), sehingga developer yang terbiasa dengan Express bisa langsung pakai dalam 10 menit.

  2. Hono jauh lebih cepat, modern, ringan memori, dan memiliki dukungan **TypeScript + Validasi Input (Zod)** bawaan yang jauh lebih rapi dibanding Express.js yang sudah cukup tua.

### ADR-03: Kenapa PostgreSQL + Drizzle ORM?

- **Konteks:** Data aplikasi kita sangat terstruktur dan saling berelasi (User punya Langganan, Matkul punya Video, Video punya Tutor dan Riwayat Tonton).

- **Keputusan:** Menggunakan **PostgreSQL (via Supabase)** dan **Drizzle ORM**.

- **Alasan:** Transaksi keuangan (QRIS, kuota voucher) dan perhitungan royalti tutor wajib menggunakan database relasional (SQL) yang menjamin konsistensi data (ACID). Drizzle ORM dipilih karena sangat ringan, tidak membuat server lambat, dan sintaksnya mirip SQL asli sehingga mudah di-debug.

### ADR-04: Kenapa Streaming HLS + Dynamic Watermark dibanding DRM Widevine/FairPlay?

- **Konteks:** Kita harus melindungi video materi agar tidak dibajak dan disebarkan ke grup Telegram kampus, namun budget integrasi DRM awal adalah Rp5 Juta dengan OPEX bulanan yang efisien.

- **Keputusan:** Kombinasi **HLS Streaming + Signed URL + OS Screen Capture Block + Dynamic Moving Watermark**.

- **Alasan:** Lisensi DRM tingkat Hollywood (seperti Google Widevine / Apple FairPlay) membutuhkan biaya bulanan ribuan dolar dan proses sertifikasi yang rumit. Untuk skala EdTech lokal, kombinasi _Anti-Screen Record_ (layar otomatis hitam jika direkam via aplikasi perekam layar) ditambah _Dynamic Watermark_ (Nama, NIM, dan Email mahasiswa muncul bergerak di layar) sudah 99% efektif.

### ADR-05: Kenapa Email OTP dibanding WhatsApp OTP?

- **Konteks:** Setiap proses login dan ganti perangkat membutuhkan pengiriman kode OTP 6 digit untuk keamanan _Single Device Binding_.

- **Keputusan:** Menggunakan **Email OTP** (via Resend / Brevo SMTP) menggantikan WhatsApp OTP.

- **Alasan:**
  1. **Efisiensi Biaya (OPEX Rp0):** WhatsApp API resmi (Meta) mematok biaya mahal per pesan autentikasi, sedangkan gateway WA tidak resmi rawan mengalami _banned_ nomor secara tiba-tiba. Layanan Email Transaksional seperti **Resend** atau **Brevo** menyediakan kuota gratis 3.000 hingga 9.000 email per bulan—sangat cukup untuk ribuan mahasiswa tanpa keluar biaya sepeser pun.

  2. **Relevansi Mahasiswa:** Seluruh mahasiswa aktif pasti memiliki email aktif di smartphone mereka (baik Gmail maupun email kampus `.ac.id` yang nantinya juga bisa dipakai untuk validasi promo khusus kampus).

## 6. Standar Format Komunikasi API (API Contract)

Agar developer Frontend (Flutter) dan Backend (Hono) tidak pernah salah paham saat bertukar data, seluruh endpoint API **wajib** mengembalikan format JSON standar berikut:

**Response Sukses (`200 OK` / `201 Created`):**

```
{
  "success": true,
  "message": "Data berhasil diambil",
  "data": {
    "course_id": "c1a2b3...",
    "title": "Kalkulus Dasar I"
  }
}

```

**Response Gagal / Error (`400`, `401`, `403`, `500`):**

```
{
  "success": false,
  "error_code": "DEVICE_MISMATCH",
  "message": "Akun kamu telah login di perangkat lain. Silakan masuk kembali."
}

```

## 7. Daftar Environment Variables (`.env.example`)

Saat men-setup proyek di laptop baru atau di server produksi, pastikan variabel berikut sudah terisi di sisi Backend:

```
# Server
PORT=3000
NODE_ENV=development
JWT_SECRET=rahasia_jwt_takluk_panam_2026

# Database (Supabase PostgreSQL)
DATABASE_URL=postgresql://postgres:password@db.supabase.co:5432/postgres

# Email OTP Service (Resend / Brevo SMTP - Gratis)
SMTP_HOST=smtp.resend.com
SMTP_PORT=465
SMTP_USER=resend
SMTP_PASS=re_token_api_resend_anda
EMAIL_FROM="Takluk RuangKuliah <no-reply@takluk.id>"

# Payment Gateway (Xendit / Midtrans)
PAYMENT_SECRET_KEY=xnd_development_...
PAYMENT_WEBHOOK_TOKEN=token_verifikasi_webhook_anda

# Cloudflare Stream / R2 (VOD)
CF_ACCOUNT_ID=id_akun_cloudflare
CF_STREAM_SIGNING_KEY=kunci_rahasia_signed_url_video

```
