# SCHEMA.md — Database Blueprint Takluk (PostgreSQL)

Dokumen ini adalah acuan resmi struktur database **PostgreSQL (Supabase)** untuk ekosistem **Takluk (RuangKuliah Hub)**. 
**Tujuan:** Mencegah kesalahan penulisan query, menjaga konsistensi tipe data antara Backend (Hono/Drizzle) dan Mobile (Flutter), serta mencegah *migration* yang bentrok atau merusak data yang sudah ada di *production*.

---

## 1. Konvensi Penamaan & Aturan Dasar (Golden Rules)

1. **Penamaan Tabel & Kolom:** Wajib menggunakan `snake_case` dan bentuk jamak untuk nama tabel (contoh: `users`, `video_chapters`, `watch_histories`).
2. **Primary Key (PK):** Seluruh tabel utama menggunakan `UUID v4` (`defaultRandom()`) agar ID tidak mudah ditebak (*anti-enumeration*) saat dikirim lewat API.
3. **Timestamps:** Seluruh tabel wajib memiliki `created_at` dan (jika datanya bisa berubah) `updated_at` dengan tipe `TIMESTAMPTZ` (menyimpan zona waktu UTC/WIB secara akurat).
4. **Uang & Durasi:**
   * Nilai uang (harga, diskon, jumlah bayar) wajib disimpan dalam tipe **`INTEGER`** (Rupiah penuh tanpa desimal, contoh: `49000`). **Jangan pernah gunakan `FLOAT` untuk uang.**
   * Durasi waktu video disimpan dalam satuan **detik (`INTEGER`)**, contoh: 10 menit = `600`.
5. **Larangan Hard-Delete pada Data Transaksional:** Tabel `users`, `videos`, dan `transactions` **dilarang dihapus permanen (`DELETE FROM`)** jika sudah memiliki riwayat transaksi atau jam tonton. Gunakan kolom `is_active = false` atau `deleted_at` (*Soft Delete*).

---

## 2. Peta Relasi Antar Tabel (Entity Relationship Overview)

```text
[users] 1 ──────< * [email_otps]
   │
   ├── 1 ──────< * [transactions] * >────── 1 [vouchers] (opsional)
   │
   ├── 1 ──────< * [watch_histories] * >─── 1 [videos]
   │                                             │
[tutors] 1 ─────< * [videos] * >── 1 [courses]   ├── 1 ──────< * [video_chapters]
                                        │
                                        └── 1 ──────< * [archive_questions]
```

**Keterangan Relasi Kunci:**
* **1 User** bisa memiliki banyak **Transactions**, tapi status langganan aktif cukup dicek dari `users.subscription_valid_until > NOW()`.
* **1 User** + **1 Video** hanya boleh memiliki **1 baris** di `watch_histories` (dijaga dengan `UNIQUE(user_id, video_id)`).
* **1 Course (Mata Kuliah)** memiliki banyak **Videos** dan banyak **Archive Questions (Latihan Soal)**.

---

## 3. Definisi ENUM (Tipe Data Terbatas)

Sebelum membuat tabel, PostgreSQL menyimpan tipe `ENUM` berikut agar tidak ada salah ketik data dari kode program:

| Nama ENUM | Nilai yang Diizinkan (Values) | Keterangan |
| :--- | :--- | :--- |
| `university_enum` | `'UNRI'`, `'UIN_SUSKA'`, `'PCR'`, `'UIR'`, `'UMRI'`, `'LAINNYA'` | Kampus asal mahasiswa & tag soal lokal |
| `video_category_enum` | `'MATERI'`, `'UTS'`, `'UAS'` | Jenis modul video pembelajaran |
| `exam_type_enum` | `'UTS'`, `'UAS'` | Kategori latihan soal arsip |
| `payment_status_enum` | `'PENDING'`, `'SUCCESS'`, `'FAILED'`, `'EXPIRED'` | Status invoice QRIS dari Payment Gateway |
| `user_role_enum` | `'STUDENT'`, `'TUTOR'`, `'ADMIN'` | Hak akses pengguna |

