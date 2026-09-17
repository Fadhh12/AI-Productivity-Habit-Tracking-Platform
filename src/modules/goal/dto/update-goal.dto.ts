import { PartialType } from '@nestjs/mapped-types';
import { IsIn, IsOptional } from 'class-validator';
import { CreateGoalDto } from './create-goal.dto';

export const GOAL_STATUSES = ['active', 'completed', 'archived'] as const;

export class UpdateGoalDto extends PartialType(CreateGoalDto) {
  @IsOptional()
  @IsIn(GOAL_STATUSES)
  status?: (typeof GOAL_STATUSES)[number];
}
