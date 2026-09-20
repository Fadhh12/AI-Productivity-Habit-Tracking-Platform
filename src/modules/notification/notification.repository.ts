import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../infra/db/prisma.service';

@Injectable()
export class NotificationRepository {
  constructor(private readonly prisma: PrismaService) {}

  findAll(userId: string) {
    return this.prisma.notification.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });
  }

  create(userId: string, type: string, message: string, refId?: string) {
    return this.prisma.notification.create({ data: { userId, type, message, refId } });
  }

  findByTypeAndRef(userId: string, type: string, refId: string) {
    return this.prisma.notification.findFirst({ where: { userId, type, refId } });
  }

  findByTypesAndRef(userId: string, types: string[], refId: string) {
    return this.prisma.notification.findFirst({ where: { userId, type: { in: types }, refId } });
  }

  markAllRead(userId: string) {
    return this.prisma.notification.updateMany({ where: { userId, read: false }, data: { read: true } });
  }

  markRead(userId: string, id: string) {
    return this.prisma.notification.updateMany({
      where: { id, userId },
      data: { read: true },
    });
  }
}
