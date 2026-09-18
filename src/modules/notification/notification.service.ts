import { Injectable } from '@nestjs/common';
import { NotificationRepository } from './notification.repository';

@Injectable()
export class NotificationService {
  constructor(private readonly repository: NotificationRepository) {}

  findAll(userId: string) {
    return this.repository.findAll(userId);
  }

  notify(userId: string, type: string, message: string, refId?: string) {
    return this.repository.create(userId, type, message, refId);
  }

  /** Used by schedulers to avoid sending the same reminder twice for the same habit-day or activity. */
  async alreadySent(userId: string, type: string, refId: string): Promise<boolean> {
    return (await this.repository.findByTypeAndRef(userId, type, refId)) !== null;
  }

  async markRead(userId: string, id: string) {
    await this.repository.markRead(userId, id);
    return { success: true };
  }
}
