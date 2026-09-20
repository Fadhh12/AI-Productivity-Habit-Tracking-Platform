import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { RedisService } from '../../infra/cache/redis.service';
import { PrismaService } from '../../infra/db/prisma.service';
import { AiBucket, dailyLimit, Plan, resolvePlan } from './plan.util';

const SECONDS_PER_DAY = 24 * 60 * 60;

/** Per-user, per-bucket, per-UTC-day AI request counter (Redis INCR + EXPIRE). The limit depends on the user's plan. */
@Injectable()
export class AiRateLimiterService {
  constructor(
    private readonly redis: RedisService,
    private readonly configService: ConfigService,
    private readonly prisma: PrismaService,
  ) {}

  private key(userId: string, bucket: AiBucket): string {
    const today = new Date().toISOString().slice(0, 10);
    return `ai:ratelimit:${bucket}:${userId}:${today}`;
  }

  private plusLimit(): number {
    return this.configService.get<number>('ai.dailyRateLimit') ?? 50;
  }

  private async planOf(userId: string): Promise<Plan> {
    const user = await this.prisma.user.findUnique({ where: { id: userId }, select: { premiumUntil: true } });
    return resolvePlan(user?.premiumUntil);
  }

  async checkAndIncrement(
    userId: string,
    bucket: AiBucket = 'ai',
  ): Promise<{ allowed: boolean; count: number; limit: number; plan: Plan }> {
    const plan = await this.planOf(userId);
    const limit = dailyLimit(plan, bucket, this.plusLimit());
    const key = this.key(userId, bucket);
    const count = await this.redis.client.incr(key);
    if (count === 1) {
      await this.redis.client.expire(key, SECONDS_PER_DAY);
    }
    return { allowed: count <= limit, count, limit, plan };
  }

  /** Counts one request and throws the 429 the API returns (with a code the client turns into an upgrade prompt) when over budget. */
  async consume(userId: string, bucket: AiBucket): Promise<void> {
    const rate = await this.checkAndIncrement(userId, bucket);
    if (rate.allowed) return;
    const what = bucket === 'coach' ? 'pesan Coach' : 'permintaan AI';
    throw new HttpException(
      {
        statusCode: HttpStatus.TOO_MANY_REQUESTS,
        code: 'LIMIT_REACHED',
        plan: rate.plan,
        message:
          rate.plan === 'free'
            ? `Batas ${rate.limit} ${what} gratis hari ini tercapai. Upgrade ke Continuum Plus untuk lebih banyak, atau coba lagi besok.`
            : `Batas harian ${what} (${rate.limit}/hari) tercapai. Coba lagi besok.`,
      },
      HttpStatus.TOO_MANY_REQUESTS,
    );
  }

  /** Read-only view for the plan screen. */
  async usage(userId: string, bucket: AiBucket, plan: Plan): Promise<{ used: number; limit: number }> {
    const raw = await this.redis.client.get(this.key(userId, bucket));
    const limit = dailyLimit(plan, bucket, this.plusLimit());
    // Rejected attempts still increment the counter; never show more used than the limit.
    return { used: Math.min(raw ? Number(raw) : 0, limit), limit };
  }
}
