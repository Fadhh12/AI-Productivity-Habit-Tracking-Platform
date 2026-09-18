import { Module } from '@nestjs/common';
import { HabitController } from './habit.controller';
import { HabitService } from './habit.service';
import { HabitRepository } from './habit.repository';
import { StreakEngineService } from './streak-engine.service';
import { HabitMidnightScheduler } from './habit-midnight.scheduler';
import { HabitReminderScheduler } from './habit-reminder.scheduler';
import { NotificationModule } from '../notification/notification.module';

@Module({
  imports: [NotificationModule],
  controllers: [HabitController],
  providers: [HabitService, HabitRepository, StreakEngineService, HabitMidnightScheduler, HabitReminderScheduler],
  exports: [HabitService],
})
export class HabitModule {}
