import { Hono } from 'hono';
import { z } from 'zod';
import { zValidator } from '@hono/zod-validator';
import { successResponse, errorResponse } from '../../utils/api-response';

const hub = new Hono();

// Daftar Layanan Offline Panam Academy Hub (PRD Bab 4.2)
const HUB_SERVICES = [
  {
    id: 'svc-crash-course-h7',
    name: 'Crash Course H-7 Ujian',
    tagline: 'Review intensif kilat bersama tutor terbaik seminggu jelang UTS/UAS',
    category: 'EXAM_PREP',
    price_idr: 150000,
    price_formatted: 'Rp150.000',
    unit: 'per paket / matkul',
    location: 'Panam Academy Hub, Jl. HR. Soebrantas, Panam, Pekanbaru',
    features: [
      '3x sesi tatap muka intensif @120 menit',
      'Bedah langsung paket soal ujian 3 tahun terakhir',
      'Modul rangkuman rumus cetak eksklusif',
      'Free pass 3 hari di Quiet Study Space',
    ],
    is_available: true,
  },
  {
    id: 'svc-bootcamp-skripsi',
    name: 'Bootcamp Olah Data Skripsi (SPSS, PLS, Python)',
    tagline: 'Bimbingan privat olah data statistik skripsi dari nol hingga bab 4 tuntas',
    category: 'BOOTCAMP',
    price_idr: 450000,
    price_formatted: 'Rp450.000',
    unit: 'per peserta',
    location: 'Panam Academy Hub, Jl. HR. Soebrantas, Panam, Pekanbaru',
    features: [
      'Pendampingan uji validitas, reliabilitas & hipotesis',
      'Interpretasi output tabel sesuai pedoman kampus (UNRI, UIN, PCR, UIR)',
      'Konsultasi 1-on-1 bersama praktisi data analis',
      'Garansi revisi olah data hingga sidang',
    ],
    is_available: true,
  },
  {
    id: 'svc-study-space-daily',
    name: 'Pass Harian Quiet Study Space Panam',
    tagline: 'Tempat belajar ber-AC, hening, colokan di tiap meja & Wi-Fi kencang',
    category: 'COWORKING',
    price_idr: 20000,
    price_formatted: 'Rp20.000',
    unit: 'per hari (08.00 - 22.00 WIB)',
    location: 'Panam Academy Hub Lantai 2, Panam, Pekanbaru',
    features: [
      'Akses Wi-Fi High-Speed 100 Mbps',
      'Colokan listrik individual di setiap meja',
      'Free flow kopi & teh',
      'Ruang diskusi terpisah (Soundproof Booth)',
    ],
    is_available: true,
  },
];

const bookSchema = z.object({
  service_id: z.string().min(1, 'ID layanan wajib dipilih'),
  full_name: z.string().min(3, 'Nama lengkap minimal 3 karakter'),
  whatsapp: z
    .string()
    .regex(/^(\+62|62|0)8[1-9][0-9]{6,10}$/, 'Nomor WhatsApp tidak valid (contoh: 081234567890)'),
  university: z.enum(['UNRI', 'UIN_SUSKA', 'PCR', 'UIR', 'LAINNYA']),
  preferred_date: z.string().min(1, 'Pilih tanggal reservasi'),
  notes: z.string().max(250, 'Catatan maksimal 250 karakter').optional(),
});

// GET /api/hub/services — Katalog layanan fisik Panam Academy Hub
hub.get('/services', (c) => {
  return successResponse(
    c,
    {
      hub_name: 'Panam Academy Hub (O2O Learning Hub)',
      address: 'Jl. HR. Soebrantas (Dekat Simpang Garuda Sakti), Panam, Pekanbaru, Riau',
      operational_hours: 'Setiap Hari 08:00 - 22:00 WIB',
      services: HUB_SERVICES,
    },
    'Katalog layanan Panam Academy Hub berhasil dimuat.'
  );
});

// POST /api/hub/book — Reservasi layanan fisik
hub.post(
  '/book',
  zValidator('json', bookSchema, (result, c) => {
    if (!result.success) {
      return errorResponse(c, 'VALIDATION_ERROR', 'Data reservasi belum lengkap.', 422);
    }
  }),
  (c) => {
    const input = c.req.valid('json');
    const selectedService = HUB_SERVICES.find((s) => s.id === input.service_id);

    if (!selectedService) {
      return errorResponse(c, 'SERVICE_NOT_FOUND', 'Layanan yang dipilih tidak tersedia.', 404);
    }

    const bookingCode = `HUB-${Date.now().toString().slice(-6)}`;

    return successResponse(
      c,
      {
        booking_code: bookingCode,
        service: {
          id: selectedService.id,
          name: selectedService.name,
          price_idr: selectedService.price_idr,
          price_formatted: selectedService.price_formatted,
        },
        student: {
          full_name: input.full_name,
          whatsapp: input.whatsapp,
          university: input.university,
        },
        preferred_date: input.preferred_date,
        notes: input.notes ?? null,
        status: 'CONFIRMED',
        instructions:
          'Tunjukkan kode booking ini ke front desk Panam Academy Hub saat kedatangan, atau bayar langsung via kasir QRIS.',
      },
      'Reservasi berhasil dibuat! Admin kami akan menghubungi nomor WhatsApp kamu untuk konfirmasi jadwal.',
      201
    );
  }
);

export default hub;

