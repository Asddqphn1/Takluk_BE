import type { Context } from 'hono';
import { HTTPException } from 'hono/http-exception';

export function errorHandler(err: Error, c: Context) {
  console.error(`[ERROR] ${err.message}`, err.stack);

  if (err instanceof HTTPException) {
    const status = err.status;
    return c.json(
      {
        success: false,
        error_code: getErrorCodeFromStatus(status),
        message: err.message || getDefaultMessage(status),
      },
      status
    );
  }

  // Zod validation errors (from @hono/zod-validator)
  if (err.name === 'ZodError') {
    return c.json(
      {
        success: false,
        error_code: 'VALIDATION_ERROR',
        message: 'Data yang kamu kirim tidak valid. Periksa kembali ya!',
      },
      400
    );
  }

  // Default 500 internal error
  return c.json(
    {
      success: false,
      error_code: 'INTERNAL_ERROR',
      message: 'Ups, terjadi kesalahan di server kami. Coba lagi nanti ya!',
    },
    500
  );
}

function getErrorCodeFromStatus(status: number): string {
  switch (status) {
    case 400: return 'BAD_REQUEST';
    case 401: return 'UNAUTHORIZED';
    case 402: return 'PAYMENT_REQUIRED';
    case 403: return 'FORBIDDEN';
    case 404: return 'NOT_FOUND';
    case 409: return 'CONFLICT';
    case 422: return 'UNPROCESSABLE_ENTITY';
    case 429: return 'TOO_MANY_REQUESTS';
    default: return 'INTERNAL_ERROR';
  }
}

function getDefaultMessage(status: number): string {
  switch (status) {
    case 400: return 'Permintaan kamu tidak valid.';
    case 401: return 'Kamu belum login atau sesi kamu sudah habis.';
    case 402: return 'Kamu perlu berlangganan untuk mengakses konten ini.';
    case 403: return 'Kamu tidak punya akses ke resource ini.';
    case 404: return 'Data yang kamu cari tidak ditemukan.';
    case 429: return 'Terlalu banyak percobaan. Tunggu sebentar ya!';
    default: return 'Terjadi kesalahan pada server.';
  }
}
