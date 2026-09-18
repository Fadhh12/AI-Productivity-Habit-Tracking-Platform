import { Module } from '@nestjs/common';
import { ActivityController } from './activity.controller';
import { ActivityService } from './activity.service';
import { ActivityRepository } from './activity.repository';
import { ActivityReminderScheduler } from './activity-reminder.scheduler';
import { IdempotencyService } from '../../shared/idempotency/idempotency.service';
import { NotificationModule } from '../notification/notification.module';

@Module({
  imports: [NotificationModule],
  controllers: [ActivityController],
  providers: [ActivityService, ActivityRepository, IdempotencyService, ActivityReminderScheduler],
  exports: [ActivityService],
})
export class ActivityModule {}
