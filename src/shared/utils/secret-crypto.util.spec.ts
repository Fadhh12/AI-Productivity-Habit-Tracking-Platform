import { decryptSecret, encryptSecret } from './secret-crypto.util';

describe('secret-crypto.util', () => {
  it('round-trips a secret', () => {
    const encrypted = encryptSecret('refresh-token-123', 'key-a');
    expect(encrypted).not.toContain('refresh-token-123');
    expect(decryptSecret(encrypted, 'key-a')).toBe('refresh-token-123');
  });

  it('produces a different ciphertext each time (random IV)', () => {
    expect(encryptSecret('same', 'key-a')).not.toBe(encryptSecret('same', 'key-a'));
  });

  it('fails to decrypt with the wrong key', () => {
    const encrypted = encryptSecret('secret', 'key-a');
    expect(() => decryptSecret(encrypted, 'key-b')).toThrow();
  });

  it('rejects malformed payloads', () => {
    expect(() => decryptSecret('garbage', 'key-a')).toThrow('Malformed');
  });
});
