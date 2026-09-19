import { Module } from '@nestjs/common';
import { GamificationController } from './gamification.controller';
import { GamificationService } from './gamification.service';
import { GamificationRepository } from './gamification.repository';

@Module({
  controllers: [GamificationController],
  providers: [GamificationService, GamificationRepository],
})
export class GamificationModule {}
