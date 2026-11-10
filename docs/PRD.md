# PRODUCT REQUIREMENTS DOCUMENT (PRD)

**Nama Produk:** Takluk

**Konsep Bisnis:** Platform EdTech Hybrid Mahasiswa (Mobile App VOD & Offline Academy Hub)

**Target Lokasi Awal:** Kawasan Panam (Jl. HR Soebrantas), Pekanbaru, Riau

**Versi Dokumen:** 1.1 (MVP - Email OTP Update)

## 1. Gambaran Umum Proyek (Project Overview)

**Takluk (RuangKuliah Hub)** adalah ekosistem bimbingan belajar mahasiswa berbasis aplikasi mobile (_Video on Demand_ / VOD) dan akademi fisik pertama di Pekanbaru, Riau. Mengusung konsep _"Dari Mahasiswa untuk Mahasiswa" (Peer-to-Peer Learning)_, platform ini menyediakan video pembelajaran konsep mikro (_micro-learning_) berdurasi 5–10 menit dan bedah arsip soal ujian (UTS/UAS) yang disesuaikan spesifik dengan silabus serta karakter soal dosen di kampus-kampus lokal Pekanbaru (UNRI, UIN Suska, UIR, PCR).

Selain pilar digital melalui aplikasi mobile, ekosistem ini terintegrasi dengan **Panam Academy Hub** (ruko fisik 3 lantai) yang menyediakan layanan _Quiet Study Space_, _Crash Course H-7 Ujian_, _Bootcamp Olah Data Skripsi_, serta _Creator Studio_ bagi para tutor.

### Masalah Utama yang Diselesaikan:

1. **Gap Pedagogi Dosen vs Mahasiswa:** Kelas besar (40–80 mahasiswa) dengan tempo cepat membuat mata kuliah dasar (Kalkulus, Statistika, Algoritma Pemrograman) sulit dipahami.

2. **Ketiadaan Konten Lokal:** Tutorial online nasional terlalu generik dan tidak sesuai dengan tipe soal ujian dosen kampus lokal di Riau.

3. **Krisis Ruang Fokus & Belajar SKS:** Kos sempit/panas, kafe bising/mahal, serta ketergantungan pada belajar semalam suntuk yang tidak terstruktur.

4. **Monetisasi Talenta Kampus:** Minimnya wadah legal dan profesional bagi mahasiswa berprestasi/asisten lab untuk memonetisasi kemampuan mengajar mereka.

## 2. Tujuan Bisnis & Produk (Goals & Objectives)

### 2.1 Tujuan Bisnis (Business Goals)

- **Akuisisi Pengguna (Online):** Mencapai **350 pelanggan aktif bulanan** (Rp49.000/bulan) dengan potensi omzet online $\approx \text{Rp17.150.000/bulan}$.

- **Monetisasi Offline Hub:** Mencapai target pendapatan offline $\approx \text{Rp19.500.000/bulan}$ melalui _Crash Course Ujian_ (4 batch/bulan), _Bootcamp Olah Data_ (2 batch/bulan), dan tiket harian _Quiet Study Space_.

- **Profitabilitas & Payback:** Mencapai total omzet gabungan Rp36,65 Juta/bulan dengan EBITDA $\approx \text{Rp16,92 Juta/bulan}$ (margin $\sim 46\%$) dan _Payback Period_ investasi awal (CAPEX Rp158,7 Juta) dalam $\sim 9,4$ **bulan** (lebih cepat berkat penghematan OPEX dari penggunaan Email OTP gratis).

- **Ketersediaan Konten Awal:** Meluncurkan aplikasi MVP dengan minimal **20 modul pembelajaran perdana** dari mata kuliah momok (Semester 1–4).

### 2.2 Tujuan Produk (Product Goals)

- Menyediakan pengalaman belajar _micro-learning_ yang cepat, ringan, dan langsung ke inti permasalahan soal ujian.

- Memastikan seluruh materi dan alur pembayaran dapat dicapai pengguna dalam **maksimal 3 langkah (3 taps/steps)**.

- Mencegah pembajakan dan kebocoran materi berbayar melalui sistem keamanan konten tingkat tinggi (DRM, _Anti-Screen Capture_, _Dynamic Watermark_, dan _Device Binding_).

## 3. Target Pengguna (Target Users & Personas)

