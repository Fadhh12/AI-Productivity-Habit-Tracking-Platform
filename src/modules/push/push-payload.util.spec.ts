import { buildPushPayload, isExpiredSubscriptionError } from './push-payload.util';

describe('buildPushPayload', () => {
  it('routes AI and template insights to the same destination', () => {
    const ai = buildPushPayload('ai_insight_weekly_win', 'Mantap minggu ini');
    const plain = buildPushPayload('insight_weekly_win', 'Mantap minggu ini');
    expect(ai.url).toBe('/reports');
    expect(ai).toEqual(plain);
  });

  it('opens the habit tracker for habit reminders', () => {
    expect(buildPushPayload('habit_reminder', 'Belum check-in').url).toBe('/habit-tracker');
  });

  it('falls back to a generic payload for unknown types', () => {
    const p = buildPushPayload('something_new', 'halo');
    expect(p).toMatchObject({ title: 'Continuum', url: '/today', body: 'halo' });
  });

  it('truncates very long messages', () => {
    const p = buildPushPayload('comeback', 'x'.repeat(500));
    expect(p.body.length).toBeLessThanOrEqual(180);
    expect(p.body.endsWith('…')).toBe(true);
  });
});

describe('isExpiredSubscriptionError', () => {
  it('treats 404 and 410 as expired, other errors as transient', () => {
    expect(isExpiredSubscriptionError({ statusCode: 410 })).toBe(true);
    expect(isExpiredSubscriptionError({ statusCode: 404 })).toBe(true);
    expect(isExpiredSubscriptionError({ statusCode: 500 })).toBe(false);
    expect(isExpiredSubscriptionError(new Error('network'))).toBe(false);
  });
});
