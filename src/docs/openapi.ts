export const openapiSpec = {
  openapi: '3.0.3',
  info: {
    title: 'Takluk API — RuangKuliah Hub',
    version: '1.0.0',
    description: `
**Takluk (RuangKuliah Hub)** adalah backend RESTful API untuk ekosistem bimbingan belajar mahasiswa berbasis video *micro-learning* (5–10 menit) dan bedah arsip soal ujian lokal di kawasan Panam, Pekanbaru (UNRI, UIN Suska, PCR, UIR).

### Fitur Keamanan & Arsitektur Utama:
- **Single Device Binding:** Membatasi 1 akun hanya dapat aktif pada 1 perangkat fisik dengan membandingkan header \`X-Device-ID\` terhadap database.
- **Signed HLS Video Stream:** URL video tidak disimpan secara publik; API menghasilkan Cloudflare Stream Signed URL (\`.m3u8\`) sementara berdurasi 2 jam.
- **ACID Transaction:** Pembayaran QRIS Midtrans & kuota voucher diproses secara atomik dengan database transaction.
- **Standar Respons Seragam:**
  - Sukses: \`{ "success": true, "message": "...", "data": ... }\`
  - Gagal: \`{ "success": false, "error_code": "...", "message": "..." }\`
    `,
    contact: {
      name: 'Tim Pengembang Takluk',
      email: 'dev@takluk.id',
      url: 'https://takluk.id',
    },
  },
  servers: [
    {
      url: 'http://localhost:3000',
      description: 'Local Development Server (Bun)',
    },
    {
      url: 'https://api.takluk.id',
      description: 'Production Server',
    },
  ],
  tags: [
    { name: 'Auth', description: 'Autentikasi Email OTP & Single Device Binding' },
    { name: 'Profile', description: 'Profil Mahasiswa, Status Langganan, Pergantian HP, & Referral' },
    { name: 'Courses', description: 'Katalog Mata Kuliah & Cloudflare Stream Signed URL' },
    { name: 'Progress', description: 'Progres Tontonan, Royalti Jam Belajar Tutor, & Bookmark' },
    { name: 'Archives', description: 'Bank Latihan Soal Arsip UTS/UAS & Evaluasi Kuis' },
    { name: 'Payments', description: 'Langganan Rp25.000/bln, Voucher Promo, Webhook & Polling QRIS Midtrans' },
    { name: 'Admin', description: 'Laporan Royalti Tutor Sebaya & Manajemen Sistem' },
    { name: 'Panam Hub', description: 'Layanan Fisik Panam Academy Hub (O2O Study Space & Crash Course)' },
  ],
  components: {
    securitySchemes: {
      BearerAuth: {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        description: 'Token JWT yang diperoleh setelah verifikasi OTP berhasil.',
      },
      DeviceIdAuth: {
        type: 'apiKey',
        in: 'header',
        name: 'X-Device-ID',
        description: 'ID unik perangkat fisik smartphone mahasiswa (wajib untuk Single Device Binding).',
      },
    },
    schemas: {
      SuccessResponse: {
        type: 'object',
        properties: {
          success: { type: 'boolean', example: true },
          message: { type: 'string', example: 'Data berhasil diambil' },
          data: { type: 'object' },
        },
        required: ['success', 'message', 'data'],
      },
      ErrorResponse: {
        type: 'object',
        properties: {
          success: { type: 'boolean', example: false },
          error_code: { type: 'string', example: 'DEVICE_MISMATCH' },
          message: { type: 'string', example: 'Akun kamu telah login di perangkat lain.' },
        },
        required: ['success', 'error_code', 'message'],
      },
      User: {
        type: 'object',
        properties: {
          id: { type: 'string', format: 'uuid', example: 'c1f74b40-8451-4688-92b6-5ec5b5c9ce7d' },
          email: { type: 'string', format: 'email', example: 'aisyah@takluk.dev' },
          full_name: { type: 'string', example: 'Aisyah Putri' },
          nim: { type: 'string', example: '12250312345' },
          university: { type: 'string', enum: ['UNRI', 'UIN_SUSKA', 'PCR', 'UIR', 'UMRI', 'LAINNYA'], example: 'UIN_SUSKA' },
          semester: { type: 'integer', example: 3 },
          role: { type: 'string', enum: ['STUDENT', 'TUTOR', 'ADMIN'], example: 'STUDENT' },
          subscription_valid_until: { type: 'string', format: 'date-time', nullable: true, example: '2026-12-08T19:30:00.000Z' },
          is_new_user: { type: 'boolean', example: false },
        },
      },
      Course: {
        type: 'object',
        properties: {
          id: { type: 'string', format: 'uuid', example: 'd2a63e52-1f4a-4712-9c31-7b0b2e31a101' },
          slug: { type: 'string', example: 'kalkulus-dasar-1' },
          title: { type: 'string', example: 'Kalkulus' },
          symbol: { type: 'string', example: '∫' },
          semesterTarget: { type: 'integer', example: 1 },
          description: { type: 'string', example: 'Mata kuliah dasar kalkulus: limit, turunan, dan integral.' },
          sortOrder: { type: 'integer', example: 1 },
        },
      },
      VideoSummary: {
        type: 'object',
        properties: {
          id: { type: 'string', format: 'uuid' },
          courseId: { type: 'string', format: 'uuid' },
          courseTitle: { type: 'string', example: 'Kalkulus' },
          courseSymbol: { type: 'string', example: '∫' },
          tutorName: { type: 'string', example: 'Rizki Pratama' },
          tutorBio: { type: 'string', example: 'Asisten Lab Kalkulus UNRI • IPK 3.92' },
          title: { type: 'string', example: 'Pengenalan Limit Fungsi — Konsep Dasar & Teorema Apit' },
          category: { type: 'string', enum: ['MATERI', 'UTS', 'UAS'], example: 'MATERI' },
          universityTag: { type: 'string', nullable: true, example: null },
          durationSeconds: { type: 'integer', example: 450 },
          isFree: { type: 'boolean', example: true },
          sortOrder: { type: 'integer', example: 1 },
          createdAt: { type: 'string', format: 'date-time' },
        },
      },
      VideoPlayDetails: {
        type: 'object',
        properties: {
          video_id: { type: 'string', format: 'uuid' },
          title: { type: 'string', example: 'Bedah Soal UTS Kalkulus UNRI 2024' },
          category: { type: 'string', example: 'UTS' },
          university_tag: { type: 'string', example: 'UNRI' },
          duration_seconds: { type: 'integer', example: 600 },
          is_free: { type: 'boolean', example: false },
          hls_stream_url: {
            type: 'string',
            format: 'uri',
            example: 'https://customer-id_akun_cf.cloudflarestream.com/token_signed_jwt/manifest/video.m3u8',
            description: 'Signed URL Cloudflare Stream HLS (.m3u8) berlaku selama 2 jam.',
          },
          expires_in_seconds: { type: 'integer', example: 7200 },
          summary_markdown: { type: 'string', example: '### Rumus Limit Trigonometri\n$$\\lim_{x \\to 0} \\frac{\\sin ax}{bx} = \\frac{a}{b}$$' },
          chapters: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                id: { type: 'string', format: 'uuid' },
                title: { type: 'string', example: '01. Pengantar & Konsep Masalah' },
                start_second: { type: 'integer', example: 0 },
                sort_order: { type: 'integer', example: 1 },
              },
            },
          },
        },
      },
      ArchiveQuestion: {
        type: 'object',
        properties: {
          id: { type: 'string', format: 'uuid' },
          courseId: { type: 'string', format: 'uuid' },
          courseTitle: { type: 'string', example: 'Kalkulus' },
          courseSymbol: { type: 'string', example: '∫' },
          universityTag: { type: 'string', example: 'UNRI' },
          examType: { type: 'string', example: 'UTS' },
          academicYear: { type: 'string', example: '2024/2025' },
          questionMarkdown: { type: 'string', example: 'Berapakah nilai dari $\\lim_{x \\to 0} \\frac{1 - \\cos 4x}{x^2}$?' },
          optionsJson: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                key: { type: 'string', example: 'A' },
                text: { type: 'string', example: '4' },
              },
            },
          },
          relatedVideoId: { type: 'string', format: 'uuid', nullable: true },
          createdAt: { type: 'string', format: 'date-time' },
        },
      },
    },
  },
  paths: {
    // ═════════════════════════════════════════════════════════════
    // AUTH MODULE
    // ═════════════════════════════════════════════════════════════
    '/api/auth/request-otp': {
      post: {
        tags: ['Auth'],
        summary: 'Request kode OTP ke email mahasiswa',
        description: 'Menghasilkan 6 digit angka OTP (berlaku 5 menit) dan mengirimkan via Resend Email dengan HTML template Takluk. Mode development menyediakan OTP dummy `123456`. Terdapat proteksi jeda 60 detik antar request.',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  email: { type: 'string', format: 'email', example: 'aisyah@takluk.dev' },
                },
                required: ['email'],
              },
            },
          },
        },
        responses: {
          200: {
            description: 'Kode OTP berhasil dikirim',
            content: {
              'application/json': {
                schema: {
                  $ref: '#/components/schemas/SuccessResponse',
                },
                example: {
                  success: true,
                  message: 'Kode OTP berhasil dikirim ke email kamu. Cek inbox ya!',
                  data: { email: 'aisyah@takluk.dev' },
                },
              },
            },
          },
          422: {
            description: 'Format email tidak valid',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/ErrorResponse' },
                example: {
                  success: false,
                  error_code: 'VALIDATION_ERROR',
                  message: 'Format email tidak valid. Periksa kembali ya!',
                },
              },
            },
          },
        },
      },
    },
    '/api/auth/verify-otp': {
      post: {
        tags: ['Auth'],
        summary: 'Verifikasi OTP, binding device, & terbitkan JWT',
        description: 'Memverifikasi kode 6 digit OTP (maksimal 5 kali salah). Jika user belum pernah terdaftar, data profil (Nama, NIM, Kampus) wajib diisi. Pada saat sukses, `active_device_id` di database ditimpa dengan `device_id` terbaru (*Single Device Binding*) dan JWT 7 hari diterbitkan.',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  email: { type: 'string', format: 'email', example: 'aisyah@takluk.dev' },
                  otp_code: { type: 'string', example: '123456' },
                  device_id: { type: 'string', example: 'hp-samsung-aisyah-panam-01' },
                  full_name: { type: 'string', example: 'Aisyah Putri' },
                  nim: { type: 'string', example: '12250312345' },
                  university: { type: 'string', enum: ['UNRI', 'UIN_SUSKA', 'PCR', 'UIR', 'UMRI', 'LAINNYA'], example: 'UIN_SUSKA' },
                  semester: { type: 'integer', example: 3 },
                  phone_number: { type: 'string', nullable: true, example: '081234567890' },
                },
                required: ['email', 'otp_code', 'device_id'],
              },
            },
          },
        },
        responses: {
          200: {
            description: 'Login berhasil (User lama)',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean', example: true },
                    message: { type: 'string', example: 'Hai Aisyah Putri! Selamat datang kembali di Takluk. 👋' },
                    data: {
                      type: 'object',
                      properties: {
                        token: { type: 'string', example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...' },
                        user: { $ref: '#/components/schemas/User' },
                      },
                    },
                  },
                },
              },
            },
          },
          201: {
            description: 'Pendaftaran & login berhasil (User baru)',
          },
          401: {
            description: 'OTP salah atau kedaluwarsa',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/ErrorResponse' },
                example: {
                  success: false,
                  error_code: 'OTP_INVALID',
                  message: 'Kode OTP salah. Kamu punya 4 kesempatan lagi.',
                },
              },
            },
          },
          429: {
            description: 'Batas 5 kali percobaan terlampaui',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/ErrorResponse' },
                example: {
                  success: false,
                  error_code: 'OTP_MAX_ATTEMPTS',
                  message: 'Kamu sudah 5 kali salah memasukkan kode. Minta kode OTP baru ya!',
                },
              },
            },
          },
        },
      },
    },

    // ═════════════════════════════════════════════════════════════
    // COURSES MODULE
    // ═════════════════════════════════════════════════════════════
    '/api/courses': {
      get: {
        tags: ['Courses'],
        summary: 'Katalog seluruh mata kuliah aktif',
        description: 'Mengambil daftar mata kuliah momok (Kalkulus, Statistika, Pemrograman) lengkap dengan simbol thumbnail tipografi.',
        responses: {
          200: {
            description: 'Katalog berhasil dimuat',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean', example: true },
                    message: { type: 'string', example: 'Katalog mata kuliah berhasil dimuat.' },
                    data: {
                      type: 'array',
                      items: { $ref: '#/components/schemas/Course' },
                    },
                  },
                },
              },
            },
          },
        },
      },
    },
    '/api/courses/videos': {
      get: {
        tags: ['Courses'],
        summary: 'Daftar video dengan filter mata kuliah & kampus',
        description: 'Filter modul micro-learning berdasarkan ID mata kuliah, kategori (`MATERI`/`UTS`/`UAS`), dan tag kampus asal dosen.',
        parameters: [
          { name: 'course_id', in: 'query', schema: { type: 'string', format: 'uuid' }, description: 'ID unik mata kuliah' },
          { name: 'category', in: 'query', schema: { type: 'string', enum: ['MATERI', 'UTS', 'UAS'] }, description: 'Kategori modul video' },
          { name: 'university_tag', in: 'query', schema: { type: 'string', enum: ['UNRI', 'UIN_SUSKA', 'PCR', 'UIR', 'UMRI', 'LAINNYA'] }, description: 'Tag kampus asal soal' },
        ],
        responses: {
          200: {
            description: 'Daftar video berhasil dimuat',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean', example: true },
                    message: { type: 'string', example: 'Daftar video berhasil dimuat.' },
                    data: {
                      type: 'array',
                      items: { $ref: '#/components/schemas/VideoSummary' },
                    },
                  },
                },
              },
            },
          },
        },
      },
    },
    '/api/courses/videos/{id}/play': {
      get: {
        tags: ['Courses'],
        summary: 'Putar video: Signed HLS Stream URL (.m3u8)',
        description: `
Endpoint aman untuk memutar video materi:
1. Memverifikasi Bearer Token JWT dan mengecek kesesuaian header \`X-Device-ID\` (*Single Device Binding*).
2. Mengecek apakah video berlabel gratis (\`is_free = true\`).
3. Jika video berbayar, mengecek masa aktif langganan pengguna (\`subscription_valid_until > NOW()\`). Tolak dengan \`402 PAYMENT_REQUIRED\` jika belum langganan.
4. Menghasilkan *Cloudflare Stream Signed URL* berdurasi 2 jam beserta bab navigasi dan catatan rumus digital.
        `,
        security: [{ BearerAuth: [], DeviceIdAuth: [] }],
        parameters: [
          { name: 'id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' }, description: 'ID video yang akan diputar' },
        ],
        responses: {
          200: {
            description: 'URL Signed HLS siap diputar',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean', example: true },
                    message: { type: 'string', example: 'Selamat belajar! Video siap diputar. 🎬' },
                    data: { $ref: '#/components/schemas/VideoPlayDetails' },
                  },
                },
              },
            },
          },
          401: {
            description: 'Token JWT tidak valid atau belum login',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/ErrorResponse' },
                example: {
                  success: false,
                  error_code: 'UNAUTHORIZED',
                  message: 'Kamu belum login. Silakan masuk terlebih dahulu ya!',
                },
              },
            },
          },
          402: {
            description: 'Video berbayar & masa langganan tidak aktif',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/ErrorResponse' },
                example: {
                  success: false,
                  error_code: 'PAYMENT_REQUIRED',
                  message: 'Materi ini khusus untuk pelanggan Takluk. Yuk, langganan sekarang cuma Rp25.000/bulan!',
                },
              },
            },
          },
          403: {
            description: 'Device Mismatch (Akun login di HP lain)',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/ErrorResponse' },
                example: {
                  success: false,
                  error_code: 'DEVICE_MISMATCH',
                  message: 'Akun kamu telah login di perangkat lain. Silakan masuk kembali untuk memindahkan sesi ke perangkat ini.',
                },
              },
            },
          },
          404: {
            description: 'Video tidak ditemukan',
          },
        },
      },
    },

    // ═════════════════════════════════════════════════════════════
    // PROGRESS MODULE
    // ═════════════════════════════════════════════════════════════
    '/api/progress/sync': {
      post: {
        tags: ['Progress'],
        summary: 'Sync progres tonton, hitung royalti tutor, & bookmark',
        description: 'Dipanggil secara heartbeat periodik (setiap 30 detik atau saat jeda/selesai). Menggunakan klausa `INSERT ... ON CONFLICT (user_id, video_id) DO UPDATE` untuk memperbarui posisi detik terakhir, mengakumulasi total durasi tonton (dasar royalti tutor), dan menandai status selesai jika durasi tonton mencapai >= 85%.',
        security: [{ BearerAuth: [], DeviceIdAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  video_id: { type: 'string', format: 'uuid' },
                  last_position_sec: { type: 'integer', example: 240, description: 'Posisi detik video terakhir' },
                  watched_delta_sec: { type: 'integer', example: 30, description: 'Pertambahan detik tonton sejak heartbeat terakhir' },
                  is_bookmarked: { type: 'boolean', example: true, description: 'Status simpan video' },
                },
                required: ['video_id', 'last_position_sec'],
              },
            },
          },
        },
        responses: {
          200: {
            description: 'Progres berhasil disimpan',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean', example: true },
                    message: { type: 'string', example: 'Progres belajar kamu berhasil disimpan! ⏱️' },
                    data: {
                      type: 'object',
                      properties: {
                        video_id: { type: 'string', format: 'uuid' },
                        last_position_sec: { type: 'integer', example: 240 },
                        total_watched_sec: { type: 'integer', example: 450 },
                        is_completed: { type: 'boolean', example: false },
                        is_bookmarked: { type: 'boolean', example: true },
                        last_watched_at: { type: 'string', format: 'date-time' },
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
    },
    '/api/progress/resume': {
      get: {
        tags: ['Progress'],
        summary: 'Daftar video "Lanjut Menonton" untuk Beranda',
        description: 'Mengambil maksimal 5 video terakhir yang belum selesai ditonton oleh pengguna yang sedang login.',
        security: [{ BearerAuth: [], DeviceIdAuth: [] }],
        responses: {
          200: {
            description: 'Daftar lanjut menonton berhasil dimuat',
          },
        },
      },
    },
    '/api/progress/bookmarks': {
      get: {
        tags: ['Progress'],
        summary: 'Daftar materi yang disimpan (Tab Tersimpan)',
        description: 'Mengambil seluruh video yang ditandai `is_bookmarked = true` oleh pengguna.',
        security: [{ BearerAuth: [], DeviceIdAuth: [] }],
        responses: {
          200: {
            description: 'Daftar bookmark berhasil dimuat',
          },
        },
      },
    },

    // ═════════════════════════════════════════════════════════════
    // ARCHIVES MODULE
    // ═════════════════════════════════════════════════════════════
    '/api/archives': {
      get: {
        tags: ['Archives'],
        summary: 'Daftar bank latihan soal arsip UTS/UAS kampus lokal',
        description: 'Menampilkan kumpulan arsip soal ujian dosen terdahulu lengkap dengan opsi pilihan ganda berformat LaTeX.',
        parameters: [
          { name: 'course_id', in: 'query', schema: { type: 'string', format: 'uuid' } },
          { name: 'university_tag', in: 'query', schema: { type: 'string', enum: ['UNRI', 'UIN_SUSKA', 'PCR', 'UIR', 'UMRI', 'LAINNYA'] } },
          { name: 'exam_type', in: 'query', schema: { type: 'string', enum: ['UTS', 'UAS'] } },
        ],
        responses: {
          200: {
            description: 'Daftar soal berhasil dimuat',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean', example: true },
                    message: { type: 'string', example: 'Bank soal arsip berhasil dimuat.' },
                    data: {
                      type: 'array',
                      items: { $ref: '#/components/schemas/ArchiveQuestion' },
                    },
                  },
                },
              },
            },
          },
        },
      },
    },
    '/api/archives/{id}/evaluate': {
      post: {
        tags: ['Archives'],
        summary: 'Evaluasi kuis pilihan ganda & pembahasan instan',
        description: 'Mengecek pilihan jawaban mahasiswa (A, B, C, atau D), mengembalikan feedback benar/salah, kunci jawaban asli, penjelasan pembahasan LaTeX step-by-step, dan rekomendasi video terkait.',
        security: [{ BearerAuth: [], DeviceIdAuth: [] }],
        parameters: [
          { name: 'id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' }, description: 'ID soal arsip' },
        ],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  selected_key: { type: 'string', enum: ['A', 'B', 'C', 'D'], example: 'B' },
                },
                required: ['selected_key'],
              },
            },
          },
        },
        responses: {
          200: {
            description: 'Hasil evaluasi jawaban',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean', example: true },
                    message: { type: 'string', example: 'Keren banget! Jawaban kamu benar! 🎉' },
                    data: {
                      type: 'object',
                      properties: {
                        question_id: { type: 'string', format: 'uuid' },
                        selected_key: { type: 'string', example: 'B' },
                        is_correct: { type: 'boolean', example: true },
                        correct_key: { type: 'string', example: 'B' },
                        explanation_md: { type: 'string', example: '### Pembahasan Soal\nGunakan permutasi $P(5,2) = 20$.' },
                        related_video_id: { type: 'string', format: 'uuid', nullable: true },
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
    },

    // ═════════════════════════════════════════════════════════════
    // PAYMENTS MODULE
    // ═════════════════════════════════════════════════════════════
    '/api/payments/qris': {
      post: {
        tags: ['Payments'],
        summary: 'Checkout langganan Rp25.000/bln & request Dynamic QRIS',
        description: 'Memvalidasi kuota dan masa aktif kode voucher (misal: `PANAM10`, `UINSUSKA`), menghitung nominal akhir dari harga dasar Rp25.000 dalam tipe data `INTEGER`, menyimpan transaksi berstatus `PENDING` selama 15 menit, dan meminta pembuatan payload string Dynamic QRIS.',
        security: [{ BearerAuth: [], DeviceIdAuth: [] }],
        requestBody: {
          required: false,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  voucher_code: { type: 'string', example: 'PANAM10', description: 'Kode voucher diskon' },
                },
              },
            },
          },
        },
        responses: {
          201: {
            description: 'Invoice QRIS berhasil dibuat',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean', example: true },
                    message: { type: 'string', example: 'Invoice QRIS berhasil dibuat! Silakan bayar dalam 15 menit ya.' },
                    data: {
                      type: 'object',
                      properties: {
                        invoice_number: { type: 'string', example: 'INV-TKL-20261108-AB12C' },
                        base_amount: { type: 'integer', example: 25000 },
                        discount_amount: { type: 'integer', example: 10000 },
                        final_amount: { type: 'integer', example: 15000 },
                        voucher_code: { type: 'string', nullable: true, example: 'PANAM10' },
                        payment_status: { type: 'string', example: 'PENDING' },
                        qris_string: { type: 'string', example: '00020101021226580016ID.CO.MIDTRANS.WWW...' },
                        expires_at: { type: 'string', format: 'date-time', example: '2026-11-08T19:47:00.000Z' },
                        expires_in_seconds: { type: 'integer', example: 900 },
                      },
                    },
                  },
                },
              },
            },
          },
          400: {
            description: 'Voucher tidak valid atau kuota habis',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/ErrorResponse' },
                example: {
                  success: false,
                  error_code: 'VOUCHER_QUOTA_EXCEEDED',
                  message: 'Yah, kuota pemakaian kode voucher ini sudah habis.',
                },
              },
            },
          },
        },
      },
    },
    '/api/payments/webhook': {
      post: {
        tags: ['Payments'],
        summary: 'Webhook verifikasi pembayaran lunas dari Midtrans',
        description: 'Endpoint publik yang ditembak oleh server Midtrans. Memvalidasi tanda tangan kriptografi SHA-512 `(order_id + status_code + gross_amount + ServerKey)`. Jika status pembayaran lunas (`settlement`/`capture accept`), transaksi diperbarui ke `SUCCESS`, pemakaian voucher dinaikkan, dan masa aktif langganan pengguna diperpanjang 30 hari secara atomik.',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  order_id: { type: 'string', example: 'INV-TKL-20261108-AB12C' },
                  status_code: { type: 'string', example: '200' },
                  gross_amount: { type: 'string', example: '15000.00' },
                  signature_key: { type: 'string', example: '5d41402abc4b2a76b9719d911017c592...' },
                  transaction_status: { type: 'string', example: 'settlement' },
                  fraud_status: { type: 'string', example: 'accept' },
                  transaction_id: { type: 'string', example: 'midtrans-trx-987654321' },
                },
                required: ['order_id', 'status_code', 'gross_amount', 'signature_key', 'transaction_status'],
              },
            },
          },
        },
        responses: {
          200: {
            description: 'Webhook berhasil diproses',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean', example: true },
                    message: { type: 'string', example: 'Pembayaran QRIS berhasil! Masa aktif langganan Takluk diperpanjang 30 hari.' },
                    data: {
                      type: 'object',
                      properties: {
                        status: { type: 'string', example: 'SUCCESS' },
                        message: { type: 'string', example: 'Pembayaran QRIS berhasil! Masa aktif langganan Takluk diperpanjang 30 hari.' },
                      },
                    },
                  },
                },
              },
            },
          },
          403: {
            description: 'Signature token Midtrans tidak sah',
          },
          404: {
            description: 'Invoice tidak ditemukan',
          },
        },
      },
    },
    '/api/payments/history': {
      get: {
        tags: ['Payments'],
        summary: 'Riwayat transaksi pembayaran langganan pengguna',
        description: 'Mengambil daftar transaksi pembayaran pengguna lengkap dengan nominal, status, kode voucher, dan tanggal bayar.',
        security: [{ BearerAuth: [], DeviceIdAuth: [] }],
        responses: {
          200: {
            description: 'Riwayat transaksi berhasil dimuat',
          },
        },
      },
    },
    '/api/payments/{invoice_number}/status': {
      get: {
        tags: ['Payments'],
        summary: 'Polling status pembayaran QRIS',
        description: 'Digunakan oleh aplikasi Flutter untuk polling status transaksi secara real-time hingga berstatus SUCCESS.',
        security: [{ BearerAuth: [], DeviceIdAuth: [] }],
        parameters: [
          {
            name: 'invoice_number',
            in: 'path',
            required: true,
            schema: { type: 'string', example: 'INV-TKL-20261108-AB12C' },
            description: 'Nomor invoice transaksi',
          },
        ],
        responses: {
          200: {
            description: 'Status pembayaran berhasil diambil',
          },
          404: {
            description: 'Invoice tidak ditemukan',
          },
        },
      },
    },

    // ═════════════════════════════════════════════════════════════
    // PROFILE MODULE
    // ═════════════════════════════════════════════════════════════
    '/api/profile/me': {
      get: {
        tags: ['Profile'],
        summary: 'Ambil data profil mahasiswa & status langganan aktif',
        description: 'Menampilkan data profil lengkap, sisa hari langganan, dan status kartu akun.',
        security: [{ BearerAuth: [], DeviceIdAuth: [] }],
        responses: {
          200: {
            description: 'Profil mahasiswa berhasil diambil',
          },
        },
      },
      patch: {
        tags: ['Profile'],
        summary: 'Perbarui data profil mahasiswa (WhatsApp, semester, prodi)',
        security: [{ BearerAuth: [], DeviceIdAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  phone_number: { type: 'string', example: '081298765432' },
                  semester: { type: 'integer', example: 5 },
                  major: { type: 'string', example: 'Teknik Informatika' },
                },
              },
            },
          },
        },
        responses: {
          200: {
            description: 'Profil berhasil diperbarui',
          },
        },
      },
    },
    '/api/profile/device': {
      get: {
        tags: ['Profile'],
        summary: 'Informasi perangkat terikat saat ini',
        description: 'Menampilkan ID perangkat yang aktif saat ini (*Single Device Binding*) dan kebijakan keamanan.',
        security: [{ BearerAuth: [], DeviceIdAuth: [] }],
        responses: {
          200: {
            description: 'Data perangkat berhasil diambil',
          },
        },
      },
    },
    '/api/profile/device/reset': {
      post: {
        tags: ['Profile'],
        summary: 'Prosedur penggantian HP baru (Request OTP / Konfirmasi)',
        description: 'Jika dipanggil tanpa `otp_code`, sistem mengirim OTP konfirmasi ke email. Jika dipanggil dengan `otp_code` & `new_device_id`, binding perangkat diperbarui.',
        security: [{ BearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  new_device_id: { type: 'string', example: 'device-samsung-s24-xyz' },
                  otp_code: { type: 'string', example: '123456' },
                },
                required: ['new_device_id'],
              },
            },
          },
        },
        responses: {
          200: {
            description: 'OTP terkirim atau perangkat berhasil direset',
          },
        },
      },
    },
    '/api/profile/referral': {
      get: {
        tags: ['Profile'],
        summary: 'Statistik kode referral & bonus hari langganan',
        description: 'Menampilkan kode referral unik, total teman yang diajak, dan bonus hari langganan yang didapatkan.',
        security: [{ BearerAuth: [], DeviceIdAuth: [] }],
        responses: {
          200: {
            description: 'Data referral berhasil dimuat',
          },
        },
      },
    },

    // ═════════════════════════════════════════════════════════════
    // ADMIN MODULE
    // ═════════════════════════════════════════════════════════════
    '/api/admin/royalties/monthly': {
      get: {
        tags: ['Admin'],
        summary: 'Laporan bagi hasil Pool Royalti Tutor bulanan (Rp3,5 Juta)',
        description: 'Menghitung total menit tonton mahasiswa per tutor dan mengalokasikan estimasi royalti sesuai proporsi menit tonton.',
        responses: {
          200: {
            description: 'Laporan royalti tutor berhasil dihitung',
          },
        },
      },
    },

    // ═════════════════════════════════════════════════════════════
    // PANAM ACADEMY HUB (O2O) MODULE
    // ═════════════════════════════════════════════════════════════
    '/api/hub/services': {
      get: {
        tags: ['Panam Hub'],
        summary: 'Katalog layanan fisik Panam Academy Hub',
        description: 'Menampilkan daftar Crash Course H-7 Ujian, Bootcamp Olah Data Skripsi, dan Pass Harian Quiet Study Space Panam.',
        responses: {
          200: {
            description: 'Katalog layanan Panam Hub berhasil dimuat',
          },
        },
      },
    },
    '/api/hub/book': {
      post: {
        tags: ['Panam Hub'],
        summary: 'Reservasi kelas fisik atau pass belajar Panam Hub',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  service_id: { type: 'string', example: 'svc-crash-course-h7' },
                  full_name: { type: 'string', example: 'Aisyah Putri' },
                  whatsapp: { type: 'string', example: '081277889900' },
                  university: { type: 'string', enum: ['UNRI', 'UIN_SUSKA', 'PCR', 'UIR', 'LAINNYA'], example: 'UNRI' },
                  preferred_date: { type: 'string', example: '2026-11-15' },
                  notes: { type: 'string', example: 'Kelas Kalkulus Lanjut' },
                },
                required: ['service_id', 'full_name', 'whatsapp', 'university', 'preferred_date'],
              },
            },
          },
        },
        responses: {
          201: {
            description: 'Reservasi berhasil dibuat',
          },
        },
      },
    },
  },
};

