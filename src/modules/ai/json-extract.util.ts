/**
 * Pulls a JSON value out of a model reply. Free/smaller models often wrap JSON in
 * markdown fences or add a sentence before/after it, so strip fences first and
 * fall back to the outermost {...} or [...] block.
 */
export function extractJson<T>(raw: string): T {
  const text = raw.trim().replace(/^```(?:json)?/i, '').replace(/```$/, '').trim();
  try {
    return JSON.parse(text) as T;
  } catch {
    const start = text.search(/[{[]/);
    const end = Math.max(text.lastIndexOf('}'), text.lastIndexOf(']'));
    if (start === -1 || end <= start) throw new Error('Model reply did not contain JSON');
    return JSON.parse(text.slice(start, end + 1)) as T;
  }
}
