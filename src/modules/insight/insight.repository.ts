import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../infra/db/prisma.service';
import { DateUtil } from '../../shared/utils/date.util';
import { CheckinRow } from './insight-rules.util';

@Injectable()
export class InsightRepository {
  constructor(private readonly prisma: PrismaService) {}

  findOptedInUsers() {
    return this.prisma.user.findMany({
      where: { proactiveInsights: true },
      select: { id: true, timezone: true },
    });
  }

  /** Latest local date on which the user logged an activity or completed a habit, or null for a brand-new account. */
  async lastActivityDate(userId: string, timezone: string): Promise<string | null> {
    const [activity, checkin] = await Promise.all([
      this.prisma.activityLog.findFirst({
        where: { userId },
        orderBy: { startTime: 'desc' },
        select: { startTime: true },
      }),
      this.prisma.habitCheckin.findFirst({
        where: { habit: { userId }, status: 'done' },
        orderBy: { checkinDate: 'desc' },
        select: { checkinDate: true },
      }),
    ]);

    const dates = [
      activity ? DateUtil.localDateString(activity.startTime, timezone) : null,
      checkin ? checkin.checkinDate.toISOString().slice(0, 10) : null,
    ].filter((d): d is string => d !== null);

    return dates.length ? dates.sort().at(-1)! : null;
  }

  async checkinRows(userId: string, fromDate: string, toDate: string): Promise<CheckinRow[]> {
    const rows = await this.prisma.habitCheckin.findMany({
      where: {
        habit: { userId },
        checkinDate: { gte: new Date(`${fromDate}T00:00:00.000Z`), lte: new Date(`${toDate}T00:00:00.000Z`) },
      },
      select: { checkinDate: true, status: true },
    });
    return rows.map((r) => ({ date: r.checkinDate.toISOString().slice(0, 10), status: r.status }));
  }

  countActivities(userId: string, from: Date, to: Date) {
    return this.prisma.activityLog.count({ where: { userId, startTime: { gte: from, lt: to } } });
  }
}
