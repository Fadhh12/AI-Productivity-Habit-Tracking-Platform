import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../infra/db/prisma.service';
import { GamificationStats } from './gamification-calculator.util';

@Injectable()
export class GamificationRepository {
  constructor(private readonly prisma: PrismaService) {}

  async loadStats(userId: string): Promise<GamificationStats> {
    const [doneCheckins, forgivenRestDays, activitiesLogged, reflectionsAnswered, goalsCompleted, goalLinkedHabits, streak] =
      await Promise.all([
        this.prisma.habitCheckin.count({ where: { habit: { userId }, status: 'done' } }),
        this.prisma.habitCheckin.count({ where: { habit: { userId }, status: 'skipped_forgiven' } }),
        this.prisma.activityLog.count({ where: { userId } }),
        this.prisma.dailyReflection.count({ where: { userId, responseText: { not: null } } }),
        this.prisma.goal.count({ where: { userId, status: 'completed' } }),
        this.prisma.habit.count({ where: { userId, goalId: { not: null } } }),
        this.prisma.habit.aggregate({ where: { userId }, _max: { currentStreak: true } }),
      ]);

    return {
      doneCheckins,
      forgivenRestDays,
      activitiesLogged,
      reflectionsAnswered,
      goalsCompleted,
      goalLinkedHabits,
      longestStreak: streak._max.currentStreak ?? 0,
    };
  }
}
