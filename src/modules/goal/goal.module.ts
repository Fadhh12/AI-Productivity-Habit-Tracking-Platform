import { Module } from '@nestjs/common';
import { GoalController } from './goal.controller';
import { GoalService } from './goal.service';
import { GoalRepository } from './goal.repository';

@Module({
  controllers: [GoalController],
  providers: [GoalService, GoalRepository],
  exports: [GoalService],
})
export class GoalModule {}
