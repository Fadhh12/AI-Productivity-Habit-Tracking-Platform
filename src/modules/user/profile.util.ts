export const MAX_DISPLAY_NAME = 40;
/** Base64 data-URL length cap; the client resizes to ~256px so real photos are far smaller, and the default 100kb JSON body limit still fits. */
export const MAX_AVATAR_CHARS = 70000;

const AVATAR_PATTERN = /^data:image\/(jpeg|png|webp);base64,[A-Za-z0-9+/]+=*$/;

export function isValidAvatarDataUrl(value: string): boolean {
  return value.length <= MAX_AVATAR_CHARS && AVATAR_PATTERN.test(value);
}

/** Trims and collapses whitespace; an empty result means "no display name". */
export function normalizeDisplayName(value: string): string | null {
  const name = value.replace(/\s+/g, ' ').trim().slice(0, MAX_DISPLAY_NAME);
  return name === '' ? null : name;
}
