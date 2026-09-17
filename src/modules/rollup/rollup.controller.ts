import { InjectQueue } from '@nestjs/bullmq';
import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { Queue } from 'bullmq';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser, CurrentUserPayload } from '../auth/decorators/current-user.decorator';
import { RollupService } from './rollup.service';
import { QueryMonthlyReportDto } from './dto/query-monthly-report.dto';
import { RefreshReportDto } from './dto/refresh-report.dto';
import { RollupJobData } from './rollup.processor';

/** 3 retries after the initial attempt, exponential backoff starting at 2s (2s, 4s, 8s). */
const JOB_OPTS = {
  attempts: 4,
  backoff: { type: 'exponential', delay: 2000 },
  removeOnComplete: true,
  removeOnFail: false,
} as const;

function currentMonth(): string {
  return new Date().toISOString().slice(0, 7);
}

@Controller('api/reports')
@UseGuards(JwtAuthGuard)
export class RollupController {
  constructor(
    private readonly rollupService: RollupService,
    @InjectQueue('rollup') private readonly rollupQueue: Queue<RollupJobData>,
  ) {}

  @Get('monthly')
  async getMonthly(@CurrentUser() user: CurrentUserPayload, @Query() query: QueryMonthlyReportDto) {
    const cached = await this.rollupService.getMonthlyFromCache(user.id, query.month);
    if (!cached) {
      return {
        available: false,
        message:
          'Laporan bulan ini belum terupdate, coba lagi. Trigger POST /api/reports/refresh untuk membuatnya.',
      };
    }
    return { available: true, data: cached };
  }

  @Post('refresh')
  @HttpCode(HttpStatus.ACCEPTED)
  async refresh(@CurrentUser() user: CurrentUserPayload, @Body() dto: RefreshReportDto) {
    const month = dto.month ?? currentMonth();
    const job = await this.rollupQueue.add(
      'monthly-rollup',
      { userId: user.id, month, simulateFailure: dto.simulateFailure },
      JOB_OPTS,
    );
    return { queued: true, jobId: job.id, month };
  }
}
