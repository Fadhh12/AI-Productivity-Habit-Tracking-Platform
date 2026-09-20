import { InjectQueue } from '@nestjs/bullmq';
import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  NotFoundException,
  Post,
  Query,
  Res,
  UseGuards,
} from '@nestjs/common';
import { Queue } from 'bullmq';
import { Response } from 'express';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser, CurrentUserPayload } from '../auth/decorators/current-user.decorator';
import { RollupService } from './rollup.service';
import { QueryMonthlyReportDto } from './dto/query-monthly-report.dto';
import { RefreshReportDto } from './dto/refresh-report.dto';
import { PlanService } from '../plan/plan.service';
import { ExportReportDto } from './dto/export-report.dto';
import { RollupJobData } from './rollup.processor';
import { buildReportCsv, buildReportPdf } from './report-export.util';

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
    private readonly planService: PlanService,
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

  @Get('monthly/export')
  async exportMonthly(
    @CurrentUser() user: CurrentUserPayload,
    @Query() query: ExportReportDto,
    @Res() res: Response,
  ) {
    if (query.format !== 'csv') await this.planService.requirePlus(user.id, 'pdf_export');
    const summary = await this.rollupService.getMonthlyFromCache(user.id, query.month);
    if (!summary) {
      throw new NotFoundException(
        'Laporan bulan ini belum tersedia. Trigger POST /api/reports/refresh dulu.',
      );
    }

    const filenameBase = `continuum-report-${query.month}`;
    if (query.format === 'csv') {
      const csv = buildReportCsv(summary);
      res.setHeader('Content-Type', 'text/csv; charset=utf-8');
      res.setHeader('Content-Disposition', `attachment; filename="${filenameBase}.csv"`);
      res.send(csv);
      return;
    }

    const pdf = await buildReportPdf(summary);
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${filenameBase}.pdf"`);
    res.send(pdf);
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
