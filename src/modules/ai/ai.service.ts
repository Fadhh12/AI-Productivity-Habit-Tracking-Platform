import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { PrismaService } from '../../infra/db/prisma.service';
import { ClaudeClient } from './claude.client';
import { CircuitBreakerService } from './circuit-breaker.service';
import { AiRateLimiterService } from './ai-rate-limiter.service';
import { RollupService } from '../rollup/rollup.service';
import { HabitService } from '../habit/habit.service';
import { ActivityService } from '../activity/activity.service';
import { DateUtil } from '../../shared/utils/date.util';

const REFLECTION_FALLBACK_QUESTIONS = [
  'Momen apa hari ini yang paling berkesan buat kamu?',
  'Apa satu hal kecil hari ini yang bikin kamu bangga?',
  'Ada tantangan apa hari ini, dan gimana kamu menghadapinya?',
  'Kalau boleh mengulang satu bagian hari ini, apa yang mau kamu ubah?',
  'Apa yang bikin kamu bersyukur hari ini?',
];

export interface QuickAddDraft {
  title: string;
  category_guess: string | null;
  start_time: string;
  end_time: string;
}

export interface AiEnvelope {
  ai_available: boolean;
  fallback: boolean;
  is_ai_generated: boolean;
}

interface PatternStats {
  hasEnoughData: boolean;
  weekdayCompletion: Array<{ day: string; rate: number; total: number }>;
  mostMissedHabit: { name: string; count: number } | null;
  categoryShift: { name: string; deltaPct: number } | null;
}

const WEEKDAY_LABELS = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];

@Injectable()
export class AiService {
  constructor(
    private readonly claudeClient: ClaudeClient,
    private readonly circuitBreaker: CircuitBreakerService,
    private readonly rateLimiter: AiRateLimiterService,
    private readonly rollupService: RollupService,
    private readonly habitService: HabitService,
    private readonly activityService: ActivityService,
    private readonly prisma: PrismaService,
  ) {}

  private async guardRateLimitAndCircuit(userId: string): Promise<{ circuitOpen: boolean }> {
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
    return { circuitOpen: this.circuitBreaker.getState() === 'open' };
  }

  async quickAdd(userId: string, text: string): Promise<QuickAddDraft & AiEnvelope> {
    const { circuitOpen } = await this.guardRateLimitAndCircuit(userId);
    if (!circuitOpen) {
      try {
        const draft = await this.claudeClient.generateJson<QuickAddDraft>(
          'You convert a short natural-language activity description into a structured draft activity log. ' +
            'Infer a concise title, guess a category label (or null if unclear), and infer start_time/end_time as ISO 8601 UTC timestamps ' +
            '(assume "today" and reasonable durations, e.g. 30-60 minutes, when not stated). ' +
            'Reply with exactly: {"title": string, "category_guess": string|null, "start_time": ISO string, "end_time": ISO string}',
          text,
        );
        this.circuitBreaker.recordSuccess();
        return { ...draft, ai_available: true, fallback: false, is_ai_generated: true };
      } catch {
        this.circuitBreaker.recordFailure();
      }
    }

    return {
      ...this.naiveQuickAddFallback(text),
      ai_available: false,
      fallback: true,
      is_ai_generated: false,
    };
  }

  private naiveQuickAddFallback(text: string): QuickAddDraft {
    const now = new Date();
    const end = new Date(now.getTime() + 30 * 60000);
    return {
      title: text.slice(0, 120),
      category_guess: null,
      start_time: now.toISOString(),
      end_time: end.toISOString(),
    };
  }

