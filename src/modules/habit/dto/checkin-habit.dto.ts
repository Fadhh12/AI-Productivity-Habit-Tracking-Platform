import { IsOptional, IsString, MaxLength } from 'class-validator';

export class CheckinHabitDto {
  @IsOptional()
  @IsString()
  @MaxLength(500)
  note?: string;
}
