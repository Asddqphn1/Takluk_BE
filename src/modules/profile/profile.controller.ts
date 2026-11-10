import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { updateProfileSchema, resetDeviceSchema } from './profile.schema';
import { ProfileService, ProfileError } from './profile.service';
import { authMiddleware } from '../../middlewares/auth.middleware';
import { deviceMiddleware } from '../../middlewares/device.middleware';
import { successResponse, errorResponse } from '../../utils/api-response';
import type { JwtPayload } from '../../utils/jwt';

const profile = new Hono();
const profileService = new ProfileService();

// GET /api/profile/me (dan alias GET /api/profile) — Ambil data profil lengkap & status langganan
profile.get('/me', authMiddleware, deviceMiddleware, async (c) => {
  const payload = c.get('jwtPayload') as JwtPayload;

  try {
    const data = await profileService.getProfile(payload.sub);
    return successResponse(c, data, 'Data profil berhasil diambil.');
  } catch (err) {
    if (err instanceof ProfileError) {
      return errorResponse(c, err.code, err.message, err.status);
    }
    console.error('[PROFILE] getProfile error:', err);
    return errorResponse(c, 'INTERNAL_ERROR', 'Gagal memuat profil mahasiswa.', 500);
  }
});

// Alias GET /api/profile
profile.get('/', authMiddleware, deviceMiddleware, async (c) => {
  const payload = c.get('jwtPayload') as JwtPayload;

  try {
    const data = await profileService.getProfile(payload.sub);
    return successResponse(c, data, 'Data profil berhasil diambil.');
  } catch (err) {
    if (err instanceof ProfileError) {
      return errorResponse(c, err.code, err.message, err.status);
    }
    console.error('[PROFILE] getProfile error:', err);
    return errorResponse(c, 'INTERNAL_ERROR', 'Gagal memuat profil mahasiswa.', 500);
  }
});

// PATCH /api/profile/me — Perbarui data profil (WhatsApp, semester, prodi)
profile.patch(
  '/me',
  authMiddleware,
  deviceMiddleware,
  zValidator('json', updateProfileSchema, (result, c) => {
    if (!result.success) {
      return errorResponse(c, 'VALIDATION_ERROR', 'Format pembaruan profil tidak valid.', 422);
    }
  }),
  async (c) => {
    const payload = c.get('jwtPayload') as JwtPayload;
    const input = c.req.valid('json');

    try {
      const updated = await profileService.updateProfile(payload.sub, input);
      return successResponse(c, updated, 'Profil kamu berhasil diperbarui!');
    } catch (err) {
      if (err instanceof ProfileError) {
        return errorResponse(c, err.code, err.message, err.status);
      }
      console.error('[PROFILE] updateProfile error:', err);
      return errorResponse(c, 'INTERNAL_ERROR', 'Gagal memperbarui profil.', 500);
    }
  }
);

// GET /api/profile/device — Cek status binding perangkat fisik
profile.get('/device', authMiddleware, deviceMiddleware, async (c) => {
  const payload = c.get('jwtPayload') as JwtPayload;

  try {
    const info = await profileService.getDeviceInfo(payload.sub);
    return successResponse(c, info, 'Informasi perangkat berhasil diambil.');
  } catch (err) {
    if (err instanceof ProfileError) {
      return errorResponse(c, err.code, err.message, err.status);
    }
    console.error('[PROFILE] getDeviceInfo error:', err);
    return errorResponse(c, 'INTERNAL_ERROR', 'Gagal mengambil data perangkat.', 500);
  }
});

// POST /api/profile/device/reset — Minta OTP reset perangkat atau eksekusi pergantian HP
profile.post(
  '/device/reset',
  authMiddleware,
  zValidator('json', resetDeviceSchema, (result, c) => {
    if (!result.success) {
      return errorResponse(c, 'VALIDATION_ERROR', 'Parameter pergantian perangkat tidak valid.', 422);
    }
  }),
  async (c) => {
    const payload = c.get('jwtPayload') as JwtPayload;
    const input = c.req.valid('json');

    try {
      const result = await profileService.resetDevice(payload.sub, input);
      return successResponse(c, result, result.message);
    } catch (err) {
      if (err instanceof ProfileError) {
        return errorResponse(c, err.code, err.message, err.status);
      }
      console.error('[PROFILE] resetDevice error:', err);
      return errorResponse(c, 'INTERNAL_ERROR', 'Gagal memproses pergantian perangkat.', 500);
    }
  }
);

// GET /api/profile/referral — Statistik dan kode referral mahasiswa
profile.get('/referral', authMiddleware, deviceMiddleware, async (c) => {
  const payload = c.get('jwtPayload') as JwtPayload;

  try {
    const data = await profileService.getReferralInfo(payload.sub);
    return successResponse(c, data, 'Informasi program referral berhasil dimuat.');
  } catch (err) {
    if (err instanceof ProfileError) {
      return errorResponse(c, err.code, err.message, err.status);
    }
    console.error('[PROFILE] getReferralInfo error:', err);
    return errorResponse(c, 'INTERNAL_ERROR', 'Gagal memuat data referral.', 500);
  }
});

export default profile;

