import { IsBoolean, IsOptional, IsString, MaxLength, MinLength, ValidateIf } from 'class-validator';
import { MAX_AVATAR_CHARS, MAX_DISPLAY_NAME } from '../profile.util';

export class UpdateUserDto {
  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(100)
  timezone?: string;

  @IsOptional()
  @IsBoolean()
  proactiveInsights?: boolean;

  /** Empty string clears the name. */
  @IsOptional()
  @IsString()
  @MaxLength(MAX_DISPLAY_NAME * 2)
  displayName?: string;

  /** `null` removes the photo; a string must be a small image data URL (checked in the service). */
  @ValidateIf((_, value) => value !== undefined && value !== null)
  @IsString()
  @MaxLength(MAX_AVATAR_CHARS)
  avatar?: string | null;
}
