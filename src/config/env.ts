import { z } from 'zod';

const envSchema = z.object({
  PORT: z.coerce.number().default(3000),
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  JWT_SECRET: z.string().min(10).default('rahasia_jwt_takluk_panam_2026_super_aman_minimal_32_karakter'),
  DATABASE_URL: z.string().default('postgresql://postgres:postgres@localhost:5432/takluk_db'),

  // Email OTP Service (Resend - Free Tier)
  RESEND_API_KEY: z.string().default('re_test_dummy_key_for_development'),
  EMAIL_FROM: z.string().default('Takluk RuangKuliah <no-reply@takluk.id>'),

  // Payment Gateway (Midtrans)
  MIDTRANS_SERVER_KEY: z.string().default('SB-Mid-server-dummy-key-for-dev'),
  MIDTRANS_CLIENT_KEY: z.string().default('SB-Mid-client-dummy-key-for-dev'),
  MIDTRANS_IS_PRODUCTION: z.coerce.boolean().default(false),
  MIDTRANS_WEBHOOK_SECRET: z.string().default('dummy_midtrans_webhook_secret'),

  // Cloudflare Stream (VOD)
  CF_ACCOUNT_ID: z.string().default('dummy_cf_account_id'),
  CF_API_TOKEN: z.string().default('dummy_cf_api_token'),
  CF_STREAM_SIGNING_KEY_ID: z.string().default('dummy_cf_key_id'),
  CF_STREAM_SIGNING_KEY_JWK: z.string().default('dummy_cf_jwk'),
});

export type Env = z.infer<typeof envSchema>;

function loadEnv(): Env {
  const parsed = envSchema.safeParse(process.env);
  if (!parsed.success) {
    console.error('❌ Konfigurasi Environment (.env) tidak valid:');
    console.error(parsed.error.flatten().fieldErrors);
    if (process.env.NODE_ENV === 'production') {
      process.exit(1);
    }
  }
  return parsed.data ?? (envSchema.parse({}));
}

export const env = loadEnv();
