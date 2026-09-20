import { Module } from '@nestjs/common';
import { AiModule } from '../ai/ai.module';
import { NotificationModule } from '../notification/notification.module';
import { RollupModule } from '../rollup/rollup.module';
import { InsightRepository } from './insight.repository';
import { InsightService } from './insight.service';
import { InsightScheduler } from './insight.scheduler';

@Module({
  imports: [AiModule, NotificationModule, RollupModule],
  providers: [InsightRepository, InsightService, InsightScheduler],
  exports: [InsightService],
})
export class InsightModule {}
