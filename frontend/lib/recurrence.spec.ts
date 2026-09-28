import { describe, expect, it } from 'vitest';
import { generateOccurrenceDates } from './recurrence';

describe('generateOccurrenceDates', () => {
  it('returns just the start date when the rule is "none"', () => {
    expect(generateOccurrenceDates('2026-01-05', 'none', '2026-01-31')).toEqual(['2026-01-05']);
  });

  it('returns just the start date when there is no untilDate, regardless of rule', () => {
    expect(generateOccurrenceDates('2026-01-05', 'daily')).toEqual(['2026-01-05']);
  });

  it('expands "daily" to every date in the inclusive range', () => {
    const dates = generateOccurrenceDates('2026-01-05', 'daily', '2026-01-08');
    expect(dates).toEqual(['2026-01-05', '2026-01-06', '2026-01-07', '2026-01-08']);
  });

  it('expands "weekdays" to Mon-Fri only, skipping the weekend', () => {
    // 2026-01-05 is a Monday.
    const dates = generateOccurrenceDates('2026-01-05', 'weekdays', '2026-01-11');
    expect(dates).toEqual(['2026-01-05', '2026-01-06', '2026-01-07', '2026-01-08', '2026-01-09']);
  });

  it('expands "weekly" to the same weekday each week', () => {
    // 2026-01-05 is a Monday.
    const dates = generateOccurrenceDates('2026-01-05', 'weekly', '2026-01-26');
    expect(dates).toEqual(['2026-01-05', '2026-01-12', '2026-01-19', '2026-01-26']);
  });

  it('falls back to the start date alone when untilDate precedes it', () => {
    expect(generateOccurrenceDates('2026-01-10', 'daily', '2026-01-01')).toEqual(['2026-01-10']);
  });

  it('caps the occurrence count so a multi-year range never runs away', () => {
    const dates = generateOccurrenceDates('2020-01-01', 'daily', '2030-01-01');
    expect(dates.length).toBeLessThanOrEqual(366);
  });
});
