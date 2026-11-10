import { sign, verify, decode } from 'hono/jwt';
import { env } from '../config/env';

export interface JwtPayload {
  sub: string;       // user ID (UUID)
  email: string;
  role: string;
  iat: number;
  exp: number;
}

export async function createJwt(userId: string, email: string, role: string): Promise<string> {
  const now = Math.floor(Date.now() / 1000);
  const payload: JwtPayload = {
    sub: userId,
    email,
    role,
    iat: now,
    exp: now + 7 * 24 * 60 * 60, // 7 days
  };
  return await sign(payload, env.JWT_SECRET, 'HS256');
}

export async function verifyJwt(token: string): Promise<JwtPayload> {
  const payload = await verify(token, env.JWT_SECRET, 'HS256');
  return payload as unknown as JwtPayload;
}

export function decodeJwt(token: string): JwtPayload | null {
  try {
    const { payload } = decode(token);
    return payload as unknown as JwtPayload;
  } catch {
    return null;
  }
}
