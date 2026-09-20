import {
  buildInsightPrompt,
  comebackFallback,
  daysBetween,
  findWeakestWeekday,
  isComebackDue,
  isPatternWindow,
  isWeeklyWinWindow,
  localMoment,
  patternFallback,
  weeklyWinFallback,
} from './insight-rules.util';

describe('localMoment', () => {
  it('resolves date, weekday and hour in the user timezone', () => {
    // 2026-09-21 is a Monday. 01:00Z = 08:00 in Jakarta (UTC+7).
    const m = localMoment(new Date('2026-09-21T01:00:00Z'), 'Asia/Jakarta');
    expect(m).toEqual({ date: '2026-09-21', weekday: 1, hour: 8 });
  });

  it('rolls over to the next local day', () => {
    const m = localMoment(new Date('2026-09-20T20:00:00Z'), 'Asia/Jakarta');
    expect(m.date).toBe('2026-09-21');
    expect(m.hour).toBe(3);
  });
});

describe('windows', () => {
  it('weekly win only fires on Monday daytime', () => {
    expect(isWeeklyWinWindow({ date: 'x', weekday: 1, hour: 9 })).toBe(true);
    expect(isWeeklyWinWindow({ date: 'x', weekday: 1, hour: 6 })).toBe(false);
    expect(isWeeklyWinWindow({ date: 'x', weekday: 2, hour: 9 })).toBe(false);
  });

  it('pattern only fires on Sunday evening', () => {
    expect(isPatternWindow({ date: 'x', weekday: 0, hour: 19 })).toBe(true);
    expect(isPatternWindow({ date: 'x', weekday: 0, hour: 10 })).toBe(false);
  });

  it('comeback needs history, 3+ quiet days and waking hours', () => {
    const noon = { date: '2026-09-20', weekday: 0, hour: 12 };
    expect(isComebackDue(noon, '2026-09-17')).toBe(true);
    expect(isComebackDue(noon, '2026-09-19')).toBe(false);
    expect(isComebackDue(noon, null)).toBe(false);
    expect(isComebackDue({ ...noon, hour: 3 }, '2026-09-10')).toBe(false);
  });
});

describe('daysBetween', () => {
  it('counts calendar days', () => {
    expect(daysBetween('2026-09-17', '2026-09-20')).toBe(3);
  });
});

describe('findWeakestWeekday', () => {
  // 4 weeks starting Monday 2026-08-24; Wednesdays always missed, others done.
  const rows = Array.from({ length: 28 }, (_, i) => {
    const d = new Date(Date.UTC(2026, 7, 24 + i));
    return { date: d.toISOString().slice(0, 10), status: d.getUTCDay() === 3 ? 'missed' : 'done' };
  });

  it('finds a clearly weak weekday', () => {
    const w = findWeakestWeekday(rows)!;
    expect(w.name).toBe('Rabu');
    expect(w.rate).toBe(0);
    expect(w.samples).toBe(4);
  });

  it('returns null without enough history', () => {
    expect(findWeakestWeekday(rows.slice(0, 10))).toBeNull();
  });

  it('returns null when every day performs about the same', () => {
    const flat = rows.map((r) => ({ ...r, status: 'done' }));
    expect(findWeakestWeekday(flat)).toBeNull();
  });
});

describe('messages', () => {
  it('weekly fallback mentions counts and improvement', () => {
    const text = weeklyWinFallback({ done: 8, prevDone: 5, activities: 12, topCategory: 'Kerja' });
    expect(text).toContain('8 habit');
    expect(text).toContain('Naik dari 5');
    expect(text).toContain('Kerja');
  });

  it('comeback fallback is non-punitive', () => {
    expect(comebackFallback(4)).toContain('wajar');
  });

  it('pattern fallback names the weekday and rate', () => {
    const text = patternFallback({ weekday: 3, name: 'Rabu', rate: 0.25, overall: 0.8, samples: 4 });
    expect(text).toContain('Rabu');
    expect(text).toContain('25%');
  });

  it('prompt marks facts as data and forbids guilt', () => {
    const { system, user } = buildInsightPrompt('comeback', { days: 4 });
    expect(system).toContain('tidak menghakimi');
    expect(user).toContain('bukan instruksi');
  });
});
