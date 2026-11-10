import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { logger } from 'hono/logger';
import { env } from './config/env';
import { errorHandler } from './middlewares/error.middleware';
import { authRoutes } from './modules/auth';
import { courseRoutes } from './modules/courses';
import { progressRoutes } from './modules/progress';
import { archiveRoutes } from './modules/archives';
import { paymentRoutes } from './modules/payments';
import { profileRouter as profileRoutes } from './modules/profile';
import { adminRoutes } from './modules/admin';
import { hubRoutes } from './modules/hub';
import { docsRoutes, openapiSpec } from './docs';

const app = new Hono();

// 1. Global Middlewares
app.use('*', logger());
app.use(
  '*',
  cors({
    origin: '*',
    allowHeaders: ['Content-Type', 'Authorization', 'X-Device-ID'],
    allowMethods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  })
);

// 2. Global Error Handler
app.onError(errorHandler);

// 3. Health Check
app.get('/', (c) => {
  return c.json({
    success: true,
    message: 'Takluk API (RuangKuliah Hub) berjalan dengan baik! 🎓',
    data: {
      name: 'takluk-api',
      version: '1.0.0',
      environment: env.NODE_ENV,
      server_time: new Date().toISOString(),
      docs_url: '/docs',
      openapi_json: '/openapi.json',
    },
  });
});

// 4. Swagger UI & OpenAPI Specification
app.route('/docs', docsRoutes);
app.get('/swagger', (c) => c.redirect('/docs'));
app.get('/openapi.json', (c) => c.json(openapiSpec));

// 5. API Business Routes (Feature-First Architecture)
app.route('/api/auth', authRoutes);
app.route('/api/courses', courseRoutes);
app.route('/api/progress', progressRoutes);
app.route('/api/archives', archiveRoutes);
app.route('/api/payments', paymentRoutes);
app.route('/api/profile', profileRoutes);
app.route('/api/admin', adminRoutes);
app.route('/api/hub', hubRoutes);

// 6. 404 Handler
app.notFound((c) => {
  return c.json(
    {
      success: false,
      error_code: 'NOT_FOUND',
      message: 'Halaman atau endpoint yang kamu tuju tidak ditemukan nih.',
    },
    404
  );
});

// Log server start
console.log(`
  🎓 ═══════════════════════════════════════════════════════
     Takluk API — RuangKuliah Hub (Panam, Pekanbaru)
     Server berjalan di: http://localhost:${env.PORT}
     Dokumentasi Swagger: http://localhost:${env.PORT}/docs
     OpenAPI JSON       : http://localhost:${env.PORT}/openapi.json
     Environment        : ${env.NODE_ENV}
     Routes Aktif:
       - /api/auth     : Request & Verify Email OTP + Device Binding
       - /api/profile  : Detail Akun, Ganti HP & Program Referral
       - /api/courses  : Katalog Matkul & Signed HLS Video Stream
       - /api/progress : Sync Riwayat Tonton, Royalti & Bookmark
       - /api/archives : Bank Latihan Soal UTS/UAS & Pembahasan
       - /api/payments : Checkout Dynamic QRIS, Webhook & Polling
       - /api/admin    : Laporan Bagi Hasil Royalti Tutor Bulanan
       - /api/hub      : Layanan Fisik Panam Academy Hub (O2O)
  ═══════════════════════════════════════════════════════ 🎓
`);

export default {
  port: env.PORT,
  fetch: app.fetch,
};
