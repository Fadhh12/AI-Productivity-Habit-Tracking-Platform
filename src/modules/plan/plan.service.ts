import { ForbiddenException, Injectable } from '@nestjs/common';
import { PrismaService } from '../../infra/db/prisma.service';
import { AiRateLimiterService } from './ai-rate-limiter.service';
import { extendPremium, FEATURE_LABELS, FREE_DAILY_LIMITS, Plan, PremiumFeature, resolvePlan } from './plan.util';

@Injectable()
export class PlanService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly limiter: AiRateLimiterService,
  ) {}

  async getPlan(userId: string): Promise<Plan> {
    const user = await this.prisma.user.findUnique({ where: { id: userId }, select: { premiumUntil: true } });
    return resolvePlan(user?.premiumUntil);
  }

  async isPlus(userId: string): Promise<boolean> {
    return (await this.getPlan(userId)) === 'plus';
  }

  /** Throws a 403 with a machine-readable code so the client can show an upgrade prompt. */
  async requirePlus(userId: string, feature: PremiumFeature): Promise<void> {
    if (await this.isPlus(userId)) return;
    throw new ForbiddenException({
      statusCode: 403,
      code: 'PREMIUM_REQUIRED',
      feature,
      message: `${FEATURE_LABELS[feature]} tersedia di Continuum Plus.`,
    });
  }

  async summary(userId: string) {
    const user = await this.prisma.user.findUniqueOrThrow({ where: { id: userId }, select: { premiumUntil: true } });
    const plan = resolvePlan(user.premiumUntil);
    const [coach, ai] = await Promise.all([
      this.limiter.usage(userId, 'coach', plan),
      this.limiter.usage(userId, 'ai', plan),
    ]);
    return {
      plan,
      premiumUntil: plan === 'plus' ? user.premiumUntil : null,
      freeLimits: FREE_DAILY_LIMITS,
      usage: { coach, ai },
      features: Object.entries(FEATURE_LABELS).map(([key, label]) => ({ key, label })),
    };
  }

  /** Admin/testing entry point until store billing is wired in; zero or negative `days` ends the plan now. */
  async grant(userId: string, days: number): Promise<Date | null> {
    const current = (await this.prisma.user.findUniqueOrThrow({ where: { id: userId }, select: { premiumUntil: true } }))
      .premiumUntil;
    const premiumUntil = days > 0 ? extendPremium(current, days) : null;
    await this.prisma.user.update({ where: { id: userId }, data: { premiumUntil } });
    return premiumUntil;
  }
}
