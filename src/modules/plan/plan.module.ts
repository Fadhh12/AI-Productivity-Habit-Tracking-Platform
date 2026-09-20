import { Global, Module } from '@nestjs/common';
import { AiRateLimiterService } from './ai-rate-limiter.service';
import { PlanController } from './plan.controller';
import { PlanService } from './plan.service';

/** Global so any feature module can gate itself with PlanService without import cycles. */
@Global()
@Module({
  controllers: [PlanController],
  providers: [PlanService, AiRateLimiterService],
  exports: [PlanService, AiRateLimiterService],
})
export class PlanModule {}