  async digest(userId: string, period: 'weekly' | 'monthly') {
    const { circuitOpen } = await this.guardRateLimitAndCircuit(userId);

    const rollupData =
      period === 'monthly'
        ? ((await this.rollupService.getMonthlyFromCache(
            userId,
            new Date().toISOString().slice(0, 7),
          )) ??
          (await this.rollupService.computeAndCacheMonthly(
            userId,
            new Date().toISOString().slice(0, 7),
          )))
        : await this.rollupService.computeWeekly(userId);

    if (!circuitOpen) {
      try {
        const generated = await this.claudeClient.generateJson<{
          narrative: string;
          highlights: string[];
        }>(
          "You write a short, encouraging narrative digest (2-4 sentences, in Indonesian) summarizing a user's " +
            'productivity rollup data, plus 2-4 short highlight bullet points. Be specific about numbers given. ' +
            'Reply with exactly: {"narrative": string, "highlights": string[]}',
          JSON.stringify(rollupData),
        );
        this.circuitBreaker.recordSuccess();

        await this.prisma.aiInsight.create({
          data: {
            userId,
            type: 'digest',
            period,
            content: { ...generated, sourceData: rollupData } as object,
          },
        });

        return {
          period,
          narrative: generated.narrative,
          highlights: generated.highlights,
          ai_available: true,
          fallback: false,
          is_ai_generated: true,
        };
      } catch {
        this.circuitBreaker.recordFailure();
      }
    }

    return {
      period,
      ...this.naiveDigestFallback(rollupData),
      ai_available: false,
      fallback: true,
      is_ai_generated: false,
    };
  }

  private naiveDigestFallback(rollupData: {
    categoryDistributionMinutes: Record<string, number>;
    checkinStatusCounts: Record<string, number>;
  }) {
    const topCategory = Object.entries(rollupData.categoryDistributionMinutes).sort(
      (a, b) => b[1] - a[1],
    )[0];
    const narrative = topCategory
      ? `Kategori tersibuk: ${topCategory[0]} (${Math.round(topCategory[1])} menit). Habit selesai: ${
          rollupData.checkinStatusCounts.done ?? 0
        }, terlewat: ${rollupData.checkinStatusCounts.missed ?? 0}.`
      : 'Belum ada cukup data untuk membuat ringkasan periode ini.';
    return {
      narrative,
      highlights: [
        `Total kategori tercatat: ${Object.keys(rollupData.categoryDistributionMinutes).length}`,
        `Checkin selesai: ${rollupData.checkinStatusCounts.done ?? 0}`,
      ],
    };
  }

  async goalSuggestion(userId: string, yearlyGoalTitle: string) {
    const { circuitOpen } = await this.guardRateLimitAndCircuit(userId);
    const existingHabits = await this.habitService.findAll(userId);
    const historyContext = existingHabits.length
      ? `User's existing habits: ${existingHabits.map((h) => h.name).join(', ')}.`
      : 'User is new and has no habit history yet.';

    if (!circuitOpen) {
      try {
        const generated = await this.claudeClient.generateJson<{
          monthlyGoals: Array<{
            title: string;
            habits: Array<{ name: string; frequency: string }>;
          }>;
        }>(
          'You break a yearly goal down into a realistic sequence of monthly goals, each with 1-3 daily/weekly habits ' +
            '(frequency one of "daily", "specific_days", "weekly_count") that would help achieve it. Keep it achievable ' +
            '(anti-burnout: max 5 habits total across all months). ' +
            'Reply with exactly: {"monthlyGoals": [{"title": string, "habits": [{"name": string, "frequency": string}]}]}',
          `Yearly goal: "${yearlyGoalTitle}". ${historyContext}`,
        );
        this.circuitBreaker.recordSuccess();
        return { ...generated, ai_available: true, fallback: false, is_ai_generated: true };
      } catch {
        this.circuitBreaker.recordFailure();
      }
    }

    return {
      ...this.naiveGoalSuggestionFallback(yearlyGoalTitle),
      ai_available: false,
      fallback: true,
      is_ai_generated: false,
    };
  }

  private naiveGoalSuggestionFallback(yearlyGoalTitle: string) {
    return {
      monthlyGoals: [
        {
          title: `Bulan 1: mulai langkah kecil menuju "${yearlyGoalTitle}"`,
          habits: [{ name: 'Sisihkan 20 menit setiap hari', frequency: 'daily' }],
        },
        {
          title: `Bulan 2: tingkatkan konsistensi`,
          habits: [{ name: 'Evaluasi progres mingguan', frequency: 'weekly_count' }],
        },
        { title: `Bulan 3: evaluasi dan sesuaikan target`, habits: [] },
      ],
    };
  }

  private async todayLocalDate(userId: string): Promise<string> {
    const user = await this.prisma.user.findUniqueOrThrow({
      where: { id: userId },
      select: { timezone: true },
    });
    return DateUtil.localDateString(new Date(), user.timezone);
  }

