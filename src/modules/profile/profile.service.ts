import { eq, and, sql, gt, count } from 'drizzle-orm';
import { db } from '../../db';
import { users, emailOtps } from '../../db/schema';
import { env } from '../../config/env';
import { generateOtpCode, buildOtpEmailHtml } from '../../utils/otp';
import { Resend } from 'resend';
import type { UpdateProfileInput, ResetDeviceInput } from './profile.schema';

export class ProfileService {
  private resend: Resend | null = null;

  constructor() {
    if (env.RESEND_API_KEY && !env.RESEND_API_KEY.includes('re_test_dummy')) {
      this.resend = new Resend(env.RESEND_API_KEY);
    }
  }

  /**
   * Mengambil detail profil user yang sedang login beserta status sisa hari langganan.
   */
  async getProfile(userId: string) {
    const [user] = await db
      .select()
      .from(users)
      .where(and(eq(users.id, userId), eq(users.isActive, true)))
      .limit(1);

    if (!user) {
      throw new ProfileError('USER_NOT_FOUND', 'Profil mahasiswa tidak ditemukan.', 404);
    }

    const now = new Date();
    const isSubscribed = user.subscriptionValidUntil ? user.subscriptionValidUntil > now : false;
    let remainingDays = 0;

    if (isSubscribed && user.subscriptionValidUntil) {
      const diffMs = user.subscriptionValidUntil.getTime() - now.getTime();
      remainingDays = Math.max(0, Math.ceil(diffMs / (1000 * 60 * 60 * 24)));
    }

    return {
      id: user.id,
      email: user.email,
      full_name: user.fullName,
      nim: user.nim,
      university: user.university,
      major: user.major,
      semester: user.semester,
      phone_number: user.phoneNumber,
      referral_code: user.referralCode,
      active_device_id: user.activeDeviceId,
      device_updated_at: user.deviceUpdatedAt ? user.deviceUpdatedAt.toISOString() : null,
      is_subscribed: isSubscribed,
      subscription_status: isSubscribed ? 'ACTIVE' : 'EXPIRED',
      subscription_valid_until: user.subscriptionValidUntil ? user.subscriptionValidUntil.toISOString() : null,
      remaining_subscription_days: remainingDays,
      created_at: user.createdAt.toISOString(),
    };
  }

  /**
   * Memperbarui profil yang diizinkan diubah (nomor telepon WhatsApp, semester, prodi).
   */
  async updateProfile(userId: string, input: UpdateProfileInput) {
    const updateData: Record<string, unknown> = {
      updatedAt: new Date(),
    };

    if (input.phone_number !== undefined) updateData.phoneNumber = input.phone_number;
    if (input.semester !== undefined) updateData.semester = input.semester;
    if (input.major !== undefined) updateData.major = input.major;

    const [updatedUser] = await db
      .update(users)
      .set(updateData)
      .where(eq(users.id, userId))
      .returning();

    if (!updatedUser) {
      throw new ProfileError('USER_NOT_FOUND', 'Profil mahasiswa tidak ditemukan.', 404);
    }

    return this.getProfile(userId);
  }

  /**
   * Mengambil informasi perangkat yang sedang terikat (Single Device Binding).
   */
  async getDeviceInfo(userId: string) {
    const [user] = await db
      .select({
        activeDeviceId: users.activeDeviceId,
        deviceUpdatedAt: users.deviceUpdatedAt,
        email: users.email,
      })
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);

    if (!user) {
      throw new ProfileError('USER_NOT_FOUND', 'Profil mahasiswa tidak ditemukan.', 404);
    }

