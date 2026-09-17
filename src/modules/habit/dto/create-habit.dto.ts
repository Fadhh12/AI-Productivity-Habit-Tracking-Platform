import {
  IsBoolean,
  IsIn,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  MinLength,
} from 'class-validator';

export const HABIT_FREQUENCIES = ['daily', 'specific_days', 'weekly_count'] as const;
export type HabitFrequency = (typeof HABIT_FREQUENCIES)[number];

export class CreateHabitDto {
  @IsString()
  @MinLength(1)
  @MaxLength(80)
  name!: string;

  @IsIn(HABIT_FREQUENCIES)
  frequency!: HabitFrequency;

  @IsOptional()
  @IsUUID()
  goalId?: string;

  /** When the user has hit the 5-active-habit soft limit and explicitly wants to add one more anyway. */
  @IsOptional()
  @IsBoolean()
  force?: boolean;
}
