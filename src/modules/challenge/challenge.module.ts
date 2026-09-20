import { Module } from '@nestjs/common';
import { AiModule } from '../ai/ai.module';
import { NotificationModule } from '../notification/notification.module';
import { ChallengeController } from './challenge.controller';
import { ChallengeRepository } from './challenge.repository';
import { ChallengeScheduler } from './challenge.scheduler';
import { ChallengeService } from './challenge.service';

@Module({
  imports: [AiModule, NotificationModule],
  controllers: [ChallengeController],
  providers: [ChallengeRepository, ChallengeService, ChallengeScheduler],
})
export class ChallengeModule {}