1. **Mahasiswa Semester Awal (Semester 1–4) — _Primary User_**
   - **Demografi:** Mahasiswa aktif di UNRI, UIN Suska, PCR, dan UIR (populasi 60.000+ mahasiswa dalam radius 5 km di Panam).

   - **Kebutuhan:** Memahami mata kuliah kuantitatif dasar (Kalkulus, Fisika, Statistika, Pemrograman), lulus UTS/UAS dengan nilai baik, butuh ruang belajar tenang dan murah.

2. **Mahasiswa Tingkat Akhir (Semester 7–8) — _Secondary User_**
   - **Demografi:** Mahasiswa yang sedang menyusun tugas akhir/skripsi.

   - **Kebutuhan:** Bimbingan praktis olah data (SPSS, SEM-PLS, Python) dengan harga terjangkau agar tidak tertahan di bab analisis data.

3. **Tutor Sebaya / Kreator (Asisten Lab & Mahasiswa IPK Tinggi) — _Partner User_**
   - **Demografi:** Mahasiswa berprestasi atau asisten dosen di kampus lokal.

   - **Kebutuhan:** Wadah legal dan fasilitas studio profesional untuk merekam materi ajar serta mendapatkan insentif produksi (_upfront fee_) dan royalti pasif bulanan berbasis jam tonton (_watch time_).

## 4. Fitur Utama (Key Features)

### 4.1 Modul Mahasiswa (Mobile App - Pilar Digital)

1. **Autentikasi Email OTP & Device Binding:**
   - Login/Registrasi menggunakan **Alamat Email** (email pribadi atau email kampus `.ac.id`) dan verifikasi **Email OTP (6 digit)** yang bebas biaya bulanan.

   - Pengisian profil akademik spesifik: Nama Lengkap, NIM, Kampus Asal (UNRI/UIN Suska/PCR/UIR), Semester, dan Nomor HP/WA (opsional/pendukung untuk info kelas offline).

   - **1 Akun = 1 Perangkat Aktif:** Sistem otomatis membatasi login hanya pada satu perangkat untuk mencegah _account sharing_.

2. **Beranda (Home Dashboard):**
   - Sapaan personal, kartu status langganan, dan _widget_ **Hitung Mundur UTS/UAS**.

   - Bagian _"Lanjut Menonton"_ (progres video terakhir), daftar mata kuliah utama, rekomendasi _"Bedah Soal Populer"_, dan banner program Referral.

3. **Jelajah & Filter Kurikulum Lokal:**
   - Pencarian pintar (_search bar_) dan _filter chip_ berdasarkan Mata Kuliah (Kalkulus, Statistika, Pemrograman) serta Jenis Konten (Materi Konsep, Bedah Soal UTS, Bedah Soal UAS).

   - Penanda khusus untuk **1 Video Gratis (Freemium)** di setiap mata kuliah sebagai _teaser_ sebelum berlangganan.

4. **Custom Secure Video Player (VOD Micro-Learning):**
   - Pemutar video rasio 16:9 dengan durasi 5–10 menit per konsep.

   - **Tab Interaktif di Bawah Player:** Tab _Bab/Silabus_ (navigasi sub-materi) dan Tab _Catatan/Ringkasan Rumus Digital_.

   - **Sistem DRM & Proteksi Konten:** Badge _"Dilindungi"_, blokir rekam layar (_black screen prevention_), ketiadaan tombol unduh, serta **Dynamic Watermark** (menampilkan Nama • NIM • Email dengan _opacity_ rendah yang berpindah posisi setiap $\pm 4$ detik).

5. **Arsip Soal & Latihan Interaktif:**
   - Kumpulan arsip soal UTS/UAS tahun-tahun sebelumnya dari dosen kampus lokal beserta tombol **Latihan Soal (Kuis Pilihan Ganda)** dengan umpan balik jawaban benar/salah secara instan.

6. **Tersimpan (Bookmark):**
   - Menyimpan video atau bedah soal penting untuk ditonton ulang saat H-1 ujian.

7. **Sistem Pembayaran & Langganan (Monetization):**
   - Paket langganan tunggal Rp49.000/bulan dengan fitur input kode Voucher/Promo (contoh: `PANAM10`, `UINSUSKA`).

   - Integrasi pembayaran instan via **QRIS** (dilengkapi penghitung waktu mundur/timer pembayaran dan verifikasi status otomatis).

### 4.2 Modul Integrasi Layanan Fisik (Panam Academy Hub - O2O)

- _Catatan: Pada fase MVP, pemesanan tiket kelas fisik dan Study Space dapat ditampilkan sebagai katalog/banner informasi di aplikasi yang terhubung ke pembayaran QRIS atau konfirmasi Admin Kasir._

