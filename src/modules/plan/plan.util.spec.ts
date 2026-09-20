import { dailyLimit, extendPremium, FREE_DAILY_LIMITS, resolvePlan } from './plan.util';

const NOW = new Date('2026-09-20T10:00:00Z');

describe('resolvePlan', () => {
  it('is free without or after premiumUntil', () => {
    expect(resolvePlan(null, NOW)).toBe('free');
    expect(resolvePlan(undefined, NOW)).toBe('free');
    expect(resolvePlan(new Date('2026-09-20T09:59:59Z'), NOW)).toBe('free');
    expect(resolvePlan(NOW, NOW)).toBe('free');
  });
  it('is plus while premiumUntil is in the future', () => {
    expect(resolvePlan(new Date('2026-09-21T00:00:00Z'), NOW)).toBe('plus');
  });
});

describe('dailyLimit', () => {
  it('gives free users the small fixed budget per bucket', () => {
    expect(dailyLimit('free', 'coach', 50)).toBe(FREE_DAILY_LIMITS.coach);
    expect(dailyLimit('free', 'ai', 50)).toBe(FREE_DAILY_LIMITS.ai);
  });
  it('gives plus users the configured ceiling', () => {
    expect(dailyLimit('plus', 'coach', 50)).toBe(50);
    expect(dailyLimit('plus', 'ai', 80)).toBe(80);
  });
});

describe('extendPremium', () => {
  it('starts from now when there is no active period', () => {
    expect(extendPremium(null, 30, NOW).toISOString()).toBe('2026-10-20T10:00:00.000Z');
    expect(extendPremium(new Date('2026-01-01T00:00:00Z'), 7, NOW).toISOString()).toBe('2026-09-27T10:00:00.000Z');
  });
  it('adds to the remaining time when renewing early', () => {
    expect(extendPremium(new Date('2026-09-25T10:00:00Z'), 30, NOW).toISOString()).toBe('2026-10-25T10:00:00.000Z');
  });
});
