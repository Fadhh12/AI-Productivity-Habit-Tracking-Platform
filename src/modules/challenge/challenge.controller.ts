import { Controller, Get, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser, CurrentUserPayload } from '../auth/decorators/current-user.decorator';
import { ChallengeService } from './challenge.service';

@Controller('api/challenges')
@UseGuards(JwtAuthGuard)
export class ChallengeController {
  constructor(private readonly challengeService: ChallengeService) {}

  @Get('current')
  current(@CurrentUser() user: CurrentUserPayload) {
    return this.challengeService.getCurrent(user.id);
  }

  @Get('history')
  history(@CurrentUser() user: CurrentUserPayload) {
    return this.challengeService.history(user.id);
  }
}