- Informasi & Pemesanan **Crash Course H-7 Ujian** (Rp150.000/paket).

- Informasi & Pemesanan **Bootcamp Olah Data Skripsi** (Rp450.000/peserta).

- Informasi **Pass Harian Quiet Study Space** untuk non-member.

## 5. Alur Pengguna (User Flows)

### 5.1 Alur Onboarding & Registrasi (Email OTP)

1. User membuka aplikasi $\rightarrow$ Tampil **Splash Screen** (animasi cincin berdenyut & progress bar) $\rightarrow$ **Onboarding (3 Slide)** pengenalan nilai aplikasi.

2. User memilih tab **Daftar** pada layar Auth $\rightarrow$ Mengisi Nama, NIM, Kampus, Semester, dan **Email**.

3. Sistem mengirimkan kode **OTP (6 digit)** ke kotak masuk Email user $\rightarrow$ User memasukkan OTP di aplikasi.

4. Validasi berhasil $\rightarrow$ Sistem mencatat `device_id` perangkat $\rightarrow$ Masuk ke **Beranda**.

### 5.2 Alur Berlangganan (Maksimal 3 Langkah)

1. **Langkah 1:** Dari Beranda atau saat mengklik video terkunci, user menekan kartu/tombol **"Langganan Rp49.000/bln"**.

2. **Langkah 2:** Tampil _Bottom Sheet / Halaman Ringkasan Pembayaran_ $\rightarrow$ User (opsional) memasukkan kode voucher diskon $\rightarrow$ Menekan tombol **"Bayar dengan QRIS"**.

3. **Langkah 3:** Layar menampilkan kode **QRIS** beserta nominal akhir dan timer $\rightarrow$ User menyelesaikan pembayaran di aplikasi e-wallet/m-banking $\rightarrow$ Sistem memverifikasi otomatis via _webhook_ $\rightarrow$ Tampil animasi **Pembayaran Sukses (Centang + Confetti)** dan seluruh gembok materi terbuka.

### 5.3 Alur Menonton Video & Keamanan DRM

1. User memilih mata kuliah (misal: _Kalkulus_) di Beranda/Jelajah $\rightarrow$ Memilih video _"Bedah Soal UTS Kalkulus UNRI"_.

2. Sistem mengecek status `is_subscribed` (atau apakah video tersebut berlabel `is_free`).

3. Video diputar dalam format _streaming_ terenkripsi (HLS). Selama pemutar aktif, komponen **Dynamic Watermark** merender data user (`Nama • NIM • Email`) secara acak tiap 4 detik.

4. Jika sistem OS mendeteksi aktivitas _screen recording_ atau _screenshot_, layar video otomatis berubah menjadi hitam dengan peringatan: _"Perekaman layar terdeteksi & diblokir"_.

## 6. Spesifikasi Desain & UI/UX (Takluk Design System)

Desain antarmuka wajib mengacu pada panduan **Takluk Design System (`DESIGN.md`)** dengan prinsip: **Modern, Bersih, Ramah, dan Profesional**.

### 6.1 Identitas Visual & Palet Warna

- **Logo:** Ikon topi wisuda + tombol play (kombinasi ungu dan oranye) dengan teks "Takluk" berwarna ungu gelap.

- **Palet Warna Utama:**
  - `primary` (Ungu Utama): `#462B92` (Tombol utama, tab aktif, ikon, judul aksen).

  - `accent` (Golden Orange): `#F89C05` (CTA sekunder, progress bar, bookmark aktif, badge; **maksimal 1–2 elemen oranye per layar**).

  - `ink` (Ungu Gelap): `#2A1A5E` (Judul dan teks utama).

  - `bg` (Latar Halaman): `#FAF9FD` & `surface` (Kartu/Sheet): `#FFFFFF`.

  - `tint` (Ungu Muda): `#EFEAFB` & `tint-warm` (Krem Oranye): `#FFF4DE` (Info pengingat/hitung mundur UTS).

  - `muted` (Abu Teks): `#6B6B80`, `line` (Border): `#E7E4F0`.

  - **Status:** `success` `#16A34A` (Hijau), `error` `#DC2626` (Merah).

  - **Gradien Utama:** `linear-gradient(135deg, #462B92, #6B47C9)` untuk kartu langganan, profil, dan _thumbnail_ video.

### 6.2 Tipografi & Bahasa

