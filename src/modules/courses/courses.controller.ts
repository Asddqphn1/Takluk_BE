import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { videoFilterQuerySchema } from './courses.schema';
import { CourseService, CourseError } from './courses.service';
import { authMiddleware } from '../../middlewares/auth.middleware';
import { deviceMiddleware } from '../../middlewares/device.middleware';
import { successResponse, errorResponse } from '../../utils/api-response';
import type { JwtPayload } from '../../utils/jwt';

const courses = new Hono();
const courseService = new CourseService();

// GET /api/courses — Katalog mata kuliah
courses.get('/', async (c) => {
  try {
    const list = await courseService.getCourses();
    return successResponse(c, list, 'Katalog mata kuliah berhasil dimuat.');
  } catch (err) {
    console.error('[COURSES] getCourses error:', err);
    return errorResponse(c, 'INTERNAL_ERROR', 'Gagal memuat katalog mata kuliah.', 500);
  }
});

// GET /api/courses/videos — Filter video materi & bedah soal
courses.get(
  '/videos',
  zValidator('query', videoFilterQuerySchema, (result, c) => {
    if (!result.success) {
      return errorResponse(c, 'VALIDATION_ERROR', 'Parameter filter video tidak valid.', 422);
    }
  }),
  async (c) => {
    const query = c.req.valid('query');
    try {
      const list = await courseService.getVideos(query);
      return successResponse(c, list, 'Daftar video berhasil dimuat.');
    } catch (err) {
      console.error('[COURSES] getVideos error:', err);
      return errorResponse(c, 'INTERNAL_ERROR', 'Gagal memuat daftar video.', 500);
    }
  }
);

// GET /api/courses/videos/:id — Detail informasi materi video & bab (tanpa play)
courses.get('/videos/:id', async (c) => {
  const videoId = c.req.param('id');
  try {
    const video = await courseService.getVideoDetail(videoId);
    return successResponse(c, video, 'Detail video berhasil dimuat.');
  } catch (err) {
    if (err instanceof CourseError) {
      return errorResponse(c, err.code, err.message, err.status);
    }
    console.error('[COURSES] getVideoDetail error:', err);
    return errorResponse(c, 'INTERNAL_ERROR', 'Gagal memuat detail video.', 500);
  }
});

// GET /api/courses/videos/:id/play — Stream video HLS terenkripsi (Anti-Piracy)
courses.get('/videos/:id/play', authMiddleware, deviceMiddleware, async (c) => {
  const videoId = c.req.param('id');
  const payload = c.get('jwtPayload') as JwtPayload;

  try {
    const playData = await courseService.getPlayVideo(videoId, payload.sub);
    return successResponse(c, playData, 'Selamat belajar! Video siap diputar. 🎬');
  } catch (err) {
    if (err instanceof CourseError) {
      return errorResponse(c, err.code, err.message, err.status);
    }
    console.error('[COURSES] getPlayVideo error:', err);
    return errorResponse(c, 'INTERNAL_ERROR', 'Gagal menyiapkan pemutar video. Coba lagi nanti ya!', 500);
  }
});

export default courses;

