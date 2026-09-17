import { BullModule } from '@nestjs/bullmq';
import { Module } from '@nestjs/common';
import { RollupController } from './rollup.controller';
import { RollupService } from './rollup.service';
import { RollupRepository } from './rollup.repository';
import { RollupProcessor } from './rollup.processor';
import { RollupScheduler } from './rollup.scheduler';
import { NotificationModule } from '../notification/notification.module';

@Module({
  imports: [BullModule.registerQueue({ name: 'rollup' }), NotificationModule],
  controllers: [RollupController],
  providers: [RollupService, RollupRepository, RollupProcessor, RollupScheduler],
  exports: [RollupService],
})
export class RollupModule {}
