import { Injectable } from '@nestjs/common';
import { RedisService } from '../../infra/cache/redis.service';
import { RollupRepository } from './rollup.repository';
import { RollupCalculator } from './rollup-calculator.util';

export interface MonthlyRollupSummary {
  userId: string;
  month: string;
  generatedAt: string;
  categoryDistributionMinutes: Record<string, number>;
  checkinStatusCounts: Record<string, number>;
  habitStreakTrend: Array<{
    habitId: string;
    name: string;
    currentStreak: number;
    goalId: string | null;
    goalTitle: string | null;
  }>;
  goalProgress: Array<{ goalId: string; goalTitle: string; doneCount: number; habitCount: number }>;
}

const CACHE_PREFIX = 'rollup:monthly';

@Injectable()
export class RollupService {
  constructor(
    private readonly repository: RollupRepository,
    private readonly redis: RedisService,
  ) {}

  private cacheKey(userId: string, month: string): string {
    return `${CACHE_PREFIX}:${userId}:${month}`;
  }

  async getMonthlyFromCache(userId: string, month: string): Promise<MonthlyRollupSummary | null> {
    return this.redis.getJson<MonthlyRollupSummary>(this.cacheKey(userId, month));
  }

  /** Computes the monthly rollup directly from source data and writes it to cache. Never called synchronously from the read endpoint — only from the job processor / manual refresh. */
  async computeAndCacheMonthly(userId: string, month: string): Promise<MonthlyRollupSummary> {
    const [yearStr, monthStr] = month.split('-');
    const from = new Date(Date.UTC(Number(yearStr), Number(monthStr) - 1, 1));
    const to = new Date(Date.UTC(Number(yearStr), Number(monthStr), 1));
    const fromDateStr = from.toISOString().slice(0, 10);
    const toDateStr = new Date(to.getTime() - 86400000).toISOString().slice(0, 10);

    const [activities, checkins, habits] = await Promise.all([
      this.repository.findActivitiesInRange(userId, from, to),
      this.repository.findCheckinsInRange(userId, fromDateStr, toDateStr),
      this.repository.findActiveHabitsWithGoals(userId),
    ]);

    const categoryDistributionMinutes = RollupCalculator.categoryDistributionMinutes(
      activities.map((a) => ({
        categoryName: a.category?.name ?? null,
        startTime: a.startTime,
        endTime: a.endTime,
      })),
    );

    const checkinStatusCounts = RollupCalculator.checkinStatusCounts(
      checkins.map((c) => ({ habitId: c.habitId, status: c.status })),
    );

    const habitsForRollup = habits.map((h) => ({
      id: h.id,
      name: h.name,
      currentStreak: h.currentStreak,
      goalId: h.goalId,
      goalTitle: h.goal?.title ?? null,
    }));

    const checkinsByHabitId = new Map<string, { habitId: string; status: string }[]>();
    for (const checkin of checkins) {
      const list = checkinsByHabitId.get(checkin.habitId) ?? [];
      list.push({ habitId: checkin.habitId, status: checkin.status });
      checkinsByHabitId.set(checkin.habitId, list);
    }

    const summary: MonthlyRollupSummary = {
      userId,
      month,
      generatedAt: new Date().toISOString(),
      categoryDistributionMinutes,
      checkinStatusCounts,
      habitStreakTrend: RollupCalculator.habitStreakTrend(habitsForRollup),
      goalProgress: RollupCalculator.goalProgress(habitsForRollup, checkinsByHabitId),
    };

    // No TTL: the cache IS the report. It's only ever replaced by a fresh
    // computeAndCacheMonthly run (scheduled or manual refresh), never expired.
    await this.redis.setJson(this.cacheKey(userId, month), summary);
    return summary;
  }

  async getAllUserIds(): Promise<string[]> {
    const users = await this.repository.findAllUsers();
    return users.map((u) => u.id);
  }
}
