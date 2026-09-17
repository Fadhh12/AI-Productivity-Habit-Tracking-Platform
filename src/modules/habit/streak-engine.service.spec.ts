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

  it('handles a realistic multi-day sequence: build up, get forgiven once, then reset on a second miss', () => {
    // Simulates a 7-day rolling window by tracking the last 6 days' statuses
    // and feeding resolveDay day-by-day, exactly as HabitService does against real DB rows.
    let streak = 0;
    const history: Array<'done' | 'missed' | 'skipped_forgiven'> = [];

    const missedInWindow = () =>
      history.slice(-6).filter((s) => s === 'missed' || s === 'skipped_forgiven').length;

    const applyDay = (didCheckIn: boolean) => {
      const result = engine.resolveDay({
        currentStreak: streak,
        missedInWindowBeforeToday: missedInWindow(),
        didCheckIn,
      });
      streak = result.newStreak;
      history.push(result.status);
      return result;
    };

    // Day 1-3: checked in normally.
    applyDay(true);
    applyDay(true);
    expect(applyDay(true)).toEqual({ status: 'done', newStreak: 3, skipCountWindow: 0 });

    // Day 4: missed — first miss in the window, forgiven, streak survives.
    expect(applyDay(false)).toEqual({
      status: 'skipped_forgiven',
      newStreak: 3,
      skipCountWindow: 1,
    });

    // Day 5: checked in again — streak keeps climbing despite the forgiven skip.
    expect(applyDay(true)).toEqual({ status: 'done', newStreak: 4, skipCountWindow: 1 });

    // Day 6: missed again — second miss within the trailing 7-day window, streak resets.
    expect(applyDay(false)).toEqual({ status: 'missed', newStreak: 0, skipCountWindow: 0 });

    // Day 7: a fresh streak begins. The trailing 6-day window still contains
    // the day-4 forgiven skip and the day-6 miss, so skipCountWindow reports 2
    // even though the new streak itself is unaffected by past window content.
    expect(applyDay(true)).toEqual({ status: 'done', newStreak: 1, skipCountWindow: 2 });
  });
});
