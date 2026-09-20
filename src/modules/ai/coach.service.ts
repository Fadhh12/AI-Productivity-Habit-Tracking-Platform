import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { PrismaService } from '../../infra/db/prisma.service';
import { LlmClient } from './llm.client';
import { CircuitBreakerService } from './circuit-breaker.service';
import { AiRateLimiterService } from './ai-rate-limiter.service';
import { RollupService } from '../rollup/rollup.service';
import { HabitService } from '../habit/habit.service';
import { DateUtil } from '../../shared/utils/date.util';
import {
  buildCoachFallbackReply,
  buildCoachMessages,
  buildCoachSystemPrompt,
  CoachSnapshot,
  CoachTurn,
} from './coach-context.util';

@Injectable()
export class CoachService {
  constructor(
    private readonly llmClient: LlmClient,
    private readonly circuitBreaker: CircuitBreakerService,
    private readonly rateLimiter: AiRateLimiterService,
    private readonly rollupService: RollupService,
    private readonly habitService: HabitService,
    private readonly prisma: PrismaService,
  ) {}

  async chat(userId: string, message: string, history?: CoachTurn[]) {
    const rate = await this.rateLimiter.checkAndIncrement(userId);
    if (!rate.allowed) {
      throw new HttpException(
        {
          statusCode: HttpStatus.TOO_MANY_REQUESTS,
          message: `Daily AI request limit reached (${rate.limit}/day). Try again tomorrow.`,
        },
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }

    const snapshot = await this.buildSnapshot(userId);

    if (this.circuitBreaker.getState() !== 'open') {
      try {
        const reply = await this.llmClient.generateText(
          buildCoachSystemPrompt(snapshot),
          buildCoachMessages(history, message),
        );
        this.circuitBreaker.recordSuccess();
        return { reply, ai_available: true, fallback: false, is_ai_generated: true };
      } catch {
        this.circuitBreaker.recordFailure();
      }
    }

    return {
      reply: buildCoachFallbackReply(snapshot),
      ai_available: false,
      fallback: true,
      is_ai_generated: false,
    };
  }

  private async buildSnapshot(userId: string): Promise<CoachSnapshot> {
    const user = await this.prisma.user.findUniqueOrThrow({
      where: { id: userId },
      select: { timezone: true },
    });
    const weekAgo = new Date(Date.now() - 7 * 86400000);

    const [habits, week, activities] = await Promise.all([
      this.habitService.findAll(userId),
      this.rollupService.computeWeekly(userId),
      this.prisma.activityLog.findMany({
        where: { userId, startTime: { gte: weekAgo } },
        orderBy: { startTime: 'desc' },
        take: 15,
        include: { category: true },
      }),
    ]);

    return {
      today: DateUtil.localDateString(new Date(), user.timezone),
      timezone: user.timezone,
      habits: habits
        .filter((h) => h.active)
        .map((h) => ({ name: h.name, frequency: h.frequency, currentStreak: h.currentStreak })),
      weekCategoryMinutes: week.categoryDistributionMinutes,
      weekCheckinCounts: week.checkinStatusCounts,
      goalProgress: week.goalProgress.map((g) => ({
        goalTitle: g.goalTitle,
        doneCount: g.doneCount,
        habitCount: g.habitCount,
      })),
      recentActivities: activities.map((a) => ({
        title: a.title.slice(0, 80),
        category: a.category?.name ?? null,
        minutes: Math.round((a.endTime.getTime() - a.startTime.getTime()) / 60000),
        date: DateUtil.localDateString(a.startTime, user.timezone),
      })),
    };
  }
}
