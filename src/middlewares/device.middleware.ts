import type { Context, Next } from 'hono';
import { eq } from 'drizzle-orm';
import { db } from '../db';
import { users } from '../db/schema';
import { errorResponse } from '../utils/api-response';
import type { JwtPayload } from '../utils/jwt';

export async function deviceMiddleware(c: Context, next: Next) {
  const payload = c.get('jwtPayload') as JwtPayload | undefined;
  if (!payload || !payload.sub) {
    return errorResponse(
      c,
      'UNAUTHORIZED',
      'Kamu belum login atau token kamu tidak valid. Silakan masuk terlebih dahulu ya!',
      401
    );
  }

  const deviceId = c.req.header('X-Device-ID');

  if (!deviceId) {
    return errorResponse(
      c,
      'DEVICE_ID_MISSING',
      'Header X-Device-ID wajib disertakan di setiap request ya!',
      400
    );
  }

  const [user] = await db
    .select({
      activeDeviceId: users.activeDeviceId,
      isActive: users.isActive,
    })
    .from(users)
    .where(eq(users.id, payload.sub))
    .limit(1);

  if (!user) {
    return errorResponse(
      c,
      'USER_NOT_FOUND',
      'Akun kamu tidak ditemukan. Silakan daftar ulang ya!',
      404
    );
  }

  if (!user.isActive) {
    return errorResponse(
      c,
      'ACCOUNT_DISABLED',
      'Akun kamu telah dinonaktifkan. Hubungi tim Takluk untuk bantuan.',
      403
    );
  }

  if (user.activeDeviceId && user.activeDeviceId !== deviceId) {
    return errorResponse(
      c,
      'DEVICE_MISMATCH',
      'Akun kamu telah login di perangkat lain. Silakan masuk kembali untuk memindahkan sesi ke perangkat ini.',
      403
    );
  }

  await next();
}