---

## 4. Detail Struktur Tabel, Tipe Data, & Constraints

### 4.1 Tabel `users` (Data Mahasiswa & Status Perangkat/Langganan)
Menyimpan profil mahasiswa, perangkat aktif (*Single Device Binding*), dan masa aktif langganan.

| Nama Kolom | Tipe Data | Constraints | Keterangan |
| :--- | :--- | :--- | :--- |
| `id` | `UUID` | `PRIMARY KEY`, `DEFAULT gen_random_uuid()` | ID unik mahasiswa |
| `email` | `VARCHAR(255)` | `NOT NULL`, `UNIQUE` | Email login & tujuan pengiriman OTP |
| `full_name` | `VARCHAR(150)` | `NOT NULL` | Nama lengkap (ditampilkan di *Dynamic Watermark*) |
| `nim` | `VARCHAR(50)` | `NOT NULL` | Nomor Induk Mahasiswa (ditampilkan di *Watermark*) |
| `university` | `university_enum` | `NOT NULL`, `DEFAULT 'UIN_SUSKA'` | Kampus asal untuk personalisasi konten |
| `semester` | `SMALLINT` | `NOT NULL`, `CHECK (semester BETWEEN 1 AND 14)` | Semester aktif mahasiswa |
| `phone_number` | `VARCHAR(20)` | `NULLABLE` | Opsional (untuk pengumuman kelas offline Panam Hub) |
| `role` | `user_role_enum` | `NOT NULL`, `DEFAULT 'STUDENT'` | Role akses |
| `active_device_id` | `VARCHAR(255)` | `NULLABLE` | ID perangkat HP yang sedang sah login saat ini |
| `device_updated_at`| `TIMESTAMPTZ` | `NULLABLE` | Waktu terakhir ganti perangkat |
| `referral_code` | `VARCHAR(20)` | `NOT NULL`, `UNIQUE` | Kode referral unik milik mahasiswa ini |
| `referred_by_id` | `UUID` | `NULLABLE`, `FK -> users(id) ON DELETE SET NULL` | Siapa yang mengajak user ini |
| `subscription_valid_until` | `TIMESTAMPTZ` | `NULLABLE` | Jika `> NOW()`, maka user berstatus **Pelanggan Aktif** |
| `is_active` | `BOOLEAN` | `NOT NULL`, `DEFAULT true` | Flag blokir jika user ketahuan membajak konten |
| `created_at` | `TIMESTAMPTZ` | `NOT NULL`, `DEFAULT NOW()` | Waktu registrasi |
| `updated_at` | `TIMESTAMPTZ` | `NOT NULL`, `DEFAULT NOW()` | Waktu perubahan profil terakhir |

* **Indexes:** `idx_users_email` (B-Tree), `idx_users_referral_code` (B-Tree).

---

### 4.2 Tabel `email_otps` (Kode Verifikasi Login Email)
Menyimpan kode OTP 6 digit sementara yang dikirim via Resend/SMTP.

| Nama Kolom | Tipe Data | Constraints | Keterangan |
| :--- | :--- | :--- | :--- |
| `id` | `UUID` | `PRIMARY KEY`, `DEFAULT gen_random_uuid()` | ID log OTP |
| `email` | `VARCHAR(255)` | `NOT NULL` | Email tujuan (bisa untuk user baru maupun lama) |
| `otp_code` | `CHAR(6)` | `NOT NULL` | Angka 6 digit (contoh: `'123456'`) |
| `attempts` | `SMALLINT` | `NOT NULL`, `DEFAULT 0` | Jumlah salah input (maksimal 5x coba untuk cegah brute-force) |
| `is_used` | `BOOLEAN` | `NOT NULL`, `DEFAULT false` | Otomatis `true` setelah berhasil dipakai |
| `expires_at` | `TIMESTAMPTZ` | `NOT NULL` | Berlaku `NOW() + 5 minutes` |
| `created_at` | `TIMESTAMPTZ` | `NOT NULL`, `DEFAULT NOW()` | Waktu request OTP |

