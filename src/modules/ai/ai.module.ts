import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { AiController } from './ai.controller';
import { AiService } from './ai.service';
import { ClaudeClient } from './claude.client';
import { CircuitBreakerService } from './circuit-breaker.service';
import { AiRateLimiterService } from './ai-rate-limiter.service';
import { RollupModule } from '../rollup/rollup.module';
import { HabitModule } from '../habit/habit.module';
import { ActivityModule } from '../activity/activity.module';

@Module({
  imports: [ConfigModule, RollupModule, HabitModule, ActivityModule],
  controllers: [AiController],
  providers: [
    AiService,
    ClaudeClient,
    AiRateLimiterService,
    {
      provide: CircuitBreakerService,
      useFactory: (config: ConfigService) => CircuitBreakerService.fromConfig(config),
      inject: [ConfigService],
    },
  ],
  exports: [AiService, CircuitBreakerService],
})
export class AiModule {}
