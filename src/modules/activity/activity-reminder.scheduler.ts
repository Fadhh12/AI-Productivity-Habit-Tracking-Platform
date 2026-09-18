import { Injectable } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { ActivityRepository } from './activity.repository';
import { NotificationService } from '../notification/notification.service';
import { StructuredLogger } from '../../shared/utils/structured-logger';

const REMINDER_WINDOW_MS = 45 * 60 * 1000;

/**
 * Runs every 15 minutes and sends one in-app reminder for every scheduled
 * activity starting within the next 45 minutes — including ones scheduled
 * far in advance, since this only looks at how close `startTime` is to
 * "now", not when the activity was created. The `refId` (the activity's own
 * id) makes this safe to re-run without double-notifying.
 */
@Injectable()
export class ActivityReminderScheduler {
  constructor(
    private readonly activityRepository: ActivityRepository,
    private readonly notificationService: NotificationService,
  ) {}

  @Cron('0 */15 * * * *')
  async run() {
    const now = new Date();
    const upcoming = await this.activityRepository.findStartingBetween(now, new Date(now.getTime() + REMINDER_WINDOW_MS));

    for (const activity of upcoming) {
      try {
        if (await this.notificationService.alreadySent(activity.userId, 'activity_reminder', activity.id)) continue;

        const minutesUntil = Math.max(1, Math.round((activity.startTime.getTime() - now.getTime()) / 60000));
        await this.notificationService.notify(
          activity.userId,
          'activity_reminder',
          `Jadwal "${activity.title}" dimulai sekitar ${minutesUntil} menit lagi.`,
          activity.id,
        );
      } catch (error) {
        StructuredLogger.error({
          message: 'Failed to send activity reminder',
          userId: activity.userId,
          errorType: (error as Error).constructor?.name ?? 'Error',
          stack: (error as Error).stack,
          activityId: activity.id,
        });
      }
    }
  }
}
