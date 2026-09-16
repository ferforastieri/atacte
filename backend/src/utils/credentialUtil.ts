import bcrypt from 'bcryptjs';
import { createHash } from 'node:crypto';
import { BCRYPT_ROUNDS } from '../infrastructure/config';

export const tokenHash = (value: string): string => createHash('sha256').update(value).digest('hex');

export function validateNewPassword(password: unknown): asserts password is string {
  if (typeof password !== 'string' || password.length < 8 || Buffer.byteLength(password, 'utf8') > 72) {
    throw new Error('A senha deve ter pelo menos 8 caracteres e no máximo 72 bytes UTF-8');
  }
}

export async function hashPassword(password: unknown) {
  validateNewPassword(password);
  const salt = await bcrypt.genSalt(BCRYPT_ROUNDS);
  return { masterPasswordHash: await bcrypt.hash(password, salt), masterPasswordSalt: salt };
}

// Enforce the same byte limit at login and when setting a password.
const dummyHash = bcrypt.hashSync('unavailable-account-dummy-password', BCRYPT_ROUNDS);
export async function verifyPassword(password: unknown, hash?: string): Promise<boolean> {
  if (typeof password !== 'string' || Buffer.byteLength(password, 'utf8') > 72) return false;
  const valid = await bcrypt.compare(password, hash || dummyHash);
  return Boolean(hash) && valid;
}
