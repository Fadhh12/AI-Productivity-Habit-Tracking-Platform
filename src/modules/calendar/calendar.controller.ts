import {
  Controller,
  Delete,
  Get,
  Post,
  Query,
  Res,
  UseGuards,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Response } from 'express';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser, CurrentUserPayload } from '../auth/decorators/current-user.decorator';
import { CalendarService } from './calendar.service';
import { SyncCalendarDto } from './dto/sync-calendar.dto';
import { StructuredLogger } from '../../shared/utils/structured-logger';

@Controller('api/calendar/google')
export class CalendarController {
  constructor(
    private readonly calendarService: CalendarService,
    private readonly configService: ConfigService,
  ) {}

  @Get('auth-url')
  @UseGuards(JwtAuthGuard)
  getAuthUrl(@CurrentUser() user: CurrentUserPayload) {
    return this.calendarService.getAuthUrl(user.id);
  }

  /** Public: this is where Google redirects the browser back to after the user grants consent — it never carries our own JWT, only the signed `state` we minted in getAuthUrl. */
  @Get('callback')
  async callback(@Query('code') code: string, @Query('state') state: string, @Res() res: Response) {
    const frontendUrl = this.configService.get<string>('frontendUrl');
    try {
      await this.calendarService.handleCallback(code, state);
      res.redirect(`${frontendUrl}/settings?calendar=connected`);
    } catch (error) {
      StructuredLogger.error({
        message: 'Google Calendar OAuth callback failed',
        errorType: (error as Error).constructor?.name ?? 'Error',
        stack: (error as Error).stack,
      });
      res.redirect(`${frontendUrl}/settings?calendar=error`);
    }
  }

  @Get('status')
  @UseGuards(JwtAuthGuard)
  getStatus(@CurrentUser() user: CurrentUserPayload) {
    return this.calendarService.getStatus(user.id);
  }

  @Post('sync')
  @UseGuards(JwtAuthGuard)
  sync(@CurrentUser() user: CurrentUserPayload, @Query() query: SyncCalendarDto) {
    return this.calendarService.syncForUser(
      user.id,
      query.from ? new Date(query.from) : undefined,
      query.to ? new Date(query.to) : undefined,
    );
  }

  @Delete()
  @UseGuards(JwtAuthGuard)
  disconnect(@CurrentUser() user: CurrentUserPayload) {
    return this.calendarService.disconnect(user.id);
  }
}
