import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { RedisService } from '../../infra/cache/redis.service';

const SECONDS_PER_DAY = 24 * 60 * 60;

/** Per-user, per-UTC-day AI request counter, backed by Redis (INCR + EXPIRE). */
@Injectable()
export class AiRateLimiterService {
  constructor(
    private readonly redis: RedisService,
    private readonly configService: ConfigService,
  ) {}

  private key(userId: string): string {
    const today = new Date().toISOString().slice(0, 10);
    return `ai:ratelimit:${userId}:${today}`;
  }

  async checkAndIncrement(
    userId: string,
  ): Promise<{ allowed: boolean; count: number; limit: number }> {
    const limit = this.configService.get<number>('ai.dailyRateLimit') ?? 50;
    const key = this.key(userId);
    const count = await this.redis.client.incr(key);
    if (count === 1) {
      await this.redis.client.expire(key, SECONDS_PER_DAY);
    }
    return { allowed: count <= limit, count, limit };
  }
}
