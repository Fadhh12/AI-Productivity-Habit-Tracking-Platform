import { Body, Controller, Delete, Get, Headers, Post, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser, CurrentUserPayload } from '../auth/decorators/current-user.decorator';
import { PushService } from './push.service';
import { SubscribePushDto, UnsubscribePushDto } from './dto/subscribe-push.dto';

@Controller('api/push')
@UseGuards(JwtAuthGuard)
export class PushController {
  constructor(private readonly pushService: PushService) {}

  @Get('public-key')
  async publicKey(@CurrentUser() user: CurrentUserPayload) {
    return {
      available: this.pushService.isConfigured(),
      publicKey: this.pushService.getPublicKey(),
      devices: await this.pushService.countForUser(user.id),
    };
  }

  @Post('subscribe')
  subscribe(
    @CurrentUser() user: CurrentUserPayload,
    @Body() dto: SubscribePushDto,
    @Headers('user-agent') userAgent?: string,
  ) {
    return this.pushService.subscribe(user.id, {
      endpoint: dto.endpoint,
      p256dh: dto.keys.p256dh,
      auth: dto.keys.auth,
      userAgent: userAgent?.slice(0, 255),
    });
  }

  @Delete('subscribe')
  unsubscribe(@CurrentUser() user: CurrentUserPayload, @Body() dto: UnsubscribePushDto) {
    return this.pushService.unsubscribe(user.id, dto.endpoint);
  }

  /** Sends a test push to the caller's own devices so they can confirm it works. */
  @Post('test')
  async test(@CurrentUser() user: CurrentUserPayload) {
    const delivered = await this.pushService.sendToUser(
      user.id,
      'test_push',
      'Kalau kamu melihat ini, notifikasi push berfungsi.',
    );
    return { delivered };
  }
}
