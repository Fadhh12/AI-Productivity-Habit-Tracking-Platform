import { Injectable } from '@nestjs/common';

export type DayStatus = 'done' | 'missed' | 'skipped_forgiven';

export interface ResolveDayInput {
  /** Habit's streak counter going into this day. */
  currentStreak: number;
  /** Count of missed/skipped_forgiven days in the trailing 6 days before this one (the rolling 7-day window). */
  missedInWindowBeforeToday: number;
  /** Whether the user explicitly checked in today. */
  didCheckIn: boolean;
}

export interface ResolveDayResult {
  status: DayStatus;
  newStreak: number;
  skipCountWindow: number;
}

/**
 * Forgiveness rule: within any trailing 7-day window, the FIRST missed day is
 * forgiven (streak keeps going, day is recorded as `skipped_forgiven`). A
 * SECOND missed day inside that same window breaks the streak: it is recorded
 * as `missed`, current_streak resets to 0, and a new streak/window begins.
 */
@Injectable()
export class StreakEngineService {
  resolveDay(input: ResolveDayInput): ResolveDayResult {
    if (input.didCheckIn) {
      return {
        status: 'done',
        newStreak: input.currentStreak + 1,
        skipCountWindow: input.missedInWindowBeforeToday,
      };
    }

    if (input.missedInWindowBeforeToday === 0) {
      return {
        status: 'skipped_forgiven',
        newStreak: input.currentStreak,
        skipCountWindow: 1,
      };
    }

    return {
      status: 'missed',
      newStreak: 0,
      skipCountWindow: 0,
    };
  }
}
