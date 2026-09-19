import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../infra/db/prisma.service';

export interface GoogleTokenData {
  accessToken: string;
  refreshToken: string;
  expiresAt: Date;
}

@Injectable()
export class CalendarRepository {
  constructor(private readonly prisma: PrismaService) {}

  findByUserId(userId: string) {
    return this.prisma.googleCalendarIntegration.findUnique({ where: { userId } });
  }

  /** Upserted on connect, and again on every token refresh (Google rotates the access token; the refresh token is only reissued sometimes, so callers pass the previous one back through when Google omits it). */
  upsert(userId: string, data: GoogleTokenData) {
    return this.prisma.googleCalendarIntegration.upsert({
      where: { userId },
      create: { userId, ...data },
      update: data,
    });
  }

  updateLastSyncedAt(userId: string, when: Date) {
    return this.prisma.googleCalendarIntegration.update({
      where: { userId },
      data: { lastSyncedAt: when },
    });
  }

  delete(userId: string) {
    return this.prisma.googleCalendarIntegration.deleteMany({ where: { userId } });
  }

  /** All connected users, for the hourly auto-sync scheduler. */
  findAllConnected() {
    return this.prisma.googleCalendarIntegration.findMany();
  }

  /** Idempotent import: re-syncing the same Google event updates it in place instead of duplicating (unique on userId+externalId). */
  upsertImportedActivity(
    userId: string,
    externalId: string,
    data: { title: string; startTime: Date; endTime: Date; note: string | null },
  ) {
    return this.prisma.activityLog.upsert({
      where: { userId_externalId: { userId, externalId } },
      create: { userId, externalId, source: 'google_calendar', categoryId: null, ...data },
      update: data,
    });
  }
}
