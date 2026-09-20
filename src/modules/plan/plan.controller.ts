import { Controller, Get, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser, CurrentUserPayload } from '../auth/decorators/current-user.decorator';
import { PlanService } from './plan.service';

@Controller('api/plan')
@UseGuards(JwtAuthGuard)
export class PlanController {
  constructor(private readonly planService: PlanService) {}

  @Get()
  summary(@CurrentUser() user: CurrentUserPayload) {
    return this.planService.summary(user.id);
  }
}
