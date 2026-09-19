import { Injectable } from '@nestjs/common';
import { GamificationRepository } from './gamification.repository';
import { GamificationCalculator } from './gamification-calculator.util';

@Injectable()
export class GamificationService {
  constructor(private readonly repository: GamificationRepository) {}

  async summary(userId: string) {
    const stats = await this.repository.loadStats(userId);
    const xp = GamificationCalculator.xp(stats);
    return {
      stats,
      ...GamificationCalculator.level(xp),
      badges: GamificationCalculator.badges(stats),
    };
  }
}
