import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../infra/db/prisma.service';
import { DateUtil } from '../../shared/utils/date.util';
import { ChallengeDraft, localMidnightUtc, WeekCounts } from './challenge-rules.util';

@Injectable()
export class ChallengeRepository {
  constructor(private readonly prisma: PrismaService) {}

  async getTimezone(userId: string): Promise<string> {
    const user = await this.prisma.user.findUniqueOrThrow({ where: { id: userId }, select: { timezone: true } });
    return user.timezone;
  }

  findByWeek(userId: string, weekStart: string) {
    return this.prisma.weeklyChallenge.findUnique({ where: { userId_weekStart: { userId, weekStart } } });
  }

  findBefore(userId: string, weekStart: string, take: number) {
    return this.prisma.weeklyChallenge.findMany({
      where: { userId, weekStart: { lt: weekStart } },
      orderBy: { weekStart: 'desc' },
      take,
    });
  }

  /** Challenges created recently that are still open — candidates for the completion sweep. */
  findOpenRecent(since: Date) {
    return this.prisma.weeklyChallenge.findMany({ where: { completedAt: null, createdAt: { gte: since } } });
  }

  create(userId: string, weekStart: string, draft: ChallengeDraft, isAiGenerated: boolean) {
    return this.prisma.weeklyChallenge.create({ data: { userId, weekStart, ...draft, isAiGenerated } });
  }

  /** True only for the caller that actually flipped it, so the completion notification is sent once. */
  async markCompleted(id: string): Promise<boolean> {
    const result = await this.prisma.weeklyChallenge.updateMany({
      where: { id, completedAt: null },
      data: { completedAt: new Date() },
    });
    return result.count === 1;
  }

  countActiveHabits(userId: string) {
    return this.prisma.habit.count({ where: { userId, active: true } });
  }

  /** Counts for the local Monday–Sunday week starting at `weekStart`. */
  async countsForWeek(userId: string, timezone: string, weekStart: string): Promise<WeekCounts> {
    const nextWeek = DateUtil.addDays(weekStart, 7);
    const [checkins, activities] = await Promise.all([
      this.prisma.habitCheckin.findMany({
        where: {
          habit: { userId },
          status: 'done',
          checkinDate: { gte: new Date(`${weekStart}T00:00:00.000Z`), lt: new Date(`${nextWeek}T00:00:00.000Z`) },
        },
        select: { checkinDate: true },
      }),
      this.prisma.activityLog.findMany({
        where: {
          userId,
          startTime: { gte: localMidnightUtc(weekStart, timezone), lt: localMidnightUtc(nextWeek, timezone) },
        },
        select: { startTime: true },
      }),
    ]);

    const days = new Set<string>();
    for (const c of checkins) days.add(c.checkinDate.toISOString().slice(0, 10));
    for (const a of activities) days.add(DateUtil.localDateString(a.startTime, timezone));
    return { checkins: checkins.length, activities: activities.length, activeDays: days.size };
  }
}
