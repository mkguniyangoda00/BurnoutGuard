import crypto from 'crypto';
import { Env } from '../config/env';

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 12; // recommended for GCM

function getKey(): Buffer {
  const key = Env.JOURNAL_ENCRYPTION_KEY;
  const buf = Buffer.from(key, 'base64');
  if (buf.length !== 32) {
    throw new Error('JOURNAL_ENCRYPTION_KEY must be a base64-encoded 32-byte key (generate with: openssl rand -base64 32)');
  }
  return buf;
}

/** Returns a single string: base64(iv):base64(authTag):base64(ciphertext) */
export function encryptText(plain: string | null | undefined): string | null {
  if (plain === null || plain === undefined) return null;
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv(ALGORITHM, getKey(), iv);
  const encrypted = Buffer.concat([cipher.update(plain, 'utf8'), cipher.final()]);
  const authTag = cipher.getAuthTag();
  return `${iv.toString('base64')}:${authTag.toString('base64')}:${encrypted.toString('base64')}`;
}

/**
 * Decrypts a value produced by encryptText(). If the value doesn't look like
 * our encrypted format (e.g. legacy plaintext rows written before encryption
 * was enabled), it's returned as-is rather than thrown away — this avoids
 * destroying old journal entries during rollout. Run a one-off migration
 * script to re-encrypt legacy rows once this is deployed.
 */
export function decryptText(stored: string | null | undefined): string | null {
  if (stored === null || stored === undefined) return null;
  const parts = stored.split(':');
  if (parts.length !== 3) return stored; // legacy plaintext — pass through

  try {
    const [ivB64, tagB64, dataB64] = parts;
    const decipher = crypto.createDecipheriv(ALGORITHM, getKey(), Buffer.from(ivB64, 'base64'));
    decipher.setAuthTag(Buffer.from(tagB64, 'base64'));
    const decrypted = Buffer.concat([decipher.update(Buffer.from(dataB64, 'base64')), decipher.final()]);
    return decrypted.toString('utf8');
  } catch {
    return stored; // couldn't decrypt — return raw so the UI doesn't crash
  }
}