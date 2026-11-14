import { createHash } from 'node:crypto';
import { env } from '../config/env';

/**
 * Helper untuk membuat Bunny.net Stream Signed HLS URL (.m3u8).
 * Signed URL diamankan dengan SHA-256 Token Authentication berlaku 2 jam (7200 detik)
 * untuk mencegah pembajakan link streaming.
 */
export function generateBunnySignedHlsUrl(
  bunnyVideoId: string,
  expiresInSeconds: number = 7200
): {
  hls_url: string;
  embed_url: string;
  thumbnail_url: string;
  expires_at: number;
} {
  const expires = Math.floor(Date.now() / 1000) + expiresInSeconds;
  const tokenKey = env.BUNNY_STREAM_TOKEN_KEY || env.BUNNY_STREAM_API_KEY;
  const cdnHostname = env.BUNNY_STREAM_CDN_HOSTNAME;
  const libraryId = env.BUNNY_STREAM_LIBRARY_ID;

  // 1. Generate Token untuk Direct HLS Playlist: SHA256(tokenKey + videoId + expires)
  const hlsToken = createHash('sha256')
    .update(`${tokenKey}${bunnyVideoId}${expires}`)
    .digest('hex');

  const hlsUrl = `https://${cdnHostname}/${bunnyVideoId}/playlist.m3u8?token=${hlsToken}&expires=${expires}`;

  // 2. Generate Token untuk Iframe Embed Player: SHA256(libraryId + tokenKey + expires + videoId)
  const embedToken = createHash('sha256')
    .update(`${libraryId}${tokenKey}${expires}${bunnyVideoId}`)
    .digest('hex');

  const embedUrl = `https://iframe.mediadelivery.net/embed/${libraryId}/${bunnyVideoId}?token=${embedToken}&expires=${expires}`;

  // 3. Default Thumbnail URL
  const thumbnailUrl = `https://${cdnHostname}/${bunnyVideoId}/thumbnail.jpg`;

  return {
    hls_url: hlsUrl,
    embed_url: embedUrl,
    thumbnail_url: thumbnailUrl,
    expires_at: expires,
  };
}

/**
 * Mengambil metadata video langsung dari REST API Bunny.net (opsional/verifikasi).
 */
export async function getBunnyVideoMetadata(bunnyVideoId: string) {
  try {
    const res = await fetch(
      `https://video.bunnycdn.com/library/${env.BUNNY_STREAM_LIBRARY_ID}/videos/${bunnyVideoId}`,
      {
        method: 'GET',
        headers: {
          AccessKey: env.BUNNY_STREAM_API_KEY,
          Accept: 'application/json',
        },
      }
    );

    if (!res.ok) {
      return null;
    }

    return (await res.json()) as {
      guid: string;
      title: string;
      length: number; // durasi dalam detik
      status: number; // 3 = ready/finished encoding
      thumbnailFileName?: string;
    };
  } catch (err) {
    console.warn('[BUNNY] Gagal mengambil metadata dari API Bunny:', err);
    return null;
  }
}