- **Font Utama:** **Poppins** (Weights: 400 Regular, 500 Medium, 600 SemiBold, 700 Bold).

- **Skala Ukuran:** Judul Halaman (20–24 px, Bold), Judul Bagian (16–18 px, Bold), Judul Kartu/Video (14 px, SemiBold), Isi Teks (14–15 px, Regular/Medium), Metadata/Caption (11–12 px).

- **Tone of Voice:** Bahasa Indonesia yang ramah, santai ala rekan sebaya, dan menggunakan kata ganti **"kamu"**.

### 6.3 Layout, Komponen, & Motion (Interaksi)

- **Dimensi & Spacing:** Padding halaman `20 px`, jarak antar bagian `20 px`, jarak antar kartu `8 px`. Area sentuh (_touch target_) minimal `44 px`. Ruang bawah konten `112 px` agar tidak tertutup _Bottom Tab Bar_.

- **Radius Sudut:** Kartu besar/hero (`24 px`), Kartu/Input/Tombol (`16 px`), Thumbnail (`12 px`), Chip/Badge (`Pill / Penuh`), Bottom Sheet (`28 px` sudut atas).

- **Ilustrasi Thumbnail:** Tidak menggunakan foto stok; thumbnail video menggunakan gradien ungu dengan simbol tipografi mata kuliah (`∫` untuk Kalkulus, `σ` untuk Statistika, `</>` untuk Pemrograman).

- **Navigasi Utama:** _Bottom Tab Bar_ dengan 5 menu: **Beranda, Jelajah, Arsip, Tersimpan, Profil**.

- **Aturan Motion & Micro-interactions:**
  - Setiap tombol yang ditekan memberikan efek _scale_ `0.96`.

  - Ikon Bookmark memberikan efek _pop_ (`scale 1 -> 1.3 -> 1`) berwarna oranye saat diaktifkan.

  - Transisi halaman menggunakan efek _spring_ halus, dan perpindahan indikator tab aktif menggunakan animasi _shared layout_.

## 7. Gambaran Umum Database (Database Overview)

Database menggunakan **PostgreSQL (via Supabase)** dengan rancangan tabel relasional utama sebagai berikut:

1. **`users`**
   - `id` (UUID, PK), `full_name` (VARCHAR), `nim` (VARCHAR), `email` (VARCHAR, Unique), `phone_number` (VARCHAR, Nullable), `university` (ENUM: 'UNRI', 'UIN_SUSKA', 'PCR', 'UIR'), `semester` (INT), `active_device_id` (VARCHAR), `referral_code` (VARCHAR), `created_at` (TIMESTAMP).

2. **`courses` (Mata Kuliah)**
   - `id` (UUID, PK), `title` (VARCHAR - _e.g., Kalkulus, Statistika_), `symbol` (VARCHAR - _e.g., ∫, σ, </>_), `semester_target` (INT), `description` (TEXT).

3. **`videos` (Modul Micro-Learning & Bedah Soal)**
   - `id` (UUID, PK), `course_id` (UUID, FK), `tutor_id` (UUID, FK), `title` (VARCHAR), `category` (ENUM: 'MATERI', 'UTS', 'UAS'), `university_tag` (VARCHAR), `duration_seconds` (INT), `hls_stream_url` (TEXT), `summary_notes` (TEXT/Markdown), `is_free` (BOOLEAN), `created_at` (TIMESTAMP).

4. **`video_chapters` (Bab dalam Video)**
   - `id` (UUID, PK), `video_id` (UUID, FK), `title` (VARCHAR), `timestamp_start` (INT).

5. **`watch_history` & `bookmarks`**
   - `id` (UUID, PK), `user_id` (UUID, FK), `video_id` (UUID, FK), `last_watched_second` (INT), `is_completed` (BOOLEAN), `is_bookmarked` (BOOLEAN), `updated_at` (TIMESTAMP).

   - _Catatan: Tabel ini juga digunakan untuk menghitung total jam tonton (`watch_time`) sebagai dasar pembagian royalti tutor._

6. **`archive_questions` (Bank Latihan Soal Arsip)**
   - `id` (UUID, PK), `course_id` (UUID, FK), `exam_type` (ENUM: 'UTS', 'UAS'), `academic_year` (VARCHAR), `question_text` (TEXT), `options` (JSONB), `correct_option` (INT), `explanation` (TEXT).

