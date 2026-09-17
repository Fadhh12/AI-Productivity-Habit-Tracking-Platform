/**
 * Timezone-aware date helpers. Users store an IANA timezone (e.g. "Asia/Jakarta")
 * on their profile; "local day" boundaries (00:00) must be computed against
 * that timezone, not the server's timezone.
 */
export class DateUtil {
  /** Returns YYYY-MM-DD for "now" in the given IANA timezone. */
  static localDateString(date: Date, timezone: string): string {
    const formatter = new Intl.DateTimeFormat('en-CA', {
      timeZone: timezone,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    });
    return formatter.format(date); // en-CA formats as YYYY-MM-DD
  }

  /** Start of "today" (00:00 local) expressed as a UTC Date instant. */
  static startOfLocalDay(date: Date, timezone: string): Date {
    const dateStr = this.localDateString(date, timezone);
    const offsetMinutes = this.timezoneOffsetMinutes(date, timezone);
    // Local midnight in UTC = midnight-as-if-UTC minus the zone's UTC offset.
    return new Date(Date.parse(`${dateStr}T00:00:00.000Z`) - offsetMinutes * 60000);
  }

  /** Offset in minutes of `timezone` from UTC at the given instant. */
  static timezoneOffsetMinutes(date: Date, timezone: string): number {
    const dtf = new Intl.DateTimeFormat('en-US', {
      timeZone: timezone,
      hour12: false,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
    const parts = dtf.formatToParts(date).reduce<Record<string, string>>((acc, p) => {
      acc[p.type] = p.value;
      return acc;
    }, {});
    const asUTC = Date.UTC(
      Number(parts.year),
      Number(parts.month) - 1,
      Number(parts.day),
      Number(parts.hour) === 24 ? 0 : Number(parts.hour),
      Number(parts.minute),
      Number(parts.second),
    );
    return (asUTC - date.getTime()) / 60000;
  }

  static daysBetween(a: string, b: string): number {
    const msPerDay = 24 * 60 * 60 * 1000;
    return Math.round((new Date(b).getTime() - new Date(a).getTime()) / msPerDay);
  }

  static addDays(dateStr: string, days: number): string {
    const d = new Date(`${dateStr}T00:00:00.000Z`);
    d.setUTCDate(d.getUTCDate() + days);
    return d.toISOString().slice(0, 10);
  }
}
