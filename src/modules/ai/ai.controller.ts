import { Body, Controller, Get, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser, CurrentUserPayload } from '../auth/decorators/current-user.decorator';
import { AiService } from './ai.service';
import { CoachService } from './coach.service';
import { CoachChatDto } from './dto/coach-chat.dto';
import { QuickAddDto } from './dto/quick-add.dto';
import { DigestQueryDto } from './dto/digest-query.dto';
import { GoalSuggestionDto } from './dto/goal-suggestion.dto';
import { SaveReflectionDto } from './dto/save-reflection.dto';

@Controller('api/ai')
@UseGuards(JwtAuthGuard)
export class AiController {
  constructor(
    private readonly aiService: AiService,
    private readonly coachService: CoachService,
  ) {}

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

  @Get('reflection/today')
  getTodayReflection(@CurrentUser() user: CurrentUserPayload) {
    return this.aiService.getTodayReflection(user.id);
  }

  @Patch('reflection/today')
  saveReflection(@CurrentUser() user: CurrentUserPayload, @Body() dto: SaveReflectionDto) {
    return this.aiService.saveReflectionResponse(user.id, dto.responseText ?? null);
  }

  @Post('coach')
  coach(@CurrentUser() user: CurrentUserPayload, @Body() dto: CoachChatDto) {
    return this.coachService.chat(user.id, dto.message, dto.history);
  }

  @Get('pattern-detection')
  patternDetection(@CurrentUser() user: CurrentUserPayload) {
    return this.aiService.patternDetection(user.id);
  }
}
