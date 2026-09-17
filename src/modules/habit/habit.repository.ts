import { Injectable } from '@nestjs/common';
import { CheckinStatus } from '@prisma/client';
import { PrismaService } from '../../infra/db/prisma.service';

@Injectable()
export class HabitRepository {
  constructor(private readonly prisma: PrismaService) {}

  countActive(userId: string) {
    return this.prisma.habit.count({ where: { userId, active: true } });
  }

  findAll(userId: string) {
    return this.prisma.habit.findMany({ where: { userId }, orderBy: { createdAt: 'asc' } });
  }

  findAllActive(userId?: string) {
    return this.prisma.habit.findMany({ where: { active: true, userId } });
  }

  findById(userId: string, id: string) {
    return this.prisma.habit.findFirst({ where: { id, userId } });
  }

  findByIdWithUser(id: string) {
    return this.prisma.habit.findUnique({ where: { id }, include: { user: true } });
  }

  create(userId: string, data: { name: string; frequency: string; goalId?: string | null }) {
    return this.prisma.habit.create({ data: { userId, ...data } });
  }

  update(id: string, data: Record<string, unknown>) {
    return this.prisma.habit.update({ where: { id }, data });
  }

  delete(id: string) {
    return this.prisma.habit.delete({ where: { id } });
  }

  findCheckinsInRange(habitId: string, fromDateStr: string, toDateStr: string) {
    return this.prisma.habitCheckin.findMany({
      where: {
        habitId,
        checkinDate: {
          gte: new Date(`${fromDateStr}T00:00:00.000Z`),
          lte: new Date(`${toDateStr}T00:00:00.000Z`),
        },
      },
      orderBy: { checkinDate: 'asc' },
    });
  }

  findCheckinByDate(habitId: string, dateStr: string) {
    return this.prisma.habitCheckin.findUnique({
      where: {
        habitId_checkinDate: { habitId, checkinDate: new Date(`${dateStr}T00:00:00.000Z`) },
      },
    });
  }

  findLatestCheckin(habitId: string) {
    return this.prisma.habitCheckin.findFirst({
      where: { habitId },
      orderBy: { checkinDate: 'desc' },
    });
  }

  upsertCheckin(habitId: string, dateStr: string, status: CheckinStatus, note?: string | null) {
    const checkinDate = new Date(`${dateStr}T00:00:00.000Z`);
    return this.prisma.habitCheckin.upsert({
      where: { habitId_checkinDate: { habitId, checkinDate } },
      create: { habitId, checkinDate, status, note: note ?? null },
      update: { status, note: note ?? undefined },
    });
  }
}
