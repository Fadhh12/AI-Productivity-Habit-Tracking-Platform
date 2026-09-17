import { IsIn } from 'class-validator';

export class DigestQueryDto {
  @IsIn(['weekly', 'monthly'])
  period!: 'weekly' | 'monthly';
}
