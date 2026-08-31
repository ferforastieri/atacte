import { randomBytes, timingSafeEqual } from 'node:crypto';
import { Response } from 'express';
import {
  COOKIE_DOMAIN,
  COOKIE_MAX_AGE_MS,
  COOKIE_SAME_SITE,
  COOKIE_SECURE,
} from '../infrastructure/config';

export const SESSION_COOKIE_NAME = COOKIE_SECURE && !COOKIE_DOMAIN ? '__Host-atacte_session' : 'atacte_session';
export const CSRF_COOKIE_NAME = 'atacte_csrf';

export function parseCookies(header: string | undefined): Record<string, string> {
  if (!header) return {};
  return Object.fromEntries(header.split(';').flatMap((part) => {
    const separator = part.indexOf('=');
    if (separator < 0) return [];
    const key = part.slice(0, separator).trim();
    const value = part.slice(separator + 1).trim();
    try {
      return [[key, decodeURIComponent(value)]];
    } catch {
      return [[key, value]];
    }
  }));
}

function serializeCookie(name: string, value: string, options: { httpOnly: boolean; maxAge?: number }): string {
  const attributes = [
    `${name}=${encodeURIComponent(value)}`,
    'Path=/',
    `Max-Age=${Math.max(0, Math.floor((options.maxAge ?? COOKIE_MAX_AGE_MS) / 1000))}`,
    `SameSite=${COOKIE_SAME_SITE.charAt(0).toUpperCase()}${COOKIE_SAME_SITE.slice(1)}`,
  ];
  if (options.httpOnly) attributes.push('HttpOnly');
  if (COOKIE_SECURE) attributes.push('Secure');
  if (COOKIE_DOMAIN) attributes.push(`Domain=${COOKIE_DOMAIN}`);
  return attributes.join('; ');
}

export function setSessionCookie(res: Response, token: string): void {
  res.append('Set-Cookie', serializeCookie(SESSION_COOKIE_NAME, token, { httpOnly: true }));
}

export function clearSessionCookie(res: Response): void {
  res.append('Set-Cookie', serializeCookie(SESSION_COOKIE_NAME, '', { httpOnly: true, maxAge: 0 }));
}

export function issueCsrfCookie(res: Response): string {
  const token = randomBytes(32).toString('hex');
  res.append('Set-Cookie', serializeCookie(CSRF_COOKIE_NAME, token, { httpOnly: false }));
  return token;
}

export function secureTokenEqual(left: string | undefined, right: string | undefined): boolean {
  if (!left || !right || left.length !== right.length) return false;
  return timingSafeEqual(Buffer.from(left), Buffer.from(right));
}