* **Indexes:** `idx_email_otps_lookup` pada `(email, is_used, expires_at)`.

---

### 4.3 Tabel `tutors` (Profil Kreator / Asisten Lab)
Menyimpan data tutor sebaya untuk perhitungan *Pool Royalti* bulanan.

| Nama Kolom | Tipe Data | Constraints | Keterangan |
| :--- | :--- | :--- | :--- |
| `id` | `UUID` | `PRIMARY KEY`, `DEFAULT gen_random_uuid()` | ID unik tutor |
| `user_id` | `UUID` | `UNIQUE`, `FK -> users(id) ON DELETE CASCADE` | Relasi ke akun mahasiswa/tutor |
| `bio_title` | `VARCHAR(150)` | `NOT NULL` | Contoh: *"Asisten Lab Kalkulus UNRI • IPK 3.92"* |
| `bank_name` | `VARCHAR(50)` | `NULLABLE` | Nama bank/e-wallet untuk pencairan royalti |
| `bank_account_no` | `VARCHAR(50)` | `NULLABLE` | Nomor rekening tutor |
| `revenue_share_weight` | `NUMERIC(5,2)` | `NOT NULL`, `DEFAULT 1.00` | Bobot pengali royalti (default `1.00`) |
| `created_at` | `TIMESTAMPTZ` | `NOT NULL`, `DEFAULT NOW()` | Waktu terdaftar sebagai tutor |

---

### 4.4 Tabel `courses` (Katalog Mata Kuliah)
Menyimpan daftar mata kuliah momok (Kalkulus, Statistika, Pemrograman).

| Nama Kolom | Tipe Data | Constraints | Keterangan |
| :--- | :--- | :--- | :--- |
| `id` | `UUID` | `PRIMARY KEY`, `DEFAULT gen_random_uuid()` | ID mata kuliah |
| `slug` | `VARCHAR(100)` | `NOT NULL`, `UNIQUE` | Contoh: `'kalkulus-dasar-1'` |
| `title` | `VARCHAR(150)` | `NOT NULL` | Contoh: `'Kalkulus'` |
| `symbol` | `VARCHAR(10)` | `NOT NULL` | Simbol ilustrasi thumbnail (`'∫'`, `'σ'`, `'</>'`) |
| `semester_target` | `SMALLINT` | `NOT NULL`, `DEFAULT 1` | Target semester (1–4) |
| `description` | `TEXT` | `NULLABLE` | Deskripsi singkat mata kuliah |
| `sort_order` | `SMALLINT` | `NOT NULL`, `DEFAULT 0` | Urutan tampil di Beranda |
| `is_published` | `BOOLEAN` | `NOT NULL`, `DEFAULT true` | Status tayang |
| `created_at` | `TIMESTAMPTZ` | `NOT NULL`, `DEFAULT NOW()` | Waktu dibuat |

---

### 4.5 Tabel `videos` (Modul VOD Micro-Learning & Bedah Soal)
Menyimpan metadata video dan referensi ID Cloudflare Stream.

