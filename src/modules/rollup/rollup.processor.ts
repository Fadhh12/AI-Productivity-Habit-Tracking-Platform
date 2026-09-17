import { OnWorkerEvent, Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { RollupService } from './rollup.service';
import { NotificationService } from '../notification/notification.service';
import { StructuredLogger } from '../../shared/utils/structured-logger';

export interface RollupJobData {
  userId: string;
  month: string;
  /** Manual-testing-only flag to force a failure and exercise the retry/notification path. */
  simulateFailure?: boolean;
}

@Processor('rollup')
export class RollupProcessor extends WorkerHost {
  constructor(
    private readonly rollupService: RollupService,
    private readonly notificationService: NotificationService,
  ) {
    super();
  }

  async process(job: Job<RollupJobData>) {
    if (job.data.simulateFailure) {
      throw new Error(
        'Simulated rollup failure (requested via simulateFailure) to verify retry + notification behavior',
      );
    }
    return this.rollupService.computeAndCacheMonthly(job.data.userId, job.data.month);
  }

  /**
   * Fires after EVERY failed attempt. Only once attemptsMade reaches the
   * job's configured `attempts` do we treat it as exhausted: log a
   * structured error and send the user an in-app notification instead of
   * silently leaving a stale/missing report.
   */
  @OnWorkerEvent('failed')
  async onFailed(job: Job<RollupJobData>, error: Error) {
    const maxAttempts = job.opts.attempts ?? 1;
    StructuredLogger.error({
      message: `Rollup job attempt ${job.attemptsMade}/${maxAttempts} failed`,
      userId: job.data.userId,
      errorType: error.constructor?.name ?? 'Error',
      stack: error.stack,
      jobId: job.id,
      month: job.data.month,
      attemptsMade: job.attemptsMade,
      maxAttempts,
    });

    if (job.attemptsMade >= maxAttempts) {
      StructuredLogger.error({
        message: 'Rollup job exhausted all retry attempts — report is stale/missing',
        userId: job.data.userId,
        errorType: error.constructor?.name ?? 'Error',
        stack: error.stack,
        jobId: job.id,
        month: job.data.month,
      });

      await this.notificationService.notify(
        job.data.userId,
        'rollup_failed',
        `Laporan bulan ${job.data.month} belum terupdate, coba lagi.`,
      );
    }
  }
}
