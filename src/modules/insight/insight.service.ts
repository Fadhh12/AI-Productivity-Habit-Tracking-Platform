import { Injectable } from '@nestjs/common';
import { LlmClient } from '../ai/llm.client';
import { CircuitBreakerService } from '../ai/circuit-breaker.service';
import { NotificationService } from '../notification/notification.service';
import { PlanService } from '../plan/plan.service';
import { RollupService } from '../rollup/rollup.service';
import { DateUtil } from '../../shared/utils/date.util';
import { StructuredLogger } from '../../shared/utils/structured-logger';
import { InsightRepository } from './insight.repository';
import {
  buildInsightPrompt,
  comebackFallback,
  daysBetween,
  findWeakestWeekday,
  InsightKind,
  isComebackDue,
  isPatternWindow,
  isWeeklyWinWindow,
  localMoment,
  LocalMoment,
  patternFallback,
  weeklyWinFallback,
} from './insight-rules.util';

const MAX_MESSAGE_CHARS = 280;

/**
 * Proactive coaching: instead of waiting for the user to open a report, decide
 * (with cheap, deterministic rules) when something is worth saying, and only
 * then ask the AI to phrase it. Every insight is de-duplicated by a refId, so
 * the 30-minute scheduler tick can never send the same one twice.
 */
@Injectable()
export class InsightService {
  constructor(
    private readonly repository: InsightRepository,
    private readonly notificationService: NotificationService,
    private readonly rollupService: RollupService,
    private readonly llmClient: LlmClient,
    private readonly circuitBreaker: CircuitBreakerService,
    private readonly planService: PlanService,
  ) {}

  async runForAllUsers(now: Date = new Date()) {
    const users = await this.repository.findOptedInUsers();
    for (const user of users) {
      try {
        await this.runForUser(user.id, user.timezone, now);
      } catch (error) {
        StructuredLogger.error({
          message: 'Failed to evaluate proactive insights',
          userId: user.id,
          errorType: (error as Error).constructor?.name ?? 'Error',
          stack: (error as Error).stack,
        });
      }
    }
  }

  async runForUser(userId: string, timezone: string, now: Date = new Date()) {
    const m = localMoment(now, timezone);
    if (isWeeklyWinWindow(m)) await this.weeklyWin(userId, timezone, m);
    // The weekly summary is free; comeback nudges and pattern analysis are Plus.
    if (!(await this.planService.isPlus(userId))) return;
    if (m.hour >= 10 && m.hour <= 20) await this.comeback(userId, timezone, m);
    if (isPatternWindow(m)) await this.pattern(userId, m);
  }

  private async weeklyWin(userId: string, timezone: string, m: LocalMoment) {
    const refId = `weekly:${m.date}`;
    if (await this.alreadySent(userId, 'weekly_win', refId)) return;

    const utc = (d: string) => new Date(`${d}T00:00:00.000Z`);
    const weekStart = DateUtil.addDays(m.date, -7);
    const prevStart = DateUtil.addDays(m.date, -14);

    const [week, prev, activities] = await Promise.all([
      this.rollupService.computeForRange(userId, utc(weekStart), utc(m.date)),
      this.rollupService.computeForRange(userId, utc(prevStart), utc(weekStart)),
      this.repository.countActivities(userId, utc(weekStart), utc(m.date)),
    ]);

    const done = week.checkinStatusCounts.done ?? 0;
    if (done === 0 && activities === 0) return;

    const topCategory =
      Object.entries(week.categoryDistributionMinutes)
        .filter(([name]) => name !== 'Uncategorized')
        .sort((a, b) => b[1] - a[1])[0]?.[0] ?? null;
    const summary = { done, prevDone: prev.checkinStatusCounts.done ?? 0, activities, topCategory };
    const facts = {
      habitCheckinSelesaiMingguLalu: summary.done,
      habitCheckinSelesaiMingguSebelumnya: summary.prevDone,
      aktivitasTercatatMingguLalu: summary.activities,
      ...(topCategory ? { kategoriWaktuTerbanyak: topCategory } : {}),
    };
    await this.send(userId, 'weekly_win', refId, facts, weeklyWinFallback(summary));
  }

  private async comeback(userId: string, timezone: string, m: LocalMoment) {
    const last = await this.repository.lastActivityDate(userId, timezone);
    if (!isComebackDue(m, last)) return;

    const refId = `comeback:${last}`;
    if (await this.alreadySent(userId, 'comeback', refId)) return;

    const days = daysBetween(last!, m.date);
    await this.send(userId, 'comeback', refId, { daysSinceLastActivity: days }, comebackFallback(days));
  }

  private async pattern(userId: string, m: LocalMoment) {
    const refId = `pattern:${m.date}`;
    if (await this.alreadySent(userId, 'pattern', refId)) return;

    const rows = await this.repository.checkinRows(userId, DateUtil.addDays(m.date, -28), m.date);
    const weakest = findWeakestWeekday(rows);
    if (!weakest) return;

    const facts = {
      weakestWeekday: weakest.name,
      completionRatePercent: Math.round(weakest.rate * 100),
      overallRatePercent: Math.round(weakest.overall * 100),
    };
    await this.send(userId, 'pattern', refId, facts, patternFallback(weakest));
  }

  private async alreadySent(userId: string, kind: InsightKind, refId: string): Promise<boolean> {
    return this.notificationService.alreadySentAny(userId, [`insight_${kind}`, `ai_insight_${kind}`], refId);
  }

  /** AI-phrased when the provider is healthy; otherwise the deterministic template. The type prefix records which one it was so the UI can label it. */
  private async send(userId: string, kind: InsightKind, refId: string, facts: object, fallback: string) {
    let message = fallback;
    let aiGenerated = false;

    if (this.llmClient.isConfigured() && this.circuitBreaker.getState() !== 'open') {
      try {
        const { system, user } = buildInsightPrompt(kind, facts);
        const text = await this.llmClient.generateText(system, [{ role: 'user', content: user }]);
        this.circuitBreaker.recordSuccess();
        message = text.replace(/\s+/g, ' ').trim().slice(0, MAX_MESSAGE_CHARS);
        aiGenerated = true;
      } catch {
        this.circuitBreaker.recordFailure();
      }
    }

    await this.notificationService.notify(userId, `${aiGenerated ? 'ai_' : ''}insight_${kind}`, message, refId);
  }
}
