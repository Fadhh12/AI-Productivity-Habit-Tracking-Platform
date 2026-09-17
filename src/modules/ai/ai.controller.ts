import { Body, Controller, Get, Post, Query, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser, CurrentUserPayload } from '../auth/decorators/current-user.decorator';
import { AiService } from './ai.service';
import { QuickAddDto } from './dto/quick-add.dto';
import { DigestQueryDto } from './dto/digest-query.dto';
import { GoalSuggestionDto } from './dto/goal-suggestion.dto';

@Controller('api/ai')
@UseGuards(JwtAuthGuard)
export class AiController {
  constructor(private readonly aiService: AiService) {}

  @Post('quick-add')
  quickAdd(@CurrentUser() user: CurrentUserPayload, @Body() dto: QuickAddDto) {
    return this.aiService.quickAdd(user.id, dto.text);
  }

  @Get('digest')
  digest(@CurrentUser() user: CurrentUserPayload, @Query() query: DigestQueryDto) {
    return this.aiService.digest(user.id, query.period);
  }

  @Post('goal-suggestion')
  goalSuggestion(@CurrentUser() user: CurrentUserPayload, @Body() dto: GoalSuggestionDto) {
    return this.aiService.goalSuggestion(user.id, dto.yearlyGoalTitle);
  }
}
