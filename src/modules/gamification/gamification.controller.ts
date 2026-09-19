import { Controller, Get, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser, CurrentUserPayload } from '../auth/decorators/current-user.decorator';
import { GamificationService } from './gamification.service';

@Controller('api/gamification')
@UseGuards(JwtAuthGuard)
export class GamificationController {
  constructor(private readonly service: GamificationService) {}

  @Get('summary')
  summary(@CurrentUser() user: CurrentUserPayload) {
    return this.service.summary(user.id);
  }
}
