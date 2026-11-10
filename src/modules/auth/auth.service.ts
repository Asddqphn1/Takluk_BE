import { eq, and, gt, sql } from 'drizzle-orm';
import { db } from '../../db';
import { users, emailOtps } from '../../db/schema';
import { env } from '../../config/env';
import { generateOtpCode, generateReferralCode, buildOtpEmailHtml } from '../../utils/otp';
import { createJwt } from '../../utils/jwt';
import { Resend } from 'resend';
import type { VerifyOtpInput } from './auth.schema';

const resend = new Resend(env.RESEND_API_KEY);

export class AuthService {
  /**
   * Generate a 6-digit OTP code, save to email_otps, and send via Resend email.
   * In development mode with RESEND_API_KEY starting with 're_test', uses dummy OTP '123456'.
   */
  async requestOtp(email: string): Promise<{ message: string }> {
    const [recentOtp] = await db
      .select({ id: emailOtps.id, createdAt: emailOtps.createdAt })
      .from(emailOtps)
      .where(
        and(
          eq(emailOtps.email, email),
          eq(emailOtps.isUsed, false),
          gt(emailOtps.expiresAt, new Date())
        )
      )
      .orderBy(sql`${emailOtps.createdAt} DESC`)
      .limit(1);

    if (recentOtp) {
      const timeDiff = Date.now() - new Date(recentOtp.createdAt).getTime();
      if (timeDiff < 60_000) {
        return {
          message: 'Kode OTP sudah dikirim ke email kamu. Cek inbox atau tunggu 60 detik untuk kirim ulang ya!',
        };
      }
    }

    const isDev = env.NODE_ENV === 'development';
    const otpCode = isDev ? '123456' : generateOtpCode();

    const expiresAt = new Date(Date.now() + 5 * 60 * 1000);

    await db.insert(emailOtps).values({
      email,
      otpCode,
      expiresAt,
    });

    const [existingUser] = await db
      .select({ fullName: users.fullName })
      .from(users)
      .where(eq(users.email, email))
      .limit(1);

    if (!isDev || !env.RESEND_API_KEY.startsWith('re_test')) {
      try {
        await resend.emails.send({
          from: env.EMAIL_FROM,
          to: email,
          subject: `${otpCode} — Kode Verifikasi Takluk`,
          html: buildOtpEmailHtml(otpCode, existingUser?.fullName),
        });
      } catch (emailError) {
        console.error('[AUTH] Failed to send OTP email:', emailError);
      }
    } else {
      console.log(`[DEV] OTP for ${email}: ${otpCode}`);
    }

    return {
      message: 'Kode OTP berhasil dikirim ke email kamu. Cek inbox ya!',
    };
  }

  /**
   * Verify OTP, register or update user profile, bind device, and issue JWT.
   */
  async verifyOtp(input: VerifyOtpInput): Promise<{
    token: string;
    user: {
      id: string;
      email: string;
      full_name: string;
      nim: string;
      university: string;
      semester: number;
      role: string;
      subscription_valid_until: string | null;
      is_new_user: boolean;
    };
  }> {
    const [otpRecord] = await db
      .select()
      .from(emailOtps)
      .where(
        and(
          eq(emailOtps.email, input.email),
          eq(emailOtps.isUsed, false),
          gt(emailOtps.expiresAt, new Date())
        )
      )
      .orderBy(sql`${emailOtps.createdAt} DESC`)
      .limit(1);

    if (!otpRecord) {
      throw new OtpError(
        'OTP_EXPIRED',
        'Kode OTP sudah kedaluwarsa atau belum diminta. Kirim ulang OTP ya!'
      );
    }

    if (otpRecord.attempts >= 5) {
      await db
        .update(emailOtps)
        .set({ isUsed: true })
        .where(eq(emailOtps.id, otpRecord.id));

      throw new OtpError(
        'OTP_MAX_ATTEMPTS',
        'Kamu sudah 5 kali salah memasukkan kode. Minta kode OTP baru ya!'
      );
    }

    if (otpRecord.otpCode !== input.otp_code) {
      await db
        .update(emailOtps)
        .set({ attempts: sql`${emailOtps.attempts} + 1` })
        .where(eq(emailOtps.id, otpRecord.id));

      const remaining = 4 - otpRecord.attempts;
      throw new OtpError(
        'OTP_INVALID',
        `Kode OTP salah. Kamu punya ${remaining} kesempatan lagi.`
      );
    }

    await db
      .update(emailOtps)
      .set({ isUsed: true })
      .where(eq(emailOtps.id, otpRecord.id));

    const [existingUser] = await db
      .select()
      .from(users)
      .where(eq(users.email, input.email))
      .limit(1);

    let userId: string;
    let isNewUser = false;
    let userData: typeof existingUser;

    if (existingUser) {
      const updateData: Record<string, unknown> = {
        activeDeviceId: input.device_id,
        deviceUpdatedAt: new Date(),
        updatedAt: new Date(),
      };

      if (input.full_name) updateData.fullName = input.full_name;
      if (input.nim) updateData.nim = input.nim;
      if (input.university) updateData.university = input.university;
      if (input.semester) updateData.semester = input.semester;
      if (input.phone_number !== undefined) updateData.phoneNumber = input.phone_number;

      const [updated] = await db
        .update(users)
        .set(updateData)
        .where(eq(users.id, existingUser.id))
        .returning();

      userId = existingUser.id;
      userData = updated;
    } else {
      if (!input.full_name || !input.nim) {
        throw new OtpError(
          'PROFILE_REQUIRED',
          'Karena ini pertama kali kamu masuk, lengkapi nama dan NIM kamu ya!'
        );
      }

      const referralCode = generateReferralCode(input.full_name);

      const [newUser] = await db
        .insert(users)
        .values({
          email: input.email,
          fullName: input.full_name,
          nim: input.nim,
          university: input.university ?? 'UIN_SUSKA',
          semester: input.semester ?? 1,
          phoneNumber: input.phone_number ?? null,
          activeDeviceId: input.device_id,
          deviceUpdatedAt: new Date(),
          referralCode,
        })
        .returning();

      userId = newUser.id;
      userData = newUser;
      isNewUser = true;
    }

    const token = await createJwt(userId, userData.email, userData.role);

    return {
      token,
      user: {
        id: userId,
        email: userData.email,
        full_name: userData.fullName,
        nim: userData.nim,
        university: userData.university,
        semester: userData.semester,
        role: userData.role,
        subscription_valid_until: userData.subscriptionValidUntil?.toISOString() ?? null,
        is_new_user: isNewUser,
      },
    };
  }
}

export class OtpError extends Error {
  constructor(
    public readonly code: string,
    message: string
  ) {
    super(message);
    this.name = 'OtpError';
  }
}
