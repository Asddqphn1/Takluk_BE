import { env } from '../config/env';

/**
 * Helper untuk membuat Cloudflare Stream Signed HLS URL (.m3u8).
 * Signed URL berlaku selama 2 jam (7200 detik) untuk mencegah pembajakan link.
 */
export async function generateSignedHlsUrl(cfVideoUid: string, expiresInSeconds: number = 7200): Promise<string> {
  const expiry = Math.floor(Date.now() / 1000) + expiresInSeconds;

  // Cloudflare Stream Customer Subdomain atau fallback host
  const customerSubdomain = env.CF_ACCOUNT_ID
    ? `customer-${env.CF_ACCOUNT_ID}.cloudflarestream.com`
    : 'cloudflarestream.com';

  // Buat signed token payload
  const header = { alg: 'HS256', typ: 'JWT' };
  const payload = {
    sub: cfVideoUid,
    kid: env.CF_STREAM_SIGNING_KEY_ID,
    exp: expiry,
    nbf: Math.floor(Date.now() / 1000) - 10,
    accessRules: [
      {
        type: 'any',
        action: 'allow',
      },
    ],
  };

  const encodeBase64Url = (obj: object) =>
    Buffer.from(JSON.stringify(obj))
      .toString('base64')
      .replace(/=/g, '')
      .replace(/\+/g, '-')
      .replace(/\//g, '_');

  const unsignedToken = `${encodeBase64Url(header)}.${encodeBase64Url(payload)}`;

  // Gunakan Web Crypto HMAC SHA-256 untuk membuat signature
  const keySecret = env.CF_STREAM_SIGNING_KEY_JWK || env.JWT_SECRET;
  const key = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(keySecret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );

  const signature = await crypto.subtle.sign(
    'HMAC',
    key,
    new TextEncoder().encode(unsignedToken)
  );

  const signatureBase64Url = Buffer.from(signature)
    .toString('base64')
    .replace(/=/g, '')
    .replace(/\+/g, '-')
    .replace(/\//g, '_');

  const signedToken = `${unsignedToken}.${signatureBase64Url}`;

  // Format HLS manifest URL Cloudflare Stream
  return `https://${customerSubdomain}/${signedToken}/manifest/video.m3u8`;
}

