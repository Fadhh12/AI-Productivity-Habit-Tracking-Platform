import { Injectable } from '@nestjs/common';
import { WeeklyChallenge } from '@prisma/client';
import { LlmClient } from '../ai/llm.client';
import { CircuitBreakerService } from '../ai/circuit-breaker.service';
import { PlanService } from '../plan/plan.service';
import { NotificationService } from '../notification/notification.service';
import { DateUtil } from '../../shared/utils/date.util';
import { StructuredLogger } from '../../shared/utils/structured-logger';
import { ChallengeRepository } from './challenge.repository';
import {
  buildChallengePrompt,
  ChallengeDraft,
  ChallengeMetric,
  computeProgress,
  fallbackChallenge,
  LastWeekStats,
  sanitizeDraft,
  weekStartOf,
} from './challenge-rules.util';

const HISTORY_LIMIT = 8;
const OPEN_LOOKBACK_MS = 8 * 24 * 60 * 60 * 1000;

export interface ChallengeView {
  id: string;
  weekStart: string;
  weekEnd: string;
  title: string;
  description: string;
  metric: ChallengeMetric;
  target: number;
  progress: number;
  percent: number;
  status: 'active' | 'completed' | 'missed';
  daysLeft: number;
  completedAt: string | null;
  is_ai_generated: boolean;
}

/**
 * One challenge per local week. The AI only proposes the wording and target;
 * bounds are enforced in code, and progress is always recomputed from real
 * checkins/activities rather than stored, so it cannot drift.
 */
@Injectable()
export class ChallengeService {
  constructor(
    private readonly repository: ChallengeRepository,
    private readonly notificationService: NotificationService,
    private readonly llmClient: LlmClient,
    private readonly circuitBreaker: CircuitBreakerService,
    private readonly planService: PlanService,
  ) {}

  /** This week's challenge (created on first request of the week), with live progress; completes and notifies once the target is reached. */
  async getCurrent(userId: string, now: Date = new Date()): Promise<ChallengeView> {
    const timezone = await this.repository.getTimezone(userId);
    const today = DateUtil.localDateString(now, timezone);
    const weekStart = weekStartOf(today);

    const challenge = (await this.repository.findByWeek(userId, weekStart)) ?? (await this.generate(userId, timezone, weekStart));
    return this.evaluate(challenge, timezone, today);
  }

  /** Past weeks, newest first, with their final result. */
  async history(userId: string, now: Date = new Date()): Promise<ChallengeView[]> {
    const timezone = await this.repository.getTimezone(userId);
    const today = DateUtil.localDateString(now, timezone);
    const rows = await this.repository.findBefore(userId, weekStartOf(today), HISTORY_LIMIT);
    return Promise.all(rows.map((row) => this.evaluate(row, timezone, today)));
  }

  /** Scheduler sweep: completes challenges the user reached while the app was closed, so the notification arrives on time. */
  async sweepOpenChallenges(now: Date = new Date()) {
    const open = await this.repository.findOpenRecent(new Date(now.getTime() - OPEN_LOOKBACK_MS));
    for (const challenge of open) {
      try {
        const timezone = await this.repository.getTimezone(challenge.userId);
        const today = DateUtil.localDateString(now, timezone);
        if (challenge.weekStart !== weekStartOf(today)) continue;
        await this.evaluate(challenge, timezone, today);
      } catch (error) {
        StructuredLogger.error({
          message: 'Failed to evaluate weekly challenge',
          userId: challenge.userId,
          errorType: (error as Error).constructor?.name ?? 'Error',
          stack: (error as Error).stack,
        });
      }
    }
  }

  private async evaluate(challenge: WeeklyChallenge, timezone: string, today: string): Promise<ChallengeView> {
    const metric = challenge.metric as ChallengeMetric;
    const counts = await this.repository.countsForWeek(challenge.userId, timezone, challenge.weekStart);
    const progress = computeProgress(metric, counts);
    const weekEnd = DateUtil.addDays(challenge.weekStart, 6);
    const isCurrentWeek = today <= weekEnd;

    let completedAt = challenge.completedAt;
    if (!completedAt && progress >= challenge.target && isCurrentWeek) {
      completedAt = new Date();
      if (await this.repository.markCompleted(challenge.id)) {
        await this.notificationService.notify(
          challenge.userId,
          'challenge_complete',
          `Tantangan minggu ini selesai: "${challenge.title}". Kerja bagus, kamu konsisten!`,
          `challenge:${challenge.id}`,
        );
      }
    }

    return {
      id: challenge.id,
      weekStart: challenge.weekStart,
      weekEnd,
      title: challenge.title,
      description: challenge.description,
      metric,
      target: challenge.target,
      progress,
      percent: Math.min(100, Math.round((progress / challenge.target) * 100)),
      status: completedAt ? 'completed' : isCurrentWeek ? 'active' : 'missed',
      daysLeft: isCurrentWeek ? DateUtil.daysBetween(today, weekEnd) + 1 : 0,
      completedAt: completedAt ? completedAt.toISOString() : null,
      is_ai_generated: challenge.isAiGenerated,
    };
  }

  private async generate(userId: string, timezone: string, weekStart: string): Promise<WeeklyChallenge> {
    const lastWeekStart = DateUtil.addDays(weekStart, -7);
    const [counts, activeHabits] = await Promise.all([
      this.repository.countsForWeek(userId, timezone, lastWeekStart),
      this.repository.countActiveHabits(userId),
    ]);
    const stats: LastWeekStats = { ...counts, activeHabits };

    let draft: ChallengeDraft | null = null;
    // Personalised AI challenges are Plus; free users get the deterministic template.
    const aiAllowed = await this.planService.isPlus(userId);
    if (aiAllowed && this.llmClient.isConfigured() && this.circuitBreaker.getState() !== 'open') {
      try {
        const { system, user } = buildChallengePrompt(stats);
        draft = sanitizeDraft(await this.llmClient.generateJson<unknown>(system, user));
        // A check-in goal is meaningless (and unreachable) for someone with no active habit.
        if (draft?.metric === 'checkins' && activeHabits === 0) draft = null;
        this.circuitBreaker.recordSuccess();
      } catch {
        this.circuitBreaker.recordFailure();
      }
    }

    try {
      return await this.repository.create(userId, weekStart, draft ?? fallbackChallenge(stats), draft !== null);
    } catch (error) {
      // Two requests raced to create this week's challenge; the unique index kept one — use it.
      const existing = await this.repository.findByWeek(userId, weekStart);
      if (existing) return existing;
      throw error;
    }
  }
}
