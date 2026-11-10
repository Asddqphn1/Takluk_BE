export function generateOtpCode(): string {
  const digits = '0123456789';
  let otp = '';
  const randomBytes = crypto.getRandomValues(new Uint8Array(6));
  for (let i = 0; i < 6; i++) {
    otp += digits[randomBytes[i] % 10];
  }
  return otp;
}

export function generateReferralCode(name: string): string {
  const prefix = name
    .replace(/[^a-zA-Z]/g, '')
    .substring(0, 4)
    .toUpperCase();
  const suffix = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `${prefix}${suffix}`;
}

export function buildOtpEmailHtml(otpCode: string, recipientName?: string): string {
  const greeting = recipientName ? `Hai ${recipientName}!` : 'Hai Sobat Takluk!';

  return `<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Kode OTP Takluk</title>
</head>
<body style="margin:0;padding:0;background-color:#FAF9FD;font-family:'Segoe UI',Tahoma,Geneva,Verdana,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#FAF9FD;padding:40px 20px;">
    <tr>
      <td align="center">
        <table width="420" cellpadding="0" cellspacing="0" style="background-color:#FFFFFF;border-radius:24px;overflow:hidden;box-shadow:0 2px 12px rgba(70,43,146,0.08);">
          <!-- Header -->
          <tr>
            <td style="background:linear-gradient(135deg,#462B92,#6B47C9);padding:32px 24px;text-align:center;">
              <h1 style="color:#FFFFFF;font-size:24px;margin:0 0 4px 0;font-weight:700;">🎓 Takluk</h1>
              <p style="color:rgba(255,255,255,0.85);font-size:13px;margin:0;">RuangKuliah Hub — Belajar Jadi Lebih Mudah</p>
            </td>
          </tr>
          <!-- Body -->
          <tr>
            <td style="padding:32px 28px;">
              <p style="color:#2A1A5E;font-size:16px;margin:0 0 8px 0;font-weight:600;">${greeting}</p>
              <p style="color:#6B6B80;font-size:14px;line-height:1.6;margin:0 0 24px 0;">
                Gunakan kode verifikasi di bawah ini untuk masuk ke akun Takluk kamu. Kode ini berlaku selama <strong style="color:#2A1A5E;">5 menit</strong>.
              </p>
              <!-- OTP Code -->
              <div style="text-align:center;margin:0 0 24px 0;">
                <div style="display:inline-block;background:linear-gradient(135deg,#462B92,#6B47C9);border-radius:16px;padding:20px 40px;">
                  <span style="font-size:36px;font-weight:700;letter-spacing:12px;color:#FFFFFF;font-family:monospace;">${otpCode}</span>
                </div>
              </div>
              <p style="color:#6B6B80;font-size:13px;line-height:1.5;margin:0 0 16px 0;">
                ⚠️ Jangan bagikan kode ini ke siapapun, termasuk pihak yang mengaku dari Takluk.
              </p>
              <hr style="border:none;border-top:1px solid #E7E4F0;margin:20px 0;">
              <p style="color:#6B6B80;font-size:12px;margin:0;">
                Jika kamu tidak merasa meminta kode ini, abaikan saja email ini ya.
              </p>
            </td>
          </tr>
          <!-- Footer -->
          <tr>
            <td style="background-color:#FAF9FD;padding:20px 28px;text-align:center;">
              <p style="color:#6B6B80;font-size:11px;margin:0;">
                © 2026 Takluk — Panam, Pekanbaru 🏫
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}
