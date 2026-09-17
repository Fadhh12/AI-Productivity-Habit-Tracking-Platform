import { Injectable } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { HabitRepository } from './habit.repository';
import { HabitService } from './habit.service';
import { DateUtil } from '../../shared/utils/date.util';
import { StructuredLogger } from '../../shared/utils/structured-logger';

/**
 * Runs every 15 minutes and, for every active habit, resolves any local day
 * that has fully elapsed (yesterday, in that habit owner's timezone) but has
 * no checkin recorded yet — marking it 'missed' or 'skipped_forgiven' per the
 * forgiveness rule. 15-minute granularity approximates "at local midnight"
 * without needing a separate per-timezone scheduler.
 */
@Injectable()
export class HabitMidnightScheduler {
  constructor(
    private readonly habitRepository: HabitRepository,
    private readonly habitService: HabitService,
  ) {}

  @Cron('0 */15 * * * *')
  async run() {
    const habits = await this.habitRepository.findAllActive();
    const now = new Date();

    for (const habit of habits) {
      try {
        const user = await this.habitRepository.findByIdWithUser(habit.id);
        if (!user) continue;
        const yesterday = DateUtil.addDays(DateUtil.localDateString(now, user.user.timezone), -1);
        await this.habitService.processMissedDaysUpTo(habit.id, yesterday);
      } catch (error) {
        StructuredLogger.error({
          message: 'Failed to process missed days for habit',
          userId: habit.userId,
          errorType: (error as Error).constructor?.name ?? 'Error',
          stack: (error as Error).stack,
          habitId: habit.id,
        });
      }
    }
  }
}
