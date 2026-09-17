import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../infra/db/prisma.service';

@Injectable()
export class GoalRepository {
  constructor(private readonly prisma: PrismaService) {}

  findAll(userId: string) {
    return this.prisma.goal.findMany({ where: { userId }, orderBy: { createdAt: 'desc' } });
  }

  findById(userId: string, id: string) {
    return this.prisma.goal.findFirst({ where: { id, userId } });
  }

  findBreakdown(userId: string, id: string) {
    return this.prisma.goal.findFirst({
      where: { id, userId },
      include: {
        habits: true,
        childGoals: {
          include: { habits: true },
          orderBy: { createdAt: 'asc' },
        },
      },
    });
  }

  create(
    userId: string,
    data: {
      title: string;
      horizon: 'yearly' | 'monthly';
      parentGoalId?: string | null;
      targetDate?: Date | null;
    },
  ) {
    return this.prisma.goal.create({ data: { userId, ...data } });
  }

  update(id: string, data: Record<string, unknown>) {
    return this.prisma.goal.update({ where: { id }, data });
  }

  delete(id: string) {
    return this.prisma.goal.delete({ where: { id } });
  }
}
