import { Module } from '@nestjs/common';
import { HabitController } from './habit.controller';
import { HabitService } from './habit.service';
import { HabitRepository } from './habit.repository';
import { StreakEngineService } from './streak-engine.service';
import { HabitMidnightScheduler } from './habit-midnight.scheduler';

@Module({
  controllers: [HabitController],
  providers: [HabitService, HabitRepository, StreakEngineService, HabitMidnightScheduler],
  exports: [HabitService],
})
export class HabitModule {}
