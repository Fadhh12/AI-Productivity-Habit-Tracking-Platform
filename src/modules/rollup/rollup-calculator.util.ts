export interface ActivityForRollup {
  categoryName: string | null;
  startTime: Date;
  endTime: Date;
}

export interface CheckinForRollup {
  habitId: string;
  status: string;
}

export interface HabitForRollup {
  id: string;
  name: string;
  currentStreak: number;
  goalId: string | null;
  goalTitle: string | null;
}

/**
 * Pure aggregation helpers for the rollup engine — no DB/cache access, so
 * they're cheap to unit test in isolation from Prisma/Redis.
 */
export class RollupCalculator {
  static categoryDistributionMinutes(activities: ActivityForRollup[]): Record<string, number> {
    const distribution: Record<string, number> = {};
    for (const activity of activities) {
      const key = activity.categoryName ?? 'Uncategorized';
      const minutes = (activity.endTime.getTime() - activity.startTime.getTime()) / 60000;
      distribution[key] = (distribution[key] ?? 0) + minutes;
    }
    return distribution;
  }

  static checkinStatusCounts(checkins: CheckinForRollup[]): Record<string, number> {
    const counts: Record<string, number> = { done: 0, missed: 0, skipped_forgiven: 0 };
    for (const checkin of checkins) {
      counts[checkin.status] = (counts[checkin.status] ?? 0) + 1;
    }
    return counts;
  }

  static habitStreakTrend(habits: HabitForRollup[]): Array<{
    habitId: string;
    name: string;
    currentStreak: number;
    goalId: string | null;
    goalTitle: string | null;
  }> {
    return habits.map((h) => ({
      habitId: h.id,
      name: h.name,
      currentStreak: h.currentStreak,
      goalId: h.goalId,
      goalTitle: h.goalTitle,
    }));
  }

  /** Goal progress = completed checkins for habits under that goal, over the period. */
  static goalProgress(
    habits: HabitForRollup[],
    checkinsByHabitId: Map<string, CheckinForRollup[]>,
  ): Array<{ goalId: string; goalTitle: string; doneCount: number; habitCount: number }> {
    const byGoal = new Map<string, { goalTitle: string; doneCount: number; habitCount: number }>();
    for (const habit of habits) {
      if (!habit.goalId) continue;
      const entry = byGoal.get(habit.goalId) ?? {
        goalTitle: habit.goalTitle ?? 'Untitled goal',
        doneCount: 0,
        habitCount: 0,
      };
      entry.habitCount += 1;
      const checkins = checkinsByHabitId.get(habit.id) ?? [];
      entry.doneCount += checkins.filter((c) => c.status === 'done').length;
      byGoal.set(habit.goalId, entry);
    }
    return Array.from(byGoal.entries()).map(([goalId, v]) => ({ goalId, ...v }));
  }
}
