import { Injectable } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { InsightService } from './insight.service';

/** Every 30 minutes; the per-insight refId dedupe makes repeated ticks inside a window harmless. */
@Injectable()
export class InsightScheduler {
  constructor(private readonly insightService: InsightService) {}

  @Cron('0 */30 * * * *')
  async run() {
    await this.insightService.runForAllUsers();
  }
}
