import {
  IsDateString,
  IsIn,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  MinLength,
} from 'class-validator';

export const GOAL_HORIZONS = ['yearly', 'monthly'] as const;
export type GoalHorizonValue = (typeof GOAL_HORIZONS)[number];

export class CreateGoalDto {
  @IsString()
  @MinLength(1)
  @MaxLength(150)
  title!: string;

  @IsIn(GOAL_HORIZONS)
  horizon!: GoalHorizonValue;

  @IsOptional()
  @IsUUID()
  parentGoalId?: string;

  @IsOptional()
  @IsDateString({ strict: true })
  targetDate?: string;
}
