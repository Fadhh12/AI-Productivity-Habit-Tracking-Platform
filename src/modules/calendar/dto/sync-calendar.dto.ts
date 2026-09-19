import { IsISO8601, IsOptional } from 'class-validator';

export class SyncCalendarDto {
  @IsOptional()
  @IsISO8601()
  from?: string;

  @IsOptional()
  @IsISO8601()
  to?: string;
}
