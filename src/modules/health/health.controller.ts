import { Controller, Get, HttpStatus, Res } from '@nestjs/common';
import { Response } from 'express';
import { PrismaService } from '../../infra/db/prisma.service';
import { RedisService } from '../../infra/cache/redis.service';
import { CircuitBreakerService } from '../ai/circuit-breaker.service';

@Controller('health')
export class HealthController {
  constructor(
    private readonly prisma: PrismaService,
    private readonly redis: RedisService,
    private readonly aiCircuitBreaker: CircuitBreakerService,
  ) {}

  @Get()
  async check(@Res() res: Response) {
    const [dbHealthy, redisHealthy] = await Promise.all([
      this.prisma.isHealthy(),
      this.redis.isHealthy(),
    ]);
    const circuitState = this.aiCircuitBreaker.getState();

    const healthy = dbHealthy && redisHealthy;
    const body = {
      status: healthy ? 'ok' : 'degraded',
      timestamp: new Date().toISOString(),
      checks: {
        database: dbHealthy ? 'up' : 'down',
        redis: redisHealthy ? 'up' : 'down',
        aiCircuitBreaker: {
          state: circuitState,
          remainingCooldownMs: this.aiCircuitBreaker.getRemainingCooldownMs(),
        },
      },
    };

    res.status(healthy ? HttpStatus.OK : HttpStatus.SERVICE_UNAVAILABLE).json(body);
  }
}
