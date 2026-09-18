import { Injectable } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { HabitRepository } from './habit.repository';
import { NotificationService } from '../notification/notification.service';
import { DateUtil } from '../../shared/utils/date.util';
import { StructuredLogger } from '../../shared/utils/structured-logger';

const REMINDER_LOCAL_HOUR = 19; // 7pm in the habit owner's own timezone

function localHour(date: Date, timezone: string): number {
  const formatted = new Intl.DateTimeFormat('en-US', { timeZone: timezone, hour: '2-digit', hour12: false }).format(date);
  const hour = Number(formatted);
  return hour === 24 ? 0 : hour;
}

/**
 * Runs every 15 minutes. For each active habit not yet checked in "today"
 * (in the owner's local time) and past their local 19:00, sends one
 * in-app reminder notification for that day — never more than one, thanks
 * to the `refId` dedupe key ("<habitId>:<localDate>").
 */
@Injectable()
export class HabitReminderScheduler {
  constructor(
    private readonly habitRepository: HabitRepository,
    private readonly notificationService: NotificationService,
  ) {}

  @Cron('0 */15 * * * *')
  async run() {
    const habits = await this.habitRepository.findAllActive();
    const now = new Date();

    for (const habit of habits) {
      try {
        const withUser = await this.habitRepository.findByIdWithUser(habit.id);
        if (!withUser) continue;
        const timezone = withUser.user.timezone;

        if (localHour(now, timezone) < REMINDER_LOCAL_HOUR) continue;

        const todayStr = DateUtil.localDateString(now, timezone);
        const existingCheckin = await this.habitRepository.findCheckinByDate(habit.id, todayStr);
        if (existingCheckin?.status === 'done') continue;

        const refId = `${habit.id}:${todayStr}`;
        if (await this.notificationService.alreadySent(habit.userId, 'habit_reminder', refId)) continue;

        await this.notificationService.notify(
          habit.userId,
          'habit_reminder',
          `Belum check-in "${habit.name}" hari ini. Masih ada waktu sebelum tidur — jangan sampai kelewatan!`,
          refId,
        );
      } catch (error) {
        StructuredLogger.error({
          message: 'Failed to send habit reminder',
          userId: habit.userId,
          errorType: (error as Error).constructor?.name ?? 'Error',
          stack: (error as Error).stack,
          habitId: habit.id,
        });
      }
    }
  }
}
