import { IsDateString, IsOptional } from 'class-validator';

export class QueryActivityDto {
  @IsOptional()
  @IsDateString({ strict: true }, { message: 'date must be in YYYY-MM-DD format' })
  date?: string;
}
