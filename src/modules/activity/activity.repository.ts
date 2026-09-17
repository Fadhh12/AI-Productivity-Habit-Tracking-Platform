import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../infra/db/prisma.service';

export interface ActivityWriteData {
  title: string;
  categoryId?: string | null;
  startTime: Date;
  endTime: Date;
  note?: string | null;
}

@Injectable()
export class ActivityRepository {
  constructor(private readonly prisma: PrismaService) {}

  findAllForDate(userId: string, dayStart: Date, dayEnd: Date) {
    return this.prisma.activityLog.findMany({
      where: { userId, startTime: { gte: dayStart, lt: dayEnd } },
      orderBy: { startTime: 'asc' },
      include: { category: true },
    });
  }

  findAll(userId: string) {
    return this.prisma.activityLog.findMany({
      where: { userId },
      orderBy: { startTime: 'desc' },
      include: { category: true },
    });
  }

  findById(userId: string, id: string) {
    return this.prisma.activityLog.findFirst({
      where: { id, userId },
      include: { category: true },
    });
  }

  /** Activity logs for the same user+category whose time range overlaps [startTime, endTime), excluding `excludeId`. */
  findOverlapping(
    userId: string,
    categoryId: string,
    startTime: Date,
    endTime: Date,
    excludeId?: string,
  ) {
    return this.prisma.activityLog.findMany({
      where: {
        userId,
        categoryId,
        id: excludeId ? { not: excludeId } : undefined,
        startTime: { lt: endTime },
        endTime: { gt: startTime },
      },
    });
  }

  create(userId: string, data: ActivityWriteData) {
    return this.prisma.activityLog.create({
      data: { userId, ...data },
      include: { category: true },
    });
  }

  update(id: string, data: Partial<ActivityWriteData>) {
    return this.prisma.activityLog.update({ where: { id }, data, include: { category: true } });
  }

  delete(id: string) {
    return this.prisma.activityLog.delete({ where: { id } });
  }
}
