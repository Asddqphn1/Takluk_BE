import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { syncProgressSchema } from './progress.schema';
import { ProgressService, ProgressError } from './progress.service';
import { authMiddleware } from '../../middlewares/auth.middleware';
import { deviceMiddleware } from '../../middlewares/device.middleware';
import { successResponse, errorResponse } from '../../utils/api-response';
import type { JwtPayload } from '../../utils/jwt';

const progress = new Hono();
const progressService = new ProgressService();

// Seluruh endpoint progress membutuhkan autentikasi & validasi single device binding
progress.use('*', authMiddleware, deviceMiddleware);

// POST /api/progress/sync — Sync progres detik tonton & bookmark
progress.post(
  '/sync',
  zValidator('json', syncProgressSchema, (result, c) => {
    if (!result.success) {
      return errorResponse(c, 'VALIDATION_ERROR', 'Data sinkronisasi progres tidak valid.', 422);
    }
  }),
  async (c) => {
    const input = c.req.valid('json');
    const payload = c.get('jwtPayload') as JwtPayload;

    try {
      const data = await progressService.syncProgress(payload.sub, input);
      return successResponse(c, data, 'Progres belajar kamu berhasil disimpan! ⏱️');
    } catch (err) {
      if (err instanceof ProgressError) {
        return errorResponse(c, err.code, err.message, err.status);
      }
      console.error('[PROGRESS] sync error:', err);
      return errorResponse(c, 'INTERNAL_ERROR', 'Gagal menyimpan progres belajar.', 500);
    }
  }
);

// GET /api/progress/resume — Daftar video yang belum selesai ditonton
progress.get('/resume', async (c) => {
  const payload = c.get('jwtPayload') as JwtPayload;

  try {
    const list = await progressService.getResumeWatching(payload.sub);
    return successResponse(c, list, 'Daftar lanjut menonton berhasil dimuat.');
  } catch (err) {
    console.error('[PROGRESS] resume error:', err);
    return errorResponse(c, 'INTERNAL_ERROR', 'Gagal memuat riwayat tonton.', 500);
  }
});

// GET /api/progress/bookmarks — Daftar video yang disimpan
progress.get('/bookmarks', async (c) => {
  const payload = c.get('jwtPayload') as JwtPayload;

  try {
    const list = await progressService.getBookmarks(payload.sub);
    return successResponse(c, list, 'Daftar materi tersimpan berhasil dimuat. 🔖');
  } catch (err) {
    console.error('[PROGRESS] bookmarks error:', err);
    return errorResponse(c, 'INTERNAL_ERROR', 'Gagal memuat materi tersimpan.', 500);
  }
});

export default progress;

