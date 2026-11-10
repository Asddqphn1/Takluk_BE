import { db } from './index';
import {
  users,
  emailOtps,
  tutors,
  courses,
  videos,
  videoChapters,
  vouchers,
  archiveQuestions,
  watchHistories,
  transactions,
} from './schema';

export async function runSeeder() {
  console.log('🌱 Memulai seeding data dummy Takluk (RuangKuliah Hub)...\n');

  try {
    // 1. Bersihkan data lama dengan urutan relasi foreign key
    console.log('🧹 Membersihkan data sebelumnya...');
    await db.delete(transactions);
    await db.delete(watchHistories);
    await db.delete(archiveQuestions);
    await db.delete(videoChapters);
    await db.delete(videos);
    await db.delete(tutors);
    await db.delete(courses);
    await db.delete(vouchers);
    await db.delete(emailOtps);
    await db.delete(users);

    // 2. SEED USERS (Aisyah Putri, Tutor Sebaya, dan Admin)
    console.log('👤 Menyemai data mahasiswa & pengguna...');
    const [demoUser] = await db
      .insert(users)
      .values({
        email: 'aisyah@takluk.dev',
        fullName: 'Aisyah Putri',
        nim: '12250312345',
        university: 'UIN_SUSKA',
        semester: 3,
        phoneNumber: '081234567890',
        role: 'STUDENT',
        referralCode: 'AISY1234',
        activeDeviceId: 'demo-device-001',
        deviceUpdatedAt: new Date(),
        // Masa aktif langganan kosong/null (bisa langganan baru)
        subscriptionValidUntil: null,
      })
      .returning();

    const [tutorUser] = await db
      .insert(users)
      .values({
        email: 'rizki.tutor@takluk.dev',
        fullName: 'Rizki Pratama',
        nim: '12250167890',
        university: 'UNRI',
        semester: 7,
        phoneNumber: '081298765432',
        role: 'TUTOR',
        referralCode: 'RIZK5678',
        activeDeviceId: 'tutor-device-001',
        deviceUpdatedAt: new Date(),
      })
      .returning();

    const [adminUser] = await db
      .insert(users)
      .values({
        email: 'admin@takluk.dev',
        fullName: 'Admin Takluk Panam',
        nim: '00000000000',
        university: 'LAINNYA',
        semester: 1,
        role: 'ADMIN',
        referralCode: 'ADMN0001',
        activeDeviceId: 'admin-device-001',
        deviceUpdatedAt: new Date(),
      })
      .returning();

    console.log(`   ✅ User Demo: ${demoUser.fullName} (${demoUser.email}) • NIM ${demoUser.nim} • ${demoUser.university}`);
    console.log(`   ✅ Tutor Sebaya: ${tutorUser.fullName} (${tutorUser.email}) • ${tutorUser.university}`);
    console.log(`   ✅ Admin: ${adminUser.fullName} (${adminUser.email})`);

    // 3. SEED TUTOR PROFILE
    console.log('🎓 Menyemai profil tutor & royalti...');
    const [tutor] = await db
      .insert(tutors)
      .values({
        userId: tutorUser.id,
        bioTitle: 'Asisten Lab Kalkulus UNRI • IPK 3.92',
        bankName: 'Bank BRI',
        bankAccountNo: '1234567890123',
        revenueShareWeight: '1.00',
      })
      .returning();
    console.log(`   ✅ Tutor: ${tutor.bioTitle}`);

    // 4. SEED COURSES (3 Mata Kuliah: Kalkulus, Statistika, Pemrograman)
    console.log('📚 Menyemai data mata kuliah...');
    const [kalkulus] = await db
      .insert(courses)
      .values({
        slug: 'kalkulus-dasar-1',
        title: 'Kalkulus',
        symbol: '∫',
        semesterTarget: 1,
        description: 'Mata kuliah dasar kalkulus: limit, turunan, dan integral dengan penerapan pada soal ujian dosen UNRI, UIN Suska, PCR, dan UIR.',
        sortOrder: 1,
        isPublished: true,
      })
      .returning();

    const [statistika] = await db
      .insert(courses)
      .values({
        slug: 'statistika-dasar',
        title: 'Statistika',
        symbol: 'σ',
        semesterTarget: 2,
        description: 'Statistika dasar: penyajian data, ukuran pemusatan, probabilitas, dan distribusi sampling untuk persiapan UTS/UAS.',
        sortOrder: 2,
        isPublished: true,
      })
      .returning();

    const [pemrograman] = await db
      .insert(courses)
      .values({
        slug: 'pemrograman-dasar',
        title: 'Pemrograman',
        symbol: '</>',
        semesterTarget: 1,
        description: 'Konsep dasar logika algoritma, percabangan, perulangan, fungsi rekursif, dan bedah tipe soal coding ujian semester.',
        sortOrder: 3,
        isPublished: true,
      })
      .returning();

    console.log(`   ✅ ${kalkulus.title} (${kalkulus.symbol})`);
    console.log(`   ✅ ${statistika.title} (${statistika.symbol})`);
    console.log(`   ✅ ${pemrograman.title} (${pemrograman.symbol})`);

    // 5. SEED VIDEOS (Micro-learning 5-10 menit, 1 gratis per mata kuliah)
    console.log('🎬 Menyemai video micro-learning & bedah soal...');
    const videoList = [
      // KALKULUS
      {
        courseId: kalkulus.id,
        tutorId: tutor.id,
        title: 'Pengenalan Limit Fungsi — Konsep Dasar & Teorema Apit',
        category: 'MATERI' as const,
        universityTag: null,
        durationSeconds: 450, // 7.5 menit
        cfVideoUid: 'cf_stream_kalkulus_intro_limit',
        summaryMarkdown: `### Rangkuman Rumus Limit Fungsi\n\nLimit menjelaskan perilaku fungsi di dekat suatu titik:\n$$\\lim_{x \\to c} f(x) = L$$\n\n**Teorema Apit (Squeeze Theorem):**\nJika $g(x) \\le f(x) \\le h(x)$ dan $\\lim_{x \\to c} g(x) = \\lim_{x \\to c} h(x) = L$, maka:\n$$\\lim_{x \\to c} f(x) = L$$\n\n*Tips Ujian:* Faktorkan bentuk tak tentu $\\frac{0}{0}$ sebelum mensubstitusikan nilai $x$.`,
        isFree: true,
        sortOrder: 1,
      },
      {
        courseId: kalkulus.id,
        tutorId: tutor.id,
        title: 'Bedah Soal UTS Kalkulus UNRI 2024 — Limit Trigonometri & Kontinuitas',
        category: 'UTS' as const,
        universityTag: 'UNRI' as const,
        durationSeconds: 600, // 10 menit
        cfVideoUid: 'cf_stream_kalkulus_uts_unri_2024',
        summaryMarkdown: `### Bedah Soal UTS Kalkulus UNRI\n\nRumus sakti limit trigonometri:\n$$\\lim_{x \\to 0} \\frac{\\sin ax}{bx} = \\frac{a}{b}$$\n$$\\lim_{x \\to 0} \\frac{\\tan ax}{bx} = \\frac{a}{b}$$\n\nBentuk $1 - \\cos ax = 2\\sin^2\\left(\\frac{ax}{2}\\right)$.`,
        isFree: false,
        sortOrder: 2,
      },
      {
        courseId: kalkulus.id,
        tutorId: tutor.id,
        title: 'Bedah Soal UAS Kalkulus UIN Suska — Integral Substitusi & Parsial',
        category: 'UAS' as const,
        universityTag: 'UIN_SUSKA' as const,
        durationSeconds: 540, // 9 menit
        cfVideoUid: 'cf_stream_kalkulus_uas_uinsuska_2024',
        summaryMarkdown: `### Bedah UAS Kalkulus UIN Suska\n\n**Integral Parsial:**\n$$\\int u \\, dv = uv - \\int v \\, du$$\n\nPrioritas pemilihan $u$ (LIATE):\n1. Logaritma\n2. Invers Trigonometri\n3. Aljabar\n4. Trigonometri\n5. Eksponensial`,
        isFree: false,
        sortOrder: 3,
      },

      // STATISTIKA
      {
        courseId: statistika.id,
        tutorId: tutor.id,
        title: 'Ukuran Pemusatan Data: Mean, Median, Modus Kelompok',
        category: 'MATERI' as const,
        universityTag: null,
        durationSeconds: 420, // 7 menit
        cfVideoUid: 'cf_stream_statistika_pemusatan_data',
        summaryMarkdown: `### Rangkuman Statistika Deskriptif\n\n**Median Data Berkelompok:**\n$$Me = Tb + \\left( \\frac{\\frac{n}{2} - Fk}{f} \\right) p$$\n\n- $Tb$ = Tepi bawah kelas median\n- $n$ = Total frekuensi\n- $Fk$ = Frekuensi kumulatif sebelum kelas median\n- $f$ = Frekuensi kelas median\n- $p$ = Panjang kelas interval`,
        isFree: true,
        sortOrder: 1,
      },
      {
        courseId: statistika.id,
        tutorId: tutor.id,
        title: 'Bedah Soal UTS Statistika PCR — Distribusi Peluang Binomial',
        category: 'UTS' as const,
        universityTag: 'PCR' as const,
        durationSeconds: 510, // 8.5 menit
        cfVideoUid: 'cf_stream_statistika_uts_pcr_2024',
        summaryMarkdown: `### Distribusi Binomial\n\n$$P(X = x) = \\binom{n}{x} p^x (1-p)^{n-x}$$\n\nKriteria:\n1. Percobaan diulang $n$ kali independen.\n2. Hanya ada dua kemungkinan (Sukses / Gagal).\n3. Peluang sukses $p$ selalu konstan.`,
        isFree: false,
        sortOrder: 2,
      },

      // PEMROGRAMAN
      {
        courseId: pemrograman.id,
        tutorId: tutor.id,
        title: 'Logika Percabangan & Array 2 Dimensi — Python Dasar',
        category: 'MATERI' as const,
        universityTag: null,
        durationSeconds: 480, // 8 menit
        cfVideoUid: 'cf_stream_pemrograman_dasar_python',
        summaryMarkdown: `### Rangkuman Python Dasar\n\nNested list / Matriks:\n\`\`\`python\nmatrix = [\n    [1, 2, 3],\n    [4, 5, 6]\n]\nprint(matrix[0][1]) # Output: 2\n\`\`\`\n\nList Comprehension:\n\`\`\`python\nkuadrat = [x**2 for x in range(1, 6)] # [1, 4, 9, 16, 25]\n\`\`\``,
        isFree: true,
        sortOrder: 1,
      },
      {
        courseId: pemrograman.id,
        tutorId: tutor.id,
        title: 'Bedah Soal UTS Algoritma UIR — Fungsi Rekursif Fibonacci & Faktorial',
        category: 'UTS' as const,
        universityTag: 'UIR' as const,
        durationSeconds: 540, // 9 menit
        cfVideoUid: 'cf_stream_pemrograman_uts_uir_2024',
        summaryMarkdown: `### Fungsi Rekursif\n\nStruktur wajib:\n1. **Base Case:** Kondisi penghenti agar tidak infinite loop.\n2. **Recursive Step:** Memanggil diri sendiri menuju base case.\n\n\`\`\`python\ndef faktorial(n: int) -> int:\n    if n <= 1:\n        return 1\n    return n * faktorial(n - 1)\n\`\`\``,
        isFree: false,
        sortOrder: 2,
      },
    ];

    const insertedVideos = await db.insert(videos).values(videoList).returning();
    for (const v of insertedVideos) {
      console.log(`   ✅ [${v.isFree ? 'FREE' : 'PREMIUM'}] ${v.title}`);
    }

    // 6. SEED VIDEO CHAPTERS
    console.log('📑 Menyemai bab video (video_chapters)...');
    const chapterList = [];
    for (const v of insertedVideos) {
      chapterList.push(
        { videoId: v.id, title: '01. Pengantar & Konsep Masalah', startSecond: 0, sortOrder: 1 },
        { videoId: v.id, title: '02. Penjabaran Rumus / Algoritma', startSecond: Math.floor(v.durationSeconds * 0.25), sortOrder: 2 },
        { videoId: v.id, title: '03. Pembahasan Contoh Soal Ujian', startSecond: Math.floor(v.durationSeconds * 0.55), sortOrder: 3 },
        { videoId: v.id, title: '04. Tips Dosen & Jebakan Ujian', startSecond: Math.floor(v.durationSeconds * 0.85), sortOrder: 4 },
      );
    }
    await db.insert(videoChapters).values(chapterList);
    console.log(`   ✅ Ditambahkan ${chapterList.length} video chapters.`);

    // 7. SEED VOUCHERS (PANAM10 & UINSUSKA)
    console.log('🎟️ Menyemai data voucher promo...');
    await db.insert(vouchers).values([
      {
        code: 'PANAM10',
        discountAmount: 10000,
        maxQuota: 100,
        usedCount: 0,
        validUntil: new Date('2027-12-31T23:59:59Z'),
        isActive: true,
      },
      {
        code: 'UINSUSKA',
        discountAmount: 5000,
        maxQuota: 200,
        usedCount: 0,
        validUntil: new Date('2027-12-31T23:59:59Z'),
        isActive: true,
      },
    ]);
    console.log('   ✅ Voucher PANAM10 (Diskon Rp10.000, Kuota 100)');
    console.log('   ✅ Voucher UINSUSKA (Diskon Rp5.000, Kuota 200)');

    // 8. SEED ARCHIVE QUESTIONS (Bank Latihan Soal Arsip)
    console.log('📝 Menyemai bank soal arsip ujian...');
    const freeKalkulus = insertedVideos.find((v) => v.courseId === kalkulus.id && v.isFree);
    const freeStatistika = insertedVideos.find((v) => v.courseId === statistika.id && v.isFree);

    await db.insert(archiveQuestions).values([
      {
        courseId: kalkulus.id,
        universityTag: 'UNRI',
        examType: 'UTS',
        academicYear: '2024/2025',
        questionMarkdown: 'Berapakah nilai dari limit trigonometri berikut:\n$$\\lim_{x \\to 0} \\frac{1 - \\cos 4x}{x^2}$$',
        optionsJson: [
          { key: 'A', text: '4' },
          { key: 'B', text: '8' },
          { key: 'C', text: '16' },
          { key: 'D', text: '2' },
        ],
        correctKey: 'B',
        explanationMd: `### Pembahasan Soal UTS UNRI\n\nGunakan identitas $1 - \\cos 4x = 2\\sin^2(2x)$:\n\n$$\\lim_{x \\to 0} \\frac{2\\sin^2(2x)}{x^2} = 2 \\times \\left(\\lim_{x \\to 0} \\frac{\\sin 2x}{x}\\right)^2 = 2 \\times (2)^2 = 2 \\times 4 = 8$$\n\n**Jawaban Benar: B**`,
        relatedVideoId: freeKalkulus?.id ?? null,
      },
      {
        courseId: statistika.id,
        universityTag: 'UIN_SUSKA',
        examType: 'UTS',
        academicYear: '2024/2025',
        questionMarkdown: 'Dari 5 mahasiswa Teknik Informatika UIN Suska, berapa banyak cara memilih Ketua dan Sekretaris kelompok belajar?',
        optionsJson: [
          { key: 'A', text: '10 cara' },
          { key: 'B', text: '20 cara' },
          { key: 'C', text: '25 cara' },
          { key: 'D', text: '120 cara' },
        ],
        correctKey: 'B',
        explanationMd: `### Pembahasan Soal UTS UIN Suska\n\nKarena posisi Ketua dan Sekretaris memperhatikan urutan posisi (jabatan berbeda), gunakan **Permutasi** $P(n, r)$:\n\n$$P(5, 2) = \\frac{5!}{(5-2)!} = \\frac{5 \\times 4 \\times 3!}{3!} = 20$$\n\n**Jawaban Benar: B**`,
        relatedVideoId: freeStatistika?.id ?? null,
      },
      {
        courseId: pemrograman.id,
        universityTag: 'PCR',
        examType: 'UAS',
        academicYear: '2024/2025',
        questionMarkdown: 'Perhatikan potongan fungsi Python berikut:\n```python\ndef misteri(arr):\n    return [x for x in arr if x % 2 == 0]\n\nprint(misteri([1, 2, 3, 4, 5, 6]))\n```\nApa output yang dihasilkan di terminal?',
        optionsJson: [
          { key: 'A', text: '[1, 3, 5]' },
          { key: 'B', text: '[2, 4, 6]' },
          { key: 'C', text: '[0, 2, 4]' },
          { key: 'D', text: 'Error Sintaks' },
        ],
        correctKey: 'B',
        explanationMd: `### Pembahasan Soal UAS PCR\n\nKondisi \`x % 2 == 0\` menyaring hanya bilangan genap dalam list \`[1, 2, 3, 4, 5, 6]\`.\n\nHasil list yang memenuhi adalah \`[2, 4, 6]\`.\n\n**Jawaban Benar: B**`,
        relatedVideoId: null,
      },
    ]);
    console.log('   ✅ 3 Soal Arsip UTS/UAS terintegrasi materi.');

    // 9. SEED DUMMY OTP UNTUK AKUN DEMO AISYAH
    console.log('🔑 Menyemai OTP dummy 123456 untuk development...');
    await db.insert(emailOtps).values({
      email: 'aisyah@takluk.dev',
      otpCode: '123456',
      attempts: 0,
      isUsed: false,
      expiresAt: new Date('2099-12-31T23:59:59Z'),
    });
    console.log('   ✅ OTP dummy 123456 aktif untuk aisyah@takluk.dev');

    console.log('\n🎉 [SUKSES] Seeding selesai! Data Takluk siap digunakan.');
  } catch (error) {
    console.error('❌ Terjadi kesalahan saat seeding:', error);
    process.exit(1);
  }
}

// Jalankan jika dieksekusi langsung
if (import.meta.main) {
  runSeeder().then(() => {
    process.exit(0);
  });
}

