import { IsIn, Matches } from 'class-validator';

export class ExportReportDto {
  @Matches(/^\d{4}-(0[1-9]|1[0-2])$/, { message: 'month must be in YYYY-MM format' })
  month!: string;

  @IsIn(['csv', 'pdf'], { message: 'format must be csv or pdf' })
  format!: 'csv' | 'pdf';
}