    return {
      active_device_id: user.activeDeviceId,
      device_updated_at: user.deviceUpdatedAt ? user.deviceUpdatedAt.toISOString() : null,
      policy: '1 Akun Takluk hanya dapat aktif pada 1 perangkat fisik sekaligus demi perlindungan konten.',
      can_reset: true,
    };
  }

  /**
   * Reset / ganti perangkat fisik (Single Device Binding):
   * Jika otp_code belum dikirim: mengirimkan OTP konfirmasi ke email mahasiswa.
   * Jika otp_code disertakan: memvalidasi OTP dan menimpa active_device_id.
   */
  async resetDevice(userId: string, input: ResetDeviceInput) {
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);

    if (!user) {
      throw new ProfileError('USER_NOT_FOUND', 'Profil mahasiswa tidak ditemukan.', 404);
    }

    // Jika belum ada otp_code, buat dan kirim OTP konfirmasi reset perangkat
    if (!input.otp_code) {
      const otpCode = env.NODE_ENV === 'development' ? '123456' : generateOtpCode();
      const expiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 menit

      await db.insert(emailOtps).values({
        email: user.email,
        otpCode,
        expiresAt,
        attempts: 0,
      });

      // Kirim email konfirmasi reset perangkat
      const emailHtml = buildOtpEmailHtml(
        otpCode,
        'Konfirmasi Penggantian Perangkat Baru'
      );

      if (this.resend) {
        try {
          await this.resend.emails.send({
            from: 'Takluk EdTech <auth@takluk.dev>',
            to: user.email,
            subject: `[${otpCode}] Kode Konfirmasi Ganti HP Takluk`,
            html: emailHtml,
          });
        } catch (err) {
          console.warn('[PROFILE] Gagal kirim email reset device via Resend:', err);
        }
      }

      return {
        otp_sent: true,
        message: `Kode OTP konfirmasi telah dikirim ke ${user.email}. Masukkan kode tersebut bersama new_device_id untuk menyelesaikan perpindahan perangkat.`,
      };
    }

    // Jika otp_code disertakan, verifikasi OTP
    const [otpRecord] = await db
      .select()
      .from(emailOtps)
      .where(
        and(
          eq(emailOtps.email, user.email),
          gt(emailOtps.expiresAt, new Date())
        )
      )
      .orderBy(sql`${emailOtps.createdAt} DESC`)
      .limit(1);

    if (!otpRecord) {
      throw new ProfileError(
        'OTP_EXPIRED',
        'Kode OTP sudah kedaluwarsa atau belum pernah diminta. Silakan minta kode OTP baru ya!',
        400
      );
    }

    if (otpRecord.attempts >= 5) {
      throw new ProfileError(
        'OTP_MAX_ATTEMPTS',
        'Kamu sudah salah memasukkan OTP 5 kali. Minta kode baru ya demi keamanan akunmu.',
        429
      );
    }

    const isValidOtp =
      otpRecord.otpCode === input.otp_code ||
      (env.NODE_ENV === 'development' && input.otp_code === '123456');

    if (!isValidOtp) {
      await db
        .update(emailOtps)
        .set({ attempts: otpRecord.attempts + 1 })
        .where(eq(emailOtps.id, otpRecord.id));

      const remaining = 4 - otpRecord.attempts;
      throw new ProfileError(
        'OTP_INVALID',
        `Kode OTP yang kamu masukkan salah. Sisa kesempatan: ${remaining} kali lagi.`,
        400
      );
    }

    // Bersihkan OTP yang terpakai
    await db.delete(emailOtps).where(eq(emailOtps.id, otpRecord.id));

    // Timpa active_device_id dengan yang baru
    await db
      .update(users)
      .set({
        activeDeviceId: input.new_device_id,
        deviceUpdatedAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(users.id, userId));

    return {
      otp_sent: false,
      device_reset_success: true,
      new_device_id: input.new_device_id,
      message: 'Perangkat berhasil diperbarui! Sekarang akun Takluk kamu sudah terikat pada perangkat baru ini.',
    };
  }

  /**
   * Menampilkan data statistik kode referral mahasiswa.
   */
  async getReferralInfo(userId: string) {
    const [user] = await db
      .select({
        referralCode: users.referralCode,
        fullName: users.fullName,
      })
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);

    if (!user) {
      throw new ProfileError('USER_NOT_FOUND', 'Profil mahasiswa tidak ditemukan.', 404);
    }

    // Hitung jumlah mahasiswa yang menggunakan kode referral user ini
    const [referralCountResult] = await db
      .select({ total: count() })
      .from(users)
      .where(eq(users.referredById, userId));

    const totalReferred = Number(referralCountResult?.total ?? 0);
    // Tiap teman yang bergabung memberikan bonus 7 hari langganan
    const bonusDaysEarned = totalReferred * 7;

    return {
      referral_code: user.referralCode,
      share_message: `Ayo taklukkan ujian kuliah bareng Takluk! Masukkan kode referralku ${user.referralCode} saat daftar dan dapatkan akses materi eksklusif kampus Panam. Download sekarang: https://takluk.id/app`,
      total_referred_users: totalReferred,
      bonus_days_earned: bonusDaysEarned,
      reward_rule: 'Setiap 1 teman yang berhasil mendaftar menggunakan kode referralku, kamu mendapatkan tambahan 7 hari masa aktif langganan gratis!',
    };
  }
}

export class ProfileError extends Error {
  constructor(
    public readonly code: string,
    message: string,
    public readonly status: 400 | 403 | 404 | 429 = 400
  ) {
    super(message);
    this.name = 'ProfileError';
  }
}
