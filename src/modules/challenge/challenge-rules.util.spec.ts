import {
  buildChallengePrompt,
  clampTarget,
  computeProgress,
  fallbackChallenge,
  localMidnightUtc,
  sanitizeDraft,
  weekStartOf,
} from './challenge-rules.util';

describe('weekStartOf', () => {
  it('returns the same day for a Monday', () => {
    expect(weekStartOf('2026-09-21')).toBe('2026-09-21');
  });
  it('maps Sunday back to the previous Monday', () => {
    expect(weekStartOf('2026-09-20')).toBe('2026-09-14');
  });
  it('maps midweek to Monday', () => {
    expect(weekStartOf('2026-09-24')).toBe('2026-09-21');
  });
  it('crosses month boundaries', () => {
    expect(weekStartOf('2026-10-01')).toBe('2026-09-28');
  });
});

describe('localMidnightUtc', () => {
  it('is 17:00 UTC the previous day for Asia/Jakarta (UTC+7)', () => {
    expect(localMidnightUtc('2026-09-21', 'Asia/Jakarta').toISOString()).toBe('2026-09-20T17:00:00.000Z');
  });
  it('is 00:00 UTC for UTC', () => {
    expect(localMidnightUtc('2026-09-21', 'UTC').toISOString()).toBe('2026-09-21T00:00:00.000Z');
  });
});

describe('clampTarget', () => {
  it('keeps targets inside the metric bounds', () => {
    expect(clampTarget('active_days', 50)).toBe(7);
    expect(clampTarget('checkins', 0)).toBe(3);
    expect(clampTarget('activities', 8.6)).toBe(9);
  });
});

describe('sanitizeDraft', () => {
  it('accepts a valid draft and trims text', () => {
    const draft = sanitizeDraft({ title: ' Aktif 5 hari ', description: 'Semangat!', metric: 'active_days', target: 5 });
    expect(draft).toEqual({ title: 'Aktif 5 hari', description: 'Semangat!', metric: 'active_days', target: 5 });
  });
  it('rejects a target outside the bounds instead of contradicting its own description', () => {
    expect(sanitizeDraft({ title: 'a', description: 'Aktif 99 hari', metric: 'active_days', target: 99 })).toBeNull();
    expect(sanitizeDraft({ title: 'a', description: 'Cukup 1 check-in', metric: 'checkins', target: 1 })).toBeNull();
  });
  it('accepts numeric strings for target', () => {
    expect(sanitizeDraft({ title: 'a', description: 'b', metric: 'checkins', target: '10' })?.target).toBe(10);
  });
  it('rejects unknown metrics, missing text and junk', () => {
    expect(sanitizeDraft({ title: 'a', description: 'b', metric: 'steps', target: 5 })).toBeNull();
    expect(sanitizeDraft({ title: '', description: 'b', metric: 'checkins', target: 5 })).toBeNull();
    expect(sanitizeDraft({ title: 'a', description: 'b', metric: 'checkins', target: 'abc' })).toBeNull();
    expect(sanitizeDraft(null)).toBeNull();
  });
});

describe('fallbackChallenge', () => {
  it('stretches last week check-ins when the user has habits', () => {
    const draft = fallbackChallenge({ checkins: 10, activities: 0, activeDays: 4, activeHabits: 3 });
    expect(draft.metric).toBe('checkins');
    expect(draft.target).toBe(12);
  });
  it('uses at least 3 check-ins per habit for a new user', () => {
    expect(fallbackChallenge({ checkins: 0, activities: 0, activeDays: 0, activeHabits: 2 }).target).toBe(6);
  });
  it('falls back to activities, then to a gentle active-days goal', () => {
    expect(fallbackChallenge({ checkins: 0, activities: 5, activeDays: 2, activeHabits: 0 }).metric).toBe('activities');
    const empty = fallbackChallenge({ checkins: 0, activities: 0, activeDays: 0, activeHabits: 0 });
    expect(empty).toMatchObject({ metric: 'active_days', target: 3 });
  });
});

describe('computeProgress / prompt', () => {
  it('picks the counter matching the metric', () => {
    const counts = { checkins: 4, activities: 6, activeDays: 3 };
    expect(computeProgress('checkins', counts)).toBe(4);
    expect(computeProgress('activities', counts)).toBe(6);
    expect(computeProgress('active_days', counts)).toBe(3);
  });
  it('puts facts in the user message, not the system prompt', () => {
    const { system, user } = buildChallengePrompt({ checkins: 4, activities: 6, activeDays: 3, activeHabits: 2 });
    expect(user).toContain('check-in habit selesai 4');
    expect(system).not.toContain('selesai 4');
  });
});
