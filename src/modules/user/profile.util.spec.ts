import { isValidAvatarDataUrl, MAX_AVATAR_CHARS, normalizeDisplayName } from './profile.util';

describe('isValidAvatarDataUrl', () => {
  it('accepts small jpeg/png/webp data URLs', () => {
    expect(isValidAvatarDataUrl('data:image/jpeg;base64,/9j/4AAQSkZJRg==')).toBe(true);
    expect(isValidAvatarDataUrl('data:image/png;base64,iVBORw0KGgo=')).toBe(true);
    expect(isValidAvatarDataUrl('data:image/webp;base64,UklGRg==')).toBe(true);
  });
  it('rejects other types, non-base64 payloads and script injection', () => {
    expect(isValidAvatarDataUrl('data:image/svg+xml;base64,PHN2Zz4=')).toBe(false);
    expect(isValidAvatarDataUrl('data:text/html;base64,PGh0bWw+')).toBe(false);
    expect(isValidAvatarDataUrl('https://example.com/a.png')).toBe(false);
    expect(isValidAvatarDataUrl('data:image/png;base64,abc" onerror="x')).toBe(false);
  });
  it('rejects oversized images', () => {
    expect(isValidAvatarDataUrl(`data:image/png;base64,${'A'.repeat(MAX_AVATAR_CHARS)}`)).toBe(false);
  });
});

describe('normalizeDisplayName', () => {
  it('collapses whitespace and caps length', () => {
    expect(normalizeDisplayName('  Nabil   Rahman ')).toBe('Nabil Rahman');
    expect(normalizeDisplayName('x'.repeat(80))).toHaveLength(40);
  });
  it('returns null for blank names', () => {
    expect(normalizeDisplayName('   ')).toBeNull();
  });
});
