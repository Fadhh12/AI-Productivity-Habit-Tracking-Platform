export type RepeatRule = 'none' | 'daily' | 'weekdays' | 'weekly';

const MAX_OCCURRENCES = 366;

function pad(n: number): string {
  return String(n).padStart(2, '0');
}

function toDateStr(d: Date): string {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

/**
 * Expands a single start date into every date it repeats on, up to and
 * including `untilDate` (inclusive), capped at MAX_OCCURRENCES as a sane
 * upper bound against an accidental multi-year range.
 */
export function generateOccurrenceDates(startDate: string, rule: RepeatRule, untilDate?: string): string[] {
  if (rule === 'none' || !untilDate) return [startDate];

  const startDow = new Date(`${startDate}T00:00:00`).getDay();
  const cursor = new Date(`${startDate}T00:00:00`);
  const end = new Date(`${untilDate}T00:00:00`);
  const dates: string[] = [];

  while (cursor <= end && dates.length < MAX_OCCURRENCES) {
    const dow = cursor.getDay();
    const include = rule === 'daily' || (rule === 'weekdays' && dow >= 1 && dow <= 5) || (rule === 'weekly' && dow === startDow);
    if (include) dates.push(toDateStr(cursor));
    cursor.setDate(cursor.getDate() + 1);
  }

  return dates.length > 0 ? dates : [startDate];
}
