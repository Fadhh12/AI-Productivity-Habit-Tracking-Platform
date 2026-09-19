/**
 * Shared date/time formatting helpers.
 *
 * Consolidated from previously-duplicated per-file implementations in the
 * Today, Activity Logs, and Habit Tracker pages, plus the Calendar
 * component, so date formatting stays byte-for-byte consistent across the
 * app. All formatting here uses local time (no UTC conversion), matching
 * the original per-file implementations.
 */

function pad(n: number): string {
  return String(n).padStart(2, '0');
}

/** Formats a Date as a local `yyyy-mm-dd` string. */
export function dateToStr(d: Date): string {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

/** Today's date as a local `yyyy-mm-dd` string. */
export function todayDateString(): string {
  return dateToStr(new Date());
}

/** The last 7 days including today, oldest first, as `yyyy-mm-dd` strings. */
export function last7Days(): string[] {
  const days: string[] = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    days.push(dateToStr(d));
  }
  return days;
}

/**
 * The current week's 7 dates, Monday through Sunday, as `yyyy-mm-dd`
 * strings. Computed from the ISO weekday (Mon=1 .. Sun=7), independent of
 * `Date.getDay()` (Sun=0 .. Sat=6) ordering.
 */
export function last7DatesMonToSun(): string[] {
  const today = new Date();
  const isoWeekday = today.getDay() === 0 ? 7 : today.getDay();
  const monday = new Date(today);
  monday.setDate(today.getDate() - (isoWeekday - 1));
  const dates: string[] = [];
  for (let i = 0; i < 7; i++) {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    dates.push(dateToStr(d));
  }
  return dates;
}

/** Converts an ISO datetime string into a value for `<input type="datetime-local">`. */
export function toDatetimeLocalValue(iso: string): string {
  const d = new Date(iso);
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

/**
 * Day labels indexed by JS `Date.getDay()` (Sunday = 0 .. Saturday = 6).
 * Use as `DAY_LABELS_SUNDAY_FIRST[someDate.getDay()]`.
 *
 * NOT interchangeable with `DAY_LABELS_MONDAY_FIRST` — different indexing.
 */
export const DAY_LABELS_SUNDAY_FIRST = ['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab'];

/**
 * Day labels for a Monday-first week grid (index 0 = Monday .. index 6 =
 * Sunday), meant to be paired positionally with `last7DatesMonToSun()`.
 *
 * NOT indexed by `Date.getDay()` — use `DAY_LABELS_SUNDAY_FIRST` for that.
 */
export const DAY_LABELS_MONDAY_FIRST = ['Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab', 'Min'];