  private toReflectionResponse(row: {
    localDate: string;
    prompt: string;
    responseText: string | null;
    isAiGenerated: boolean;
  }) {
    return {
      date: row.localDate,
      prompt: row.prompt,
      responseText: row.responseText,
      ai_available: row.isAiGenerated,
      fallback: !row.isAiGenerated,
      is_ai_generated: row.isAiGenerated,
    };
  }

  private naiveReflectionFallback(localDate: string): string {
    const idx =
      localDate.split('-').reduce((sum, part) => sum + Number(part), 0) %
      REFLECTION_FALLBACK_QUESTIONS.length;
    return REFLECTION_FALLBACK_QUESTIONS[idx];
  }

  private async buildReflectionContext(userId: string, localDate: string): Promise<string> {
    const [activities, habits] = await Promise.all([
      this.activityService.findAll(userId, localDate),
      this.habitService.findAll(userId),
    ]);

    const activityPart = activities.length
      ? `Aktivitas hari ini: ${activities.map((a) => a.title).join(', ')}.`
      : 'Belum ada aktivitas tercatat hari ini.';

    const activeHabits = habits.filter((h) => h.active);
    const doneToday = activeHabits.filter((h) =>
      h.checkins.some((c) => c.status === 'done' && c.checkinDate.toISOString().slice(0, 10) === localDate),
    ).length;
    const habitPart = activeHabits.length
      ? `Habit selesai hari ini: ${doneToday}/${activeHabits.length} (${activeHabits
          .map((h) => h.name)
          .join(', ')}).`
      : 'User belum punya habit aktif.';

    return `${activityPart} ${habitPart}`;
  }

  /** Returns today's reflection question (generating + persisting it once per local day), or the cached one if already generated. */
  async getTodayReflection(userId: string) {
    const localDate = await this.todayLocalDate(userId);

    const existing = await this.prisma.dailyReflection.findUnique({
      where: { userId_localDate: { userId, localDate } },
    });
    if (existing) return this.toReflectionResponse(existing);

    const { circuitOpen } = await this.guardRateLimitAndCircuit(userId);

    let prompt: string | undefined;
    let isAiGenerated = false;
    if (!circuitOpen) {
      try {
        const context = await this.buildReflectionContext(userId, localDate);
        const generated = await this.claudeClient.generateJson<{ question: string }>(
          'You write exactly ONE short, warm, specific reflection question in Indonesian (max 25 words) based on ' +
            "what the user did today. Avoid generic templates like \"Bagaimana harimu?\" - reference something " +
            'concrete from the context when possible. Reply with exactly: {"question": string}',
          context,
        );
        prompt = generated.question;
        isAiGenerated = true;
        this.circuitBreaker.recordSuccess();
      } catch {
        this.circuitBreaker.recordFailure();
      }
    }
    if (!prompt) prompt = this.naiveReflectionFallback(localDate);

    const created = await this.prisma.dailyReflection.create({
      data: { userId, localDate, prompt, isAiGenerated },
    });
    return this.toReflectionResponse(created);
  }

  /** Saves the user's 1-sentence answer to today's reflection, generating the prompt first if it doesn't exist yet. */
  async saveReflectionResponse(userId: string, responseText: string | null) {
    await this.getTodayReflection(userId);
    const localDate = await this.todayLocalDate(userId);
    const updated = await this.prisma.dailyReflection.update({
      where: { userId_localDate: { userId, localDate } },
      data: { responseText },
    });
    return this.toReflectionResponse(updated);
  }

  private async buildPatternStats(userId: string): Promise<PatternStats> {
    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 86400000);

    const checkins = await this.prisma.habitCheckin.findMany({
      where: { habit: { userId }, checkinDate: { gte: thirtyDaysAgo } },
      select: { checkinDate: true, status: true, habit: { select: { name: true } } },
    });

    const byWeekday = new Map<number, { done: number; total: number }>();
    const missedByHabit = new Map<string, number>();

    for (const c of checkins) {
      const day = c.checkinDate.getUTCDay();
      const entry = byWeekday.get(day) ?? { done: 0, total: 0 };
      entry.total += 1;
      if (c.status === 'done') entry.done += 1;
      byWeekday.set(day, entry);

      if (c.status !== 'done') {
        missedByHabit.set(c.habit.name, (missedByHabit.get(c.habit.name) ?? 0) + 1);
      }
    }

