import { describe, expect, it } from 'vitest';
import {
  dateToStr,
  toDatetimeLocalValue,
  last7Days,
  last7DatesMonToSun,
  DAY_LABELS_SUNDAY_FIRST,
  DAY_LABELS_MONDAY_FIRST,
} from './date';

describe('dateToStr', () => {
  it('formats a date as local yyyy-mm-dd, zero-padded', () => {
    expect(dateToStr(new Date(2026, 0, 5))).toBe('2026-01-05');
    expect(dateToStr(new Date(2026, 11, 31))).toBe('2026-12-31');
  });
});

describe('toDatetimeLocalValue', () => {
  it('converts an ISO datetime into a datetime-local input value', () => {
    const iso = new Date(2026, 2, 9, 8, 5).toISOString();
    expect(toDatetimeLocalValue(iso)).toBe('2026-03-09T08:05');
  });
});

describe('last7Days', () => {
  it('returns 7 consecutive dates ending today, oldest first', () => {
    const days = last7Days();
    expect(days).toHaveLength(7);
    expect(days[6]).toBe(dateToStr(new Date()));
    const d0 = new Date();
    d0.setDate(d0.getDate() - 6);
    expect(days[0]).toBe(dateToStr(d0));
  });
});

describe('last7DatesMonToSun', () => {
  it('always starts on a Monday and ends on a Sunday', () => {
    const week = last7DatesMonToSun();
    expect(week).toHaveLength(7);
    const monday = new Date(`${week[0]}T00:00:00`);
    const sunday = new Date(`${week[6]}T00:00:00`);
    expect(monday.getDay()).toBe(1);
    expect(sunday.getDay()).toBe(0);
  });

  it('produces 7 strictly consecutive calendar days', () => {
    const week = last7DatesMonToSun();
    for (let i = 1; i < week.length; i++) {
      const prev = new Date(`${week[i - 1]}T00:00:00`);
      const cur = new Date(`${week[i]}T00:00:00`);
      expect(cur.getTime() - prev.getTime()).toBe(24 * 60 * 60 * 1000);
    }
  });
});

describe('day label tables', () => {
  it('are positioned so getDay() indexing and the Monday-first grid stay distinct orderings', () => {
    expect(DAY_LABELS_SUNDAY_FIRST[0]).toBe('Min');
    expect(DAY_LABELS_MONDAY_FIRST[0]).toBe('Sen');
    expect(DAY_LABELS_SUNDAY_FIRST).toHaveLength(7);
    expect(DAY_LABELS_MONDAY_FIRST).toHaveLength(7);
  });
});