| Nama Kolom | Tipe Data | Constraints | Keterangan |
| :--- | :--- | :--- | :--- |
| `id` | `UUID` | `PRIMARY KEY`, `DEFAULT gen_random_uuid()` | ID video |
| `course_id` | `UUID` | `NOT NULL`, `FK -> courses(id) ON DELETE RESTRICT` | Mata kuliah induk |
| `tutor_id` | `UUID` | `NOT NULL`, `FK -> tutors(id) ON DELETE RESTRICT` | Tutor pembuat video (untuk hitung royalti) |
| `title` | `VARCHAR(200)` | `NOT NULL` | Judul video (maks 2 baris di UI) |
| `category` | `video_category_enum` | `NOT NULL`, `DEFAULT 'MATERI'` | `'MATERI'`, `'UTS'`, atau `'UAS'` |
| `university_tag` | `university_enum` | `NULLABLE` | Jika spesifik bedah soal kampus tertentu (misal `'UNRI'`) |
| `duration_seconds` | `INTEGER` | `NOT NULL`, `CHECK (duration_seconds > 0)` | Durasi dalam detik (contoh: `420` untuk 7 menit) |
| `cf_video_uid` | `VARCHAR(100)` | `NOT NULL` | ID video di Cloudflare Stream (bukan URL publik!) |
| `summary_markdown`| `TEXT` | `NULLABLE` | Isi tab **"Catatan / Ringkasan Rumus"** (mendukung LaTeX) |
| `is_free` | `BOOLEAN` | `NOT NULL`, `DEFAULT false` | `true` untuk 1 video gratis (*teaser*) per matkul |
| `is_published` | `BOOLEAN` | `NOT NULL`, `DEFAULT true` | Status tayang |
| `sort_order` | `SMALLINT` | `NOT NULL`, `DEFAULT 0` | Urutan modul dalam mata kuliah |
| `created_at` | `TIMESTAMPTZ` | `NOT NULL`, `DEFAULT NOW()` | Waktu rilis |

* **Indexes:** `idx_videos_course_filter` pada `(course_id, category, university_tag)`.

---

### 4.6 Tabel `video_chapters` (Penanda Waktu / Bab di Dalam Video)
Menampilkan daftar sub-bab di tab **"Bab"** bawah video player.

| Nama Kolom | Tipe Data | Constraints | Keterangan |
| :--- | :--- | :--- | :--- |
| `id` | `UUID` | `PRIMARY KEY`, `DEFAULT gen_random_uuid()` | ID chapter |
| `video_id` | `UUID` | `NOT NULL`, `FK -> videos(id) ON DELETE CASCADE` | Video induk |
| `title` | `VARCHAR(150)` | `NOT NULL` | Contoh: `'Rumus Turunan Rantai'` |
| `start_second` | `INTEGER` | `NOT NULL`, `CHECK (start_second >= 0)` | Detik mulai (contoh: `125` untuk menit 02:05) |
| `sort_order` | `SMALLINT` | `NOT NULL`, `DEFAULT 0` | Urutan bab |

---

### 4.7 Tabel `watch_histories` (Progres Tonton, Bookmark, & Akumulasi Royalti)
Satu tabel terpadu untuk fitur *"Lanjut Menonton"*, menu *"Tersimpan (Bookmark)"*, dan penghitungan jam tonton tutor.

| Nama Kolom | Tipe Data | Constraints | Keterangan |
| :--- | :--- | :--- | :--- |
| `id` | `UUID` | `PRIMARY KEY`, `DEFAULT gen_random_uuid()` | ID baris |
| `user_id` | `UUID` | `NOT NULL`, `FK -> users(id) ON DELETE CASCADE` | Mahasiswa yang menonton |
| `video_id` | `UUID` | `NOT NULL`, `FK -> videos(id) ON DELETE CASCADE` | Video yang ditonton |
| `last_position_sec`| `INTEGER` | `NOT NULL`, `DEFAULT 0` | Posisi detik terakhir (untuk *Resume Playing*) |
| `total_watched_sec`| `INTEGER` | `NOT NULL`, `DEFAULT 0` | Total akumulasi detik ditonton (dasar bagi hasil royalti tutor) |
| `is_completed` | `BOOLEAN` | `NOT NULL`, `DEFAULT false` | `true` jika sudah menonton $\ge 85\%$ durasi video |
| `is_bookmarked` | `BOOLEAN` | `NOT NULL`, `DEFAULT false` | `true` jika muncul di tab **Tersimpan** |
| `last_watched_at` | `TIMESTAMPTZ` | `NOT NULL`, `DEFAULT NOW()` | Diurutkan `DESC` untuk daftar *"Lanjut Menonton"* |

* **Unique Constraint (SANGAT PENTING):** `uq_user_video_progress` pada `(user_id, video_id)`. Gunakan `INSERT ... ON CONFLICT (user_id, video_id) DO UPDATE` saat melakukan sync dari Flutter.

---

