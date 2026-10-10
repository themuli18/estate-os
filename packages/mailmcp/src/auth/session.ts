import type { Request, Response } from 'express';
import { hmac, safeEqual } from '../crypto.js';

const COOKIE = 'mm_session';
const SESSION_TTL_MS = 12 * 60 * 60 * 1000;

interface SessionPayload {
  email: string;
  exp: number;
}

export function readCookie(req: Request, name: string): string | undefined {
  for (const part of (req.headers.cookie ?? '').split(';')) {
    const [k, ...v] = part.trim().split('=');
    if (k === name) return decodeURIComponent(v.join('='));
  }
  return undefined;
}

export function signSession(email: string, secret: string, now = Date.now()): string {
  const payload = Buffer.from(JSON.stringify({ email, exp: now + SESSION_TTL_MS } satisfies SessionPayload)).toString('base64url');
  return `${payload}.${hmac(payload, secret)}`;
}

export function verifySession(value: string | undefined, secret: string, now = Date.now()): string | undefined {
  if (!value) return undefined;
  const [payload, sig] = value.split('.');
  if (!payload || !sig || !safeEqual(sig, hmac(payload, secret))) return undefined;
  try {
    const data = JSON.parse(Buffer.from(payload, 'base64url').toString('utf8')) as SessionPayload;
    return data.exp > now ? data.email : undefined;
  } catch {
    return undefined;
  }
}

export function setSession(res: Response, email: string, secret: string, secure: boolean): void {
  res.cookie(COOKIE, signSession(email, secret), {
    httpOnly: true,
    secure,
    sameSite: 'lax',
    maxAge: SESSION_TTL_MS,
    path: '/',
  });
}

export function clearSession(res: Response): void {
  res.clearCookie(COOKIE, { path: '/' });
}

export function sessionEmail(req: Request, secret: string): string | undefined {
  return verifySession(readCookie(req, COOKIE), secret);
}

// CSRF token bound to the session owner and a purpose.
export function csrfToken(email: string, purpose: string, secret: string): string {
  return hmac(`csrf:${email}:${purpose}`, secret);
}

export function checkCsrf(email: string, purpose: string, token: unknown, secret: string): boolean {
  return typeof token === 'string' && safeEqual(token, csrfToken(email, purpose, secret));
}
