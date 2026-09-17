import { DateUtil } from './date.util';

describe('DateUtil', () => {
  it('formats local date string in a given timezone', () => {
    const date = new Date('2026-01-15T20:30:00.000Z');
    expect(DateUtil.localDateString(date, 'UTC')).toBe('2026-01-15');
    // Asia/Jakarta is UTC+7, so 20:30 UTC is already the next day locally.
    expect(DateUtil.localDateString(date, 'Asia/Jakarta')).toBe('2026-01-16');
  });

  it('computes days between two date strings', () => {
    expect(DateUtil.daysBetween('2026-01-01', '2026-01-08')).toBe(7);
    expect(DateUtil.daysBetween('2026-01-08', '2026-01-01')).toBe(-7);
  });

  it('adds days to a date string', () => {
    expect(DateUtil.addDays('2026-01-30', 3)).toBe('2026-02-02');
  });
});
