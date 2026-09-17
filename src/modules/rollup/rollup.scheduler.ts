import { InjectQueue } from '@nestjs/bullmq';
import { Injectable } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { Queue } from 'bullmq';
import { RollupRepository } from './rollup.repository';
import { RollupJobData } from './rollup.processor';
import { DateUtil } from '../../shared/utils/date.util';

const JOB_OPTS = {
  attempts: 4,
  backoff: { type: 'exponential' as const, delay: 2000 },
  removeOnComplete: true,
  removeOnFail: false,
};

/**
 * Every 15 minutes, checks every user's local clock. Once a user has just
 * passed local midnight (00:00-00:14), enqueues a rollup job for the month
 * containing "yesterday" — this is the daily harian->bulanan aggregation job
 * described in the spec, approximated to 15-minute granularity per user
 * timezone instead of a single global midnight.
 */
@Injectable()
export class RollupScheduler {
  constructor(
    private readonly repository: RollupRepository,
    @InjectQueue('rollup') private readonly rollupQueue: Queue<RollupJobData>,
  ) {}

  @Cron('0 */15 * * * *')
  async run() {
    const users = await this.repository.findAllUsers();
    const now = new Date();

    for (const user of users) {
      const localHourMinute = this.localHourMinute(now, user.timezone);
      if (localHourMinute.hour !== 0 || localHourMinute.minute >= 15) continue;

      const todayLocal = DateUtil.localDateString(now, user.timezone);
      const yesterdayLocal = DateUtil.addDays(todayLocal, -1);
      const month = yesterdayLocal.slice(0, 7);

      await this.rollupQueue.add('monthly-rollup', { userId: user.id, month }, JOB_OPTS);
    }
  }

  private localHourMinute(date: Date, timezone: string): { hour: number; minute: number } {
    const parts = new Intl.DateTimeFormat('en-US', {
      timeZone: timezone,
      hour12: false,
      hour: '2-digit',
      minute: '2-digit',
    }).formatToParts(date);
    const hour = Number(parts.find((p) => p.type === 'hour')?.value ?? '0') % 24;
    const minute = Number(parts.find((p) => p.type === 'minute')?.value ?? '0');
    return { hour, minute };
  }
}
