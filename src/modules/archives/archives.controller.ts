import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { archiveFilterQuerySchema, evaluateAnswerSchema } from './archives.schema';
import { ArchiveService, ArchiveError } from './archives.service';
import { authMiddleware } from '../../middlewares/auth.middleware';
import { deviceMiddleware } from '../../middlewares/device.middleware';
import { successResponse, errorResponse } from '../../utils/api-response';

const archives = new Hono();
const archiveService = new ArchiveService();

// GET /api/archives — Daftar bank soal arsip ujian UTS/UAS
archives.get(
  '/',
  zValidator('query', archiveFilterQuerySchema, (result, c) => {
    if (!result.success) {
      return errorResponse(c, 'VALIDATION_ERROR', 'Filter arsip soal tidak valid.', 422);
    }
  }),
  async (c) => {
    const query = c.req.valid('query');

    try {
      const list = await archiveService.getQuestions(query);
      return successResponse(c, list, 'Bank soal arsip berhasil dimuat.');
    } catch (err) {
      console.error('[ARCHIVES] getQuestions error:', err);
      return errorResponse(c, 'INTERNAL_ERROR', 'Gagal memuat bank latihan soal.', 500);
    }
  }
);

// POST /api/archives/:id/evaluate — Periksa jawaban kuis & kirim pembahasan
archives.post(
  '/:id/evaluate',
  authMiddleware,
  deviceMiddleware,
  zValidator('json', evaluateAnswerSchema, (result, c) => {
    if (!result.success) {
      return errorResponse(c, 'VALIDATION_ERROR', 'Pilihan jawaban harus A, B, C, atau D.', 422);
    }
  }),
  async (c) => {
    const questionId = c.req.param('id');
    const { selected_key } = c.req.valid('json');

    try {
      const result = await archiveService.evaluateAnswer(questionId, selected_key);
      const message = result.is_correct
        ? 'Keren banget! Jawaban kamu benar! 🎉'
        : 'Yah, belum tepat nih. Pelajari pembahasannya di bawah ya! Semangat! 💪';

      return successResponse(c, result, message);
    } catch (err) {
      if (err instanceof ArchiveError) {
        return errorResponse(c, err.code, err.message, err.status);
      }
      console.error('[ARCHIVES] evaluate error:', err);
      return errorResponse(c, 'INTERNAL_ERROR', 'Gagal memeriksa jawaban latihan.', 500);
    }
  }
);

export default archives;

