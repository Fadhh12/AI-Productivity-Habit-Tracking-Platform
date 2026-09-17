import { Module } from '@nestjs/common';
import { ActivityController } from './activity.controller';
import { ActivityService } from './activity.service';
import { ActivityRepository } from './activity.repository';
import { IdempotencyService } from '../../shared/idempotency/idempotency.service';

@Module({
  controllers: [ActivityController],
  providers: [ActivityService, ActivityRepository, IdempotencyService],
  exports: [ActivityService],
})
export class ActivityModule {}
