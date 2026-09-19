import { IsOptional, IsString, MaxLength } from 'class-validator';

export class SaveReflectionDto {
  @IsOptional()
  @IsString()
  @MaxLength(500)
  responseText?: string | null;
}
