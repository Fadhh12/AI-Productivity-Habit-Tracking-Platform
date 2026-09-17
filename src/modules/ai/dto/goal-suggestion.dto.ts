import { IsString, MaxLength, MinLength } from 'class-validator';

export class GoalSuggestionDto {
  @IsString()
  @MinLength(1)
  @MaxLength(150)
  yearlyGoalTitle!: string;
}
