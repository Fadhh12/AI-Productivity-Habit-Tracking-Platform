import { IsISO8601, IsOptional, IsString, IsUUID, MaxLength, MinLength } from 'class-validator';
import { IsAfter } from '../../../shared/validators/is-after.decorator';

export class CreateActivityDto {
  @IsString()
  @MinLength(1)
  @MaxLength(120)
  title!: string;

  @IsOptional()
  @IsUUID()
  categoryId?: string;

  @IsISO8601()
  startTime!: string;

  @IsISO8601()
  @IsAfter('startTime', { message: 'endTime must be after startTime' })
  endTime!: string;

  @IsOptional()
  @IsString()
  @MaxLength(1000)
  note?: string;
}
