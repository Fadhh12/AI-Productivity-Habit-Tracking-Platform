import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../infra/db/prisma.service';

@Injectable()
export class RollupRepository {
  constructor(private readonly prisma: PrismaService) {}

  findActivitiesInRange(userId: string, from: Date, to: Date) {
    return this.prisma.activityLog.findMany({
      where: { userId, startTime: { gte: from, lt: to } },
      include: { category: true },
    });
  }

  findCheckinsInRange(userId: string, fromDateStr: string, toDateStr: string) {
    return this.prisma.habitCheckin.findMany({
      where: {
        habit: { userId },
        checkinDate: {
          gte: new Date(`${fromDateStr}T00:00:00.000Z`),
          lte: new Date(`${toDateStr}T00:00:00.000Z`),
        },
      },
      include: { habit: true },
    });
  }

  findActiveHabitsWithGoals(userId: string) {
    return this.prisma.habit.findMany({
      where: { userId, active: true },
      include: { goal: true },
    });
  }

  findAllUsers() {
    return this.prisma.user.findMany({ select: { id: true, timezone: true } });
  }
}
