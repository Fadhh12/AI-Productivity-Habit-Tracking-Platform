import { Injectable } from '@nestjs/common';
import { NotificationRepository } from './notification.repository';

@Injectable()
export class NotificationService {
  constructor(private readonly repository: NotificationRepository) {}

  findAll(userId: string) {
    return this.repository.findAll(userId);
  }

  notify(userId: string, type: string, message: string) {
    return this.repository.create(userId, type, message);
  }

  async markRead(userId: string, id: string) {
    await this.repository.markRead(userId, id);
    return { success: true };
  }
}
