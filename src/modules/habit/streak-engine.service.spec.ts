import { StreakEngineService } from './streak-engine.service';

describe('StreakEngineService', () => {
  const engine = new StreakEngineService();

  it('increments the streak on a normal check-in', () => {
    const result = engine.resolveDay({
      currentStreak: 4,
      missedInWindowBeforeToday: 0,
      didCheckIn: true,
    });
    expect(result).toEqual({ status: 'done', newStreak: 5, skipCountWindow: 0 });
  });

  it('increments the streak on check-in even if a prior forgiven skip exists in the window', () => {
    const result = engine.resolveDay({
      currentStreak: 4,
      missedInWindowBeforeToday: 1,
      didCheckIn: true,
    });
    expect(result).toEqual({ status: 'done', newStreak: 5, skipCountWindow: 1 });
  });

  it('forgives the first skip in a 7-day window: streak survives', () => {
    const result = engine.resolveDay({
      currentStreak: 6,
      missedInWindowBeforeToday: 0,
      didCheckIn: false,
    });
    expect(result).toEqual({ status: 'skipped_forgiven', newStreak: 6, skipCountWindow: 1 });
  });

  it('breaks the streak on a second skip within the same 7-day window', () => {
    const result = engine.resolveDay({
      currentStreak: 6,
      missedInWindowBeforeToday: 1,
      didCheckIn: false,
    });
    expect(result).toEqual({ status: 'missed', newStreak: 0, skipCountWindow: 0 });
  });

  it('resets cleanly from zero when a habit is missed with no prior streak', () => {
    const result = engine.resolveDay({
      currentStreak: 0,
      missedInWindowBeforeToday: 1,
      didCheckIn: false,
    });
    expect(result).toEqual({ status: 'missed', newStreak: 0, skipCountWindow: 0 });
  });
});