### 4.8 Tabel `archive_questions` (Bank Arsip & Kuis Latihan Soal)
Menyimpan soal-soal UTS/UAS terdahulu untuk fitur **Latihan Soal Interaktif** di tab Arsip.

| Nama Kolom | Tipe Data | Constraints | Keterangan |
| :--- | :--- | :--- | :--- |
| `id` | `UUID` | `PRIMARY KEY`, `DEFAULT gen_random_uuid()` | ID soal |
| `course_id` | `UUID` | `NOT NULL`, `FK -> courses(id) ON DELETE CASCADE` | Mata kuliah terkait |
| `university_tag` | `university_enum` | `NOT NULL` | Asal kampus soal (UNRI/UIN_SUSKA/PCR/UIR) |
| `exam_type` | `exam_type_enum` | `NOT NULL` | `'UTS'` atau `'UAS'` |
| `academic_year` | `VARCHAR(20)` | `NOT NULL` | Contoh: `'2024/2025'` |
| `question_markdown`| `TEXT` | `NOT NULL` | Teks soal (mendukung rumus LaTeX `$...$`) |
| `options_json` | `JSONB` | `NOT NULL` | Array pilihan ganda: `[{"key":"A","text":"..."}, ...]` |
| `correct_key` | `CHAR(1)` | `NOT NULL` | Kunci jawaban benar (`'A'`, `'B'`, `'C'`, atau `'D'`) |
| `explanation_md` | `TEXT` | `NOT NULL` | Pembahasan langkah demi langkah setelah dijawab |
| `related_video_id`| `UUID` | `NULLABLE`, `FK -> videos(id) ON DELETE SET NULL`| Tombol *"Tonton Video Pembahasan"* jika masih bingung |
| `created_at` | `TIMESTAMPTZ` | `NOT NULL`, `DEFAULT NOW()` | Waktu input soal |

---

### 4.9 Tabel `vouchers` & `transactions` (Mesin Monetisasi QRIS)

#### A. Tabel `vouchers`
| Nama Kolom | Tipe Data | Constraints | Keterangan |
| :--- | :--- | :--- | :--- |
| `code` | `VARCHAR(30)` | `PRIMARY KEY` | Kode kapital (contoh: `'PANAM10'`, `'UINSUSKA'`) |
| `discount_amount` | `INTEGER` | `NOT NULL`, `CHECK (discount_amount > 0)` | Potongan harga dalam Rupiah (contoh: `10000`) |
| `max_quota` | `INTEGER` | `NOT NULL`, `DEFAULT 100` | Batas maksimal pemakaian |
| `used_count` | `INTEGER` | `NOT NULL`, `DEFAULT 0` | Jumlah yang sudah terpakai (`SUCCESS`) |
| `valid_until` | `TIMESTAMPTZ` | `NOT NULL` | Batas waktu kode berlaku |
| `is_active` | `BOOLEAN` | `NOT NULL`, `DEFAULT true` | Status aktif |

#### B. Tabel `transactions`
| Nama Kolom | Tipe Data | Constraints | Keterangan |
| :--- | :--- | :--- | :--- |
| `id` | `UUID` | `PRIMARY KEY`, `DEFAULT gen_random_uuid()` | ID transaksi internal |
| `invoice_number` | `VARCHAR(50)` | `NOT NULL`, `UNIQUE` | Contoh: `'INV-TKL-20261108-001'` |
| `user_id` | `UUID` | `NOT NULL`, `FK -> users(id) ON DELETE RESTRICT` | Pembeli |
| `voucher_code` | `VARCHAR(30)` | `NULLABLE`, `FK -> vouchers(code) ON DELETE RESTRICT`| Kode voucher yang dipakai (jika ada) |
| `base_amount` | `INTEGER` | `NOT NULL`, `DEFAULT 49000` | Harga normal (`49000`) |
| `discount_amount` | `INTEGER` | `NOT NULL`, `DEFAULT 0` | Nominal diskon |
| `final_amount` | `INTEGER` | `NOT NULL`, `CHECK (final_amount >= 0)` | Nominal bersih yang ditagihkan ke QRIS |
| `payment_status` | `payment_status_enum`| `NOT NULL`, `DEFAULT 'PENDING'` | `'PENDING'`, `'SUCCESS'`, `'FAILED'`, `'EXPIRED'` |
| `external_pg_id` | `VARCHAR(100)` | `NULLABLE`, `UNIQUE` | ID referensi dari Xendit / Midtrans |
| `qris_string` | `TEXT` | `NULLABLE` | Payload string QRIS untuk di-render jadi QR Code |
| `expires_at` | `TIMESTAMPTZ` | `NOT NULL` | Batas waktu bayar QRIS (`NOW() + 15 minutes`) |
| `paid_at` | `TIMESTAMPTZ` | `NULLABLE` | Waktu webhook pembayaran lunas diterima |
| `created_at` | `TIMESTAMPTZ` | `NOT NULL`, `DEFAULT NOW()` | Waktu checkout dibuat |

