import { Injectable } from '@nestjs/common';
import { NotificationRepository } from './notification.repository';
import { PushService } from '../push/push.service';

@Injectable()
export class NotificationService {
  constructor(
    private readonly repository: NotificationRepository,
    private readonly pushService: PushService,
  ) {}

  findAll(userId: string) {
    return this.repository.findAll(userId);
  }

  /** Creates the in-app notification, then (best effort, never blocking or failing it) mirrors it to the user's phones as a push. */
  async notify(userId: string, type: string, message: string, refId?: string) {
    const notification = await this.repository.create(userId, type, message, refId);
    void this.pushService.sendToUser(userId, type, message).catch(() => undefined);
    return notification;
  }

  /** Used by schedulers to avoid sending the same reminder twice for the same habit-day or activity. */
  async alreadySent(userId: string, type: string, refId: string): Promise<boolean> {
    return (await this.repository.findByTypeAndRef(userId, type, refId)) !== null;
  }

  /** Like alreadySent, but for notifications whose type varies (e.g. AI-phrased vs template) while the refId identifies the same event. */
  async alreadySentAny(userId: string, types: string[], refId: string): Promise<boolean> {
    return (await this.repository.findByTypesAndRef(userId, types, refId)) !== null;
  }

  async markRead(userId: string, id: string) {
    await this.repository.markRead(userId, id);
    return { success: true };
  }
}
