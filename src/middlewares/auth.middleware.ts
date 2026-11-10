import type { Context, Next } from 'hono';
import { verifyJwt, type JwtPayload } from '../utils/jwt';
import { errorResponse } from '../utils/api-response';

// Extend Hono's context variables
declare module 'hono' {
  interface ContextVariableMap {
    jwtPayload: JwtPayload;
  }
}

export async function authMiddleware(c: Context, next: Next) {
  const authHeader = c.req.header('Authorization');

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return errorResponse(
      c,
      'UNAUTHORIZED',
      'Kamu belum login. Silakan masuk terlebih dahulu ya!',
      401
    );
  }

  const token = authHeader.substring(7);

  try {
    const payload = await verifyJwt(token);

    // Check token expiry
    const now = Math.floor(Date.now() / 1000);
    if (payload.exp < now) {
      return errorResponse(
        c,
        'TOKEN_EXPIRED',
        'Sesi kamu sudah habis. Silakan login kembali ya!',
        401
      );
    }

    c.set('jwtPayload', payload);
    await next();
  } catch {
    return errorResponse(
      c,
      'INVALID_TOKEN',
      'Token kamu tidak valid. Silakan login kembali ya!',
      401
    );
  }
}