---

## 5. Kode Implementasi Drizzle ORM (`src/db/schema.ts`)

Salin kode di bawah ini langsung ke dalam project Backend Hono.js Anda agar tipe data TypeScript dan PostgreSQL selalu sinkron 100%:

```typescript
import {
  pgTable,
  uuid,
  varchar,
  text,
  integer,
  smallint,
  boolean,
  timestamp,
  char,
  jsonb,
  numeric,
  pgEnum,
  uniqueIndex,
  index,
} from 'drizzle-orm/pg-core';

// 1. ENUMS
export const universityEnum = pgEnum('university_enum', [
  'UNRI',
  'UIN_SUSKA',
  'PCR',
  'UIR',
  'UMRI',
  'LAINNYA',
]);
export const videoCategoryEnum = pgEnum('video_category_enum', ['MATERI', 'UTS', 'UAS']);
export const examTypeEnum = pgEnum('exam_type_enum', ['UTS', 'UAS']);
export const paymentStatusEnum = pgEnum('payment_status_enum', [
  'PENDING',
  'SUCCESS',
  'FAILED',
  'EXPIRED',
]);
export const userRoleEnum = pgEnum('user_role_enum', ['STUDENT', 'TUTOR', 'ADMIN']);

// 2. USERS TABLE
export const users = pgTable(
  'users',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    email: varchar('email', { length: 255 }).notNull().unique(),
    fullName: varchar('full_name', { length: 150 }).notNull(),
    nim: varchar('nim', { length: 50 }).notNull(),
    university: universityEnum('university').default('UIN_SUSKA').notNull(),
    semester: smallint('semester').default(1).notNull(),
    phoneNumber: varchar('phone_number', { length: 20 }),
    role: userRoleEnum('role').default('STUDENT').notNull(),
    activeDeviceId: varchar('active_device_id', { length: 255 }),
    deviceUpdatedAt: timestamp('device_updated_at', { withTimezone: true }),
    referralCode: varchar('referral_code', { length: 20 }).notNull().unique(),
    referredById: uuid('referred_by_id'),
    subscriptionValidUntil: timestamp('subscription_valid_until', { withTimezone: true }),
    isActive: boolean('is_active').default(true).notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => ({
    emailIdx: uniqueIndex('idx_users_email').on(table.email),
    referralIdx: uniqueIndex('idx_users_referral_code').on(table.referralCode),
  })
);

// 3. EMAIL OTPS TABLE
export const emailOtps = pgTable(
  'email_otps',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    email: varchar('email', { length: 255 }).notNull(),
    otpCode: char('otp_code', { length: 6 }).notNull(),
    attempts: smallint('attempts').default(0).notNull(),
    isUsed: boolean('is_used').default(false).notNull(),
    expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => ({
    lookupIdx: index('idx_email_otps_lookup').on(table.email, table.isUsed, table.expiresAt),
  })
);

// 4. TUTORS TABLE
export const tutors = pgTable('tutors', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id')
    .notNull()
    .unique()
    .references(() => users.id, { onDelete: 'cascade' }),
  bioTitle: varchar('bio_title', { length: 150 }).notNull(),
  bankName: varchar('bank_name', { length: 50 }),
  bankAccountNo: varchar('bank_account_no', { length: 50 }),
  revenueShareWeight: numeric('revenue_share_weight', { precision: 5, scale: 2 })
    .default('1.00')
    .notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});

// 5. COURSES TABLE
export const courses = pgTable('courses', {
  id: uuid('id').defaultRandom().primaryKey(),
  slug: varchar('slug', { length: 100 }).notNull().unique(),
  title: varchar('title', { length: 150 }).notNull(),
  symbol: varchar('symbol', { length: 10 }).notNull(),
  semesterTarget: smallint('semester_target').default(1).notNull(),
  description: text('description'),
  sortOrder: smallint('sort_order').default(0).notNull(),
  isPublished: boolean('is_published').default(true).notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});

// 6. VIDEOS TABLE
export const videos = pgTable(
  'videos',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    courseId: uuid('course_id')
      .notNull()
      .references(() => courses.id, { onDelete: 'restrict' }),
    tutorId: uuid('tutor_id')
      .notNull()
      .references(() => tutors.id, { onDelete: 'restrict' }),
    title: varchar('title', { length: 200 }).notNull(),
    category: videoCategoryEnum('category').default('MATERI').notNull(),
    universityTag: universityEnum('university_tag'),
    durationSeconds: integer('duration_seconds').notNull(),
    cfVideoUid: varchar('cf_video_uid', { length: 100 }).notNull(),
    summaryMarkdown: text('summary_markdown'),
    isFree: boolean('is_free').default(false).notNull(),
    isPublished: boolean('is_published').default(true).notNull(),
    sortOrder: smallint('sort_order').default(0).notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => ({
    courseFilterIdx: index('idx_videos_course_filter').on(
      table.courseId,
      table.category,
      table.universityTag
    ),
  })
);

// 7. VIDEO CHAPTERS TABLE
export const videoChapters = pgTable('video_chapters', {
  id: uuid('id').defaultRandom().primaryKey(),
  videoId: uuid('video_id')
    .notNull()
    .references(() => videos.id, { onDelete: 'cascade' }),
  title: varchar('title', { length: 150 }).notNull(),
  startSecond: integer('start_second').notNull(),
  sortOrder: smallint('sort_order').default(0).notNull(),
});

// 8. WATCH HISTORIES & BOOKMARKS TABLE
export const watchHistories = pgTable(
  'watch_histories',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    videoId: uuid('video_id')
      .notNull()
      .references(() => videos.id, { onDelete: 'cascade' }),
    lastPositionSec: integer('last_position_sec').default(0).notNull(),
    totalWatchedSec: integer('total_watched_sec').default(0).notNull(),
    isCompleted: boolean('is_completed').default(false).notNull(),
    isBookmarked: boolean('is_bookmarked').default(false).notNull(),
    lastWatchedAt: timestamp('last_watched_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => ({
    userVideoUnique: uniqueIndex('uq_user_video_progress').on(table.userId, table.videoId),
  })
);

// 9. ARCHIVE QUESTIONS TABLE
export const archiveQuestions = pgTable('archive_questions', {
  id: uuid('id').defaultRandom().primaryKey(),
  courseId: uuid('course_id')
    .notNull()
    .references(() => courses.id, { onDelete: 'cascade' }),
  universityTag: universityEnum('university_tag').notNull(),
  examType: examTypeEnum('exam_type').notNull(),
  academicYear: varchar('academic_year', { length: 20 }).notNull(),
  questionMarkdown: text('question_markdown').notNull(),
  optionsJson: jsonb('options_json').notNull(),
  correctKey: char('correct_key', { length: 1 }).notNull(),
  explanationMd: text('explanation_md').notNull(),
  relatedVideoId: uuid('related_video_id').references(() => videos.id, { onDelete: 'set null' }),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});

// 10. VOUCHERS & TRANSACTIONS TABLES
export const vouchers = pgTable('vouchers', {
  code: varchar('code', { length: 30 }).primaryKey(),
  discountAmount: integer('discount_amount').notNull(),
  maxQuota: integer('max_quota').default(100).notNull(),
  usedCount: integer('used_count').default(0).notNull(),
  validUntil: timestamp('valid_until', { withTimezone: true }).notNull(),
  isActive: boolean('is_active').default(true).notNull(),
});

export const transactions = pgTable('transactions', {
  id: uuid('id').defaultRandom().primaryKey(),
  invoiceNumber: varchar('invoice_number', { length: 50 }).notNull().unique(),
  userId: uuid('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'restrict' }),
  voucherCode: varchar('voucher_code', { length: 30 }).references(() => vouchers.code, {
    onDelete: 'restrict',
  }),
  baseAmount: integer('base_amount').default(49000).notNull(),
  discountAmount: integer('discount_amount').default(0).notNull(),
  finalAmount: integer('final_amount').notNull(),
  paymentStatus: paymentStatusEnum('payment_status').default('PENDING').notNull(),
  externalPgId: varchar('external_pg_id', { length: 100 }).unique(),
  qrisString: text('qris_string'),
  expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
  paidAt: timestamp('paid_at', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});
```

