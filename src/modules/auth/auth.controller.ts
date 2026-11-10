import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { requestOtpSchema, verifyOtpSchema } from './auth.schema';
import { AuthService, OtpError } from './auth.service';
import { successResponse, errorResponse } from '../../utils/api-response';

const auth = new Hono();
const authService = new AuthService();

auth.post(
  '/request-otp',
  zValidator('json', requestOtpSchema, (result, c) => {
    if (!result.success) {
      return errorResponse(
        c,
        'VALIDATION_ERROR',
        'Format email tidak valid. Periksa kembali ya!',
        422
      );
    }
  }),
  async (c) => {
    const { email } = c.req.valid('json');

    try {
      const result = await authService.requestOtp(email);
      return successResponse(c, { email }, result.message);
    } catch (err) {
      console.error('[AUTH] requestOtp error:', err);
      return errorResponse(
        c,
        'INTERNAL_ERROR',
        'Gagal mengirim kode OTP. Coba lagi nanti ya!',
        500
      );
    }
  }
);

auth.post(
  '/verify-otp',
  zValidator('json', verifyOtpSchema, (result, c) => {
    if (!result.success) {
      return errorResponse(
        c,
        'VALIDATION_ERROR',
        'Data yang kamu kirim tidak lengkap atau tidak valid.',
        422
      );
    }
  }),
  async (c) => {
    const input = c.req.valid('json');

    try {
      const result = await authService.verifyOtp(input);

      const message = result.user.is_new_user
        ? `Selamat datang di Takluk, ${result.user.full_name}! 🎉 Akun kamu berhasil dibuat.`
        : `Hai ${result.user.full_name}! Selamat datang kembali di Takluk. 👋`;

      return successResponse(c, result, message, result.user.is_new_user ? 201 : 200);
    } catch (err) {
      if (err instanceof OtpError) {
        const statusMap: Record<string, 400 | 401 | 422 | 429> = {
          OTP_EXPIRED: 401,
          OTP_MAX_ATTEMPTS: 429,
          OTP_INVALID: 401,
          PROFILE_REQUIRED: 422,
        };
        return errorResponse(
          c,
          err.code,
          err.message,
          statusMap[err.code] ?? 400
        );
      }
      console.error('[AUTH] verifyOtp error:', err);
      return errorResponse(
        c,
        'INTERNAL_ERROR',
        'Gagal memverifikasi OTP. Coba lagi nanti ya!',
        500
      );
    }
  }
);

export default auth;