7. **`subscriptions` & `transactions`**
   - `id` (UUID, PK), `user_id` (UUID, FK), `voucher_code` (VARCHAR, Nullable), `amount_paid` (INT), `payment_method` (VARCHAR - _default: 'QRIS'_), `payment_status` (ENUM: 'PENDING', 'SUCCESS', 'FAILED', 'EXPIRED'), `qris_payload` (TEXT), `valid_until` (TIMESTAMP), `created_at` (TIMESTAMP).

8. **`vouchers`**
   - `code` (VARCHAR, PK - _e.g., PANAM10_), `discount_amount` (INT), `quota` (INT), `valid_until` (TIMESTAMP).

## 8. Kebutuhan Teknis & Arsitektur (Technical Requirements)

### 8.1 Tech Stack

- **Mobile Frontend:** **Flutter Framework** (Single codebase untuk Android & iOS) — memastikan performa animasi 60fps yang mulus dan kemudahan integrasi fitur keamanan level OS.

- **Backend & API:** **Hono.js (TypeScript)** dengan arsitektur RESTful API.

- **Database & Email Auth:** **PostgreSQL (Supabase)** dengan integrasi layanan **Transactional Email / SMTP** (seperti **Resend** atau **Brevo** yang menyediakan _free tier_ 3.000–9.000 email/bulan gratis).

- **Video Hosting & Streaming:** **Cloudflare Stream / VOD CDN** dengan protokol **HLS (HTTP Live Streaming)** terenkripsi agar hemat _bandwidth_ namun berkualitas tajam (Full HD).

- **Payment Gateway:** **Xendit** atau **Midtrans** (Fokus utama pada pembuatan _Dynamic QRIS_ dan _Webhook_ verifikasi pembayaran otomatis).

### 8.2 Keamanan Konten (DRM & Anti-Piracy)

- **Android:** Implementasi `FLAG_SECURE` pada `WindowManager` untuk memblokir tangkapan layar (_screenshot_) dan perekaman layar (_screen recording_) secara native.

- **iOS:** Pemantauan `UIScreen.isCaptured` untuk mendeteksi perekaman layar atau _AirPlay mirroring_, dan secara instan menutup player dengan layar hitam (_blackout overlay_).

- **Overlay Watermark:** Dirender di atas _layer_ video player secara dinamis menggunakan state pengguna aktif (`Nama • NIM • Email`) yang mengubah koordinat $(X, Y)$ setiap 4 detik.

- **Single Device Session:** Setiap kali user melakukan login baru dan terverifikasi Email OTP, token JWT lama pada perangkat sebelumnya otomatis dicabut (_revoked_).

## 9. Cakupan Proyek (Project Scope & Phasing)

Mengacu pada alokasi anggaran R&D Tim IT selama **2 Bulan (MVP)**, berikut adalah batasan cakupan pengerjaan proyek:

### 9.1 In-Scope (Fase 1: MVP — Target Rilis Bulan ke-2)

- Aplikasi Mobile Android & iOS (Flutter) yang siap rilis di Google Play Store dan Apple App Store.

- Sistem Autentikasi **Email + Email OTP** + _Single Device Binding_.

- 5 Layar Navigasi Utama: Beranda, Jelajah, Arsip, Tersimpan, dan Profil.

- Pemutar Video HLS dengan fitur _Bab_, _Catatan_, _Anti-Screen Record_, dan _Dynamic Watermark_.

- Konten Awal: 3 Mata Kuliah Utama (Kalkulus, Statistika, Pemrograman) dengan total **20 Modul Video Perdana** (1 video gratis per mata kuliah).

- Fitur Latihan Soal pilihan ganda di menu Arsip.

- Sistem Langganan Rp49.000/bulan dengan fitur Kode Voucher dan pembayaran otomatis via **QRIS**.

- Sistem Kode Referral dasar & Manajemen Perangkat Aktif di menu Profil.

### 9.2 Out-of-Scope (Fase 2: Pengembangan Berikutnya)

- Sistem _booking_ kursi interaktif (_seat map_) secara _real-time_ untuk _Quiet Study Space_ Panam Hub (pada fase MVP masih menggunakan tiket harian kasir/QRIS statis).

- Dashboard analitik mandiri khusus Tutor untuk memantau pendapatan royalti secara _real-time_ (pada fase MVP dilaporkan secara berkala dari database).

- Grafik statistik jam belajar mingguan mahasiswa, fitur _Dark Mode_ (Mode Gelap), _Subtitle_ otomatis, dan forum diskusi langsung di dalam aplikasi.
