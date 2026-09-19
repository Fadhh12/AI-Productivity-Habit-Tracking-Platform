import { Injectable } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { CalendarRepository } from './calendar.repository';
import { CalendarService } from './calendar.service';
import { StructuredLogger } from '../../shared/utils/structured-logger';

/** Auto-imports calendar events for every connected account, so users don't have to remember to press "Sync sekarang". Failures are per-user and non-fatal — one broken/revoked connection never blocks the rest. */
@Injectable()
export class CalendarSyncScheduler {
  constructor(
    private readonly repository: CalendarRepository,
    private readonly calendarService: CalendarService,
  ) {}

  @Cron(CronExpression.EVERY_HOUR)
  async run() {
    if (!this.calendarService.isConfigured()) return;

    const integrations = await this.repository.findAllConnected();
    for (const integration of integrations) {
      try {
        await this.calendarService.syncForUser(integration.userId);
      } catch (error) {
        StructuredLogger.error({
          message: 'Scheduled Google Calendar sync failed',
          userId: integration.userId,
          errorType: (error as Error).constructor?.name ?? 'Error',
          stack: (error as Error).stack,
        });
      }
    }
  }
}
