import { Injectable } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { ChallengeService } from './challenge.service';

/** Hourly: notifies users whose challenge target was reached while the app was closed. Completion is idempotent, so repeat ticks are harmless. */
@Injectable()
export class ChallengeScheduler {
  constructor(private readonly challengeService: ChallengeService) {}

  @Cron('0 15 * * * *')
  async run() {
    await this.challengeService.sweepOpenChallenges();
  }
}