    const weekdayCompletion = Array.from(byWeekday.entries())
      .map(([day, { done, total }]) => ({ day: WEEKDAY_LABELS[day], rate: Math.round((done / total) * 100), total }))
      .filter((w) => w.total >= 2)
      .sort((a, b) => a.rate - b.rate);

    let mostMissedHabit: { name: string; count: number } | null = null;
    for (const [name, count] of missedByHabit) {
      if (!mostMissedHabit || count > mostMissedHabit.count) mostMissedHabit = { name, count };
    }

    const thisWeekFrom = new Date(now.getTime() - 7 * 86400000);
    const lastWeekFrom = new Date(thisWeekFrom.getTime() - 7 * 86400000);
    const [thisWeek, lastWeek] = await Promise.all([
      this.rollupService.computeForRange(userId, thisWeekFrom, now),
      this.rollupService.computeForRange(userId, lastWeekFrom, thisWeekFrom),
    ]);

    let categoryShift: { name: string; deltaPct: number } | null = null;
    for (const [name, minutes] of Object.entries(thisWeek.categoryDistributionMinutes)) {
      const prevMinutes = lastWeek.categoryDistributionMinutes[name] ?? 0;
      if (prevMinutes < 15) continue;
      const deltaPct = Math.round(((minutes - prevMinutes) / prevMinutes) * 100);
      if (!categoryShift || Math.abs(deltaPct) > Math.abs(categoryShift.deltaPct)) {
        categoryShift = { name, deltaPct };
      }
    }

    return {
      hasEnoughData: checkins.length >= 5,
      weekdayCompletion,
      mostMissedHabit,
      categoryShift,
    };
  }

  private naivePatternFallback(stats: PatternStats): string[] {
    const patterns: string[] = [];

    if (stats.weekdayCompletion.length > 0 && stats.weekdayCompletion[0].rate < 70) {
      const lowest = stats.weekdayCompletion[0];
      patterns.push(`Konsistensi habit paling rendah di hari ${lowest.day} (${lowest.rate}% selesai).`);
    }
    if (stats.mostMissedHabit && stats.mostMissedHabit.count >= 3) {
      patterns.push(
        `Habit "${stats.mostMissedHabit.name}" paling sering terlewat (${stats.mostMissedHabit.count}x dalam 30 hari terakhir).`,
      );
    }
    if (stats.categoryShift && Math.abs(stats.categoryShift.deltaPct) >= 20) {
      const arah = stats.categoryShift.deltaPct > 0 ? 'naik' : 'turun';
      patterns.push(
        `Waktu untuk kategori "${stats.categoryShift.name}" ${arah} ${Math.abs(stats.categoryShift.deltaPct)}% dibanding minggu lalu.`,
      );
    }
    if (patterns.length === 0) {
      patterns.push('Belum cukup data untuk mendeteksi pola yang jelas. Terus catat aktivitas & habit untuk insight yang lebih akurat.');
    }
    return patterns;
  }

  /** Detects behavioral correlations from the last 30 days of habit check-ins and weekly category time (e.g. a weekday with a low completion rate, or a habit that's missed unusually often). */
  async patternDetection(userId: string) {
    const { circuitOpen } = await this.guardRateLimitAndCircuit(userId);
    const stats = await this.buildPatternStats(userId);

    if (!circuitOpen && stats.hasEnoughData) {
      try {
        const generated = await this.claudeClient.generateJson<{ patterns: string[] }>(
          'You are a productivity coach. Given these stats about a user\'s habit completion by weekday and their ' +
            "week-over-week category time usage, identify 1-3 concrete, specific behavioral patterns or correlations " +
            '(in Indonesian, one short sentence each, citing the numbers/days/percentages given). Only state ' +
            'observations grounded in the data - no generic advice. Reply with exactly: {"patterns": string[]}',
          JSON.stringify(stats),
        );
        this.circuitBreaker.recordSuccess();

        await this.prisma.aiInsight.create({
          data: {
            userId,
            type: 'pattern',
            period: 'monthly',
            content: { patterns: generated.patterns, sourceStats: stats } as object,
          },
        });

        return { patterns: generated.patterns, ai_available: true, fallback: false, is_ai_generated: true };
      } catch {
        this.circuitBreaker.recordFailure();
      }
    }

    return {
      patterns: this.naivePatternFallback(stats),
      ai_available: false,
      fallback: true,
      is_ai_generated: false,
    };
  }
}
