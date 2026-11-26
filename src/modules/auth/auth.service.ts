import { and, eq, gt, sql } from 'drizzle-orm';
import { db } from '../../db';
import { users, emailOtps } from '../../db/schema';
import { generateOtpCode, generateReferralCode, buildOtpEmailHtml } from '../../utils/otp';
import { createJwt } from '../../utils/jwt';
import type { VerifyOtpInput } from './auth.schema';

async function sendOtpEmail(email: string, html: string): Promise<void> {
  const { GMAIL_CLIENT_ID, GMAIL_CLIENT_SECRET, GMAIL_REFRESH_TOKEN, GMAIL_SENDER } = process.env;
  if (!GMAIL_CLIENT_ID || !GMAIL_CLIENT_SECRET || !GMAIL_REFRESH_TOKEN || !GMAIL_SENDER) {
    throw new Error('Konfigurasi OAuth Gmail Takluk belum lengkap.');
  }
  if ([email, GMAIL_SENDER].some(value => /[\r\n,;<>]/.test(value))) {
    throw new Error('Alamat pengirim atau penerima OTP tidak valid.');
  }

  const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    body: new URLSearchParams({
      client_id: GMAIL_CLIENT_ID,
      client_secret: GMAIL_CLIENT_SECRET,
      refresh_token: GMAIL_REFRESH_TOKEN,
      grant_type: 'refresh_token',
    }),
    signal: AbortSignal.timeout(10000),
  });
  if (!tokenResponse.ok) {
    throw new Error(`OAuth Gmail menolak permintaan token (HTTP ${tokenResponse.status}).`);
  }
  const token = await tokenResponse.json() as { access_token?: string };
  if (!token.access_token) throw new Error('OAuth Gmail tidak mengembalikan access token.');

  const encodedHtml = Buffer.from(html, 'utf8').toString('base64');
  const message = [
    `From: Takluk RuangKuliah <${GMAIL_SENDER}>`,
    `To: ${email}`,
    'Subject: Kode Verifikasi Takluk',
    'MIME-Version: 1.0',
    'Content-Type: text/html; charset=UTF-8',
    'Content-Transfer-Encoding: base64',
    '',
    (encodedHtml.match(/.{1,76}/g) ?? []).join('\r\n'),
  ].join('\r\n');
  const response = await fetch('https://gmail.googleapis.com/gmail/v1/users/me/messages/send', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token.access_token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ raw: Buffer.from(message, 'utf8').toString('base64url') }),
    signal: AbortSignal.timeout(15000),
  });
  if (!response.ok) throw new Error(`Gmail menolak pengiriman OTP (HTTP ${response.status}).`);
}

export class AuthService {
  async requestOtp(email: string): Promise<{ message: string }> {
    return db.transaction(async (tx) => {
      // Serialize requests for this address so retries observe the same cooldown.
      await tx.execute(sql`SELECT pg_advisory_xact_lock(hashtext(${email}))`);
      const [recentOtp] = await tx
        .select({ createdAt: emailOtps.createdAt })
        .from(emailOtps)
        .where(and(
          eq(emailOtps.email, email),
          eq(emailOtps.isUsed, false),
          gt(emailOtps.expiresAt, new Date()),
        ))
        .orderBy(sql`${emailOtps.createdAt} DESC`)
        .limit(1);

      if (recentOtp && Date.now() - new Date(recentOtp.createdAt).getTime() < 60_000) {
        return { message: 'Kode OTP sudah diminta. Cek inbox atau tunggu 60 detik untuk kirim ulang ya!' };
      }

      const [existingUser] = await tx.select({ fullName: users.fullName })
        .from(users).where(eq(users.email, email)).limit(1);
      const otpCode = generateOtpCode();
      await tx.insert(emailOtps).values({
        email,
        otpCode,
        expiresAt: new Date(Date.now() + 5 * 60_000),
      });

      // On a rejected send the transaction rolls back, allowing an immediate retry.
      await sendOtpEmail(email, buildOtpEmailHtml(otpCode, existingUser?.fullName));
      return { message: 'Kode OTP berhasil dikirim ke email kamu. Cek inbox ya!' };
    });
  }

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
    const [otpRecord] = await db.select().from(emailOtps)
      .where(and(
        eq(emailOtps.email, input.email),
        eq(emailOtps.isUsed, false),
        gt(emailOtps.expiresAt, new Date()),
      ))
      .orderBy(sql`${emailOtps.createdAt} DESC`)
      .limit(1);

    if (!otpRecord) {
      throw new OtpError('OTP_EXPIRED', 'Kode OTP sudah kedaluwarsa atau belum diminta. Kirim ulang OTP ya!');
    }
    if (otpRecord.attempts >= 5) {
      await db.update(emailOtps).set({ isUsed: true }).where(eq(emailOtps.id, otpRecord.id));
      throw new OtpError('OTP_MAX_ATTEMPTS', 'Kamu sudah 5 kali salah memasukkan kode. Minta kode OTP baru ya!');
    }
    if (otpRecord.otpCode !== input.otp_code) {
      await db.update(emailOtps)
        .set({ attempts: sql`${emailOtps.attempts} + 1` })
        .where(eq(emailOtps.id, otpRecord.id));
      const remaining = 4 - otpRecord.attempts;
      throw new OtpError('OTP_INVALID', `Kode OTP salah. Kamu punya ${remaining} kesempatan lagi.`);
    }

    await db.update(emailOtps).set({ isUsed: true }).where(eq(emailOtps.id, otpRecord.id));
    const [existingUser] = await db.select().from(users).where(eq(users.email, input.email)).limit(1);

    let userData: typeof existingUser;
    let isNewUser = false;
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
      [userData] = await db.update(users).set(updateData)
        .where(eq(users.id, existingUser.id)).returning();
    } else {
      if (!input.full_name || !input.nim) {
        throw new OtpError('PROFILE_REQUIRED', 'Karena ini pertama kali kamu masuk, lengkapi nama dan NIM kamu ya!');
      }
      [userData] = await db.insert(users).values({
        email: input.email,
        fullName: input.full_name,
        nim: input.nim,
        university: input.university ?? 'UIN_SUSKA',
        semester: input.semester ?? 1,
        phoneNumber: input.phone_number ?? null,
        activeDeviceId: input.device_id,
        deviceUpdatedAt: new Date(),
        referralCode: generateReferralCode(input.full_name),
      }).returning();
      isNewUser = true;
    }

    const token = await createJwt(userData.id, userData.email, userData.role);
    return {
      token,
      user: {
        id: userData.id,
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
  constructor(public readonly code: string, message: string) {
    super(message);
    this.name = 'OtpError';
  }
}