---

## 6. SOP & Aturan Aman Database Migration (Anti-Bentrok)

Agar Anda dan tim tidak pernah mengalami kejadian *"data user hilang"* atau *"migration error karena bentrok dengan data lama"*, patuhi 5 aturan wajib berikut setiap kali ingin mengubah struktur tabel:

1. **Dilarang Pakai `drizzle-kit push` di Production:**
   * Gunakan `npx drizzle-kit generate` untuk membuat file SQL migrasi di dalam folder `src/db/migrations/`, periksa isi file `.sql`-nya secara manual, baru jalankan `npx drizzle-kit migrate`.
2. **Menambah Kolom Baru pada Tabel yang Sudah Ada Isinya:**
   * Jika tabel `users` sudah memiliki ratusan data mahasiswa, **jangan pernah** menambahkan kolom baru dengan sifat `NOT NULL` tanpa `DEFAULT` value. Database pasti akan menolak migrasi tersebut karena baris data lama tidak memiliki nilai untuk kolom baru itu.
   * **Solusi Aman:** Buat kolom baru sebagai `NULLABLE` terlebih dahulu, atau sertakan `.default(...)`.
3. **Mengubah nilai `ENUM`:**
   * PostgreSQL mengizinkan penambahan nilai baru ke dalam `ENUM` (`ALTER TYPE ... ADD VALUE`), tetapi **tidak mengizinkan penghapusan nilai ENUM** yang sudah terpakai di baris tabel. Jika ada nama kampus baru (misal `'UNILAK'`), cukup tambahkan di bagian paling bawah daftar `universityEnum`.
4. **Upsert Pattern untuk Progres Video & Bookmark:**
   * Saat menyimpan progres tontonan atau klik tombol *Bookmark*, jangan pernah melakukan `INSERT` biasa karena akan memicu error `duplicate key value violates unique constraint "uq_user_video_progress"`. Selalu gunakan klausa `.onConflictDoUpdate()` milik Drizzle.
5. **Perhitungan Royalti Tutor Bulanan (Contoh Query Resmi):**
   * Gunakan query standar ini setiap akhir bulan untuk membagi *Pool Royalti Tutor* (Rp3.500.000/bulan) agar perhitungannya selalu konsisten:
   ```sql
   SELECT 
     t.id AS tutor_id,
     u.full_name AS tutor_name,
     SUM(wh.total_watched_sec) / 60.0 AS total_minutes_watched
   FROM tutors t
   JOIN users u ON u.id = t.user_id
   JOIN videos v ON v.tutor_id = t.id
   JOIN watch_histories wh ON wh.video_id = v.id
   GROUP BY t.id, u.full_name
   ORDER BY total_minutes_watched DESC;
   ```