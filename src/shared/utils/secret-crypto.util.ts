import { createCipheriv, createDecipheriv, randomBytes, scryptSync } from 'crypto';

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 12;

function deriveKey(secret: string): Buffer {
  return scryptSync(secret, 'continuum-secret-crypto', 32);
}

/** Encrypts a string (e.g. an OAuth refresh token) for storage at rest. Format: iv:authTag:ciphertext, all hex. */
export function encryptSecret(plainText: string, secret: string): string {
  const iv = randomBytes(IV_LENGTH);
  const cipher = createCipheriv(ALGORITHM, deriveKey(secret), iv);
  const encrypted = Buffer.concat([cipher.update(plainText, 'utf8'), cipher.final()]);
  const authTag = cipher.getAuthTag();
  return `${iv.toString('hex')}:${authTag.toString('hex')}:${encrypted.toString('hex')}`;
}

export function decryptSecret(payload: string, secret: string): string {
  const [ivHex, authTagHex, dataHex] = payload.split(':');
  if (!ivHex || !authTagHex || !dataHex) {
    throw new Error('Malformed encrypted secret payload');
  }
  const decipher = createDecipheriv(ALGORITHM, deriveKey(secret), Buffer.from(ivHex, 'hex'));
  decipher.setAuthTag(Buffer.from(authTagHex, 'hex'));
  const decrypted = Buffer.concat([decipher.update(Buffer.from(dataHex, 'hex')), decipher.final()]);
  return decrypted.toString('utf8');
}
