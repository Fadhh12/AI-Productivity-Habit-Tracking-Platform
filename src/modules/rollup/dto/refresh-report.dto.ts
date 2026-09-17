import { IsBoolean, IsOptional, Matches } from 'class-validator';

export class RefreshReportDto {
  @IsOptional()
  @Matches(/^\d{4}-(0[1-9]|1[0-2])$/, { message: 'month must be in YYYY-MM format' })
  month?: string;

  /** For manual verification of the retry + failure-notification path (never used in production flows). */
  @IsOptional()
  @IsBoolean()
  simulateFailure?: boolean;
}
