import { Injectable, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as webpush from 'web-push';
import { PrismaService } from '../../infra/db/prisma.service';
import { StructuredLogger } from '../../shared/utils/structured-logger';
import { buildPushPayload, isExpiredSubscriptionError, PushPayload } from './push-payload.util';

export interface SubscriptionInput {
  endpoint: string;
  p256dh: string;
  auth: string;
  userAgent?: string;
}

@Injectable()
export class PushService implements OnModuleInit {
  private configured = false;

  constructor(
    private readonly configService: ConfigService,
    private readonly prisma: PrismaService,
  ) {}

  onModuleInit() {
    const cfg = this.configService.get('push');
    if (cfg?.publicKey && cfg?.privateKey) {
      webpush.setVapidDetails(cfg.subject, cfg.publicKey, cfg.privateKey);
      this.configured = true;
    }
  }

  isConfigured(): boolean {
    return this.configured;
  }

  getPublicKey(): string | null {
    return this.configured ? this.configService.get<string>('push.publicKey')! : null;
  }

  /** One row per device; re-subscribing the same device (same endpoint) just refreshes its keys and owner. */
  async subscribe(userId: string, input: SubscriptionInput) {
    await this.prisma.pushSubscription.upsert({
      where: { endpoint: input.endpoint },
      create: { userId, ...input },
      update: { userId, p256dh: input.p256dh, auth: input.auth, userAgent: input.userAgent },
    });
    return { success: true };
  }

  async unsubscribe(userId: string, endpoint: string) {
    await this.prisma.pushSubscription.deleteMany({ where: { userId, endpoint } });
    return { success: true };
  }

  async countForUser(userId: string): Promise<number> {
    return this.prisma.pushSubscription.count({ where: { userId } });
  }

  /** Fire-and-forget delivery to all of a user's devices. Never throws: push is a bonus on top of the in-app notification. */
  async sendToUser(userId: string, type: string, message: string): Promise<number> {
    if (!this.configured) return 0;

    const subscriptions = await this.prisma.pushSubscription.findMany({ where: { userId } });
    if (subscriptions.length === 0) return 0;

    const payload = JSON.stringify(buildPushPayload(type, message) satisfies PushPayload);
    let delivered = 0;

    await Promise.all(
      subscriptions.map(async (sub) => {
        try {
          await webpush.sendNotification(
            { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
            payload,
            { TTL: 60 * 60 * 12 },
          );
          delivered += 1;
        } catch (error) {
          if (isExpiredSubscriptionError(error)) {
            await this.prisma.pushSubscription.deleteMany({ where: { id: sub.id } });
            return;
          }
          StructuredLogger.error({
            message: 'Web push delivery failed',
            userId,
            errorType: (error as Error).constructor?.name ?? 'Error',
            stack: (error as Error).stack,
          });
        }
      }),
    );

    return delivered;
  }
}
