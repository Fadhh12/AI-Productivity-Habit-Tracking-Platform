import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { ActivityRepository } from './activity.repository';
import { ActivityOverlapUtil } from './activity-overlap.util';
import { CreateActivityDto } from './dto/create-activity.dto';
import { UpdateActivityDto } from './dto/update-activity.dto';

@Injectable()
export class ActivityService {
  constructor(private readonly repository: ActivityRepository) {}

  async findAll(userId: string, date?: string) {
    if (!date) return this.repository.findAll(userId);
    const dayStart = new Date(`${date}T00:00:00.000Z`);
    const dayEnd = new Date(`${date}T23:59:59.999Z`);
    return this.repository.findAllForDate(userId, dayStart, dayEnd);
  }

  async findOneOrThrow(userId: string, id: string) {
    const activity = await this.repository.findById(userId, id);
    if (!activity) throw new NotFoundException('Activity log not found');
    return activity;
  }

  async create(userId: string, dto: CreateActivityDto) {
    const startTime = new Date(dto.startTime);
    const endTime = new Date(dto.endTime);
    if (endTime <= startTime) {
      throw new BadRequestException('endTime must be after startTime');
    }

    const warnings = await this.checkOverlapWarnings(userId, dto.categoryId, startTime, endTime);

    const activity = await this.repository.create(userId, {
      title: dto.title,
      categoryId: dto.categoryId ?? null,
      startTime,
      endTime,
      note: dto.note ?? null,
    });

    return { data: activity, warnings };
  }

  async update(userId: string, id: string, dto: UpdateActivityDto) {
    const existing = await this.findOneOrThrow(userId, id);

    const startTime = dto.startTime ? new Date(dto.startTime) : existing.startTime;
    const endTime = dto.endTime ? new Date(dto.endTime) : existing.endTime;
    if (endTime <= startTime) {
      throw new BadRequestException('endTime must be after startTime');
    }

    const categoryId = dto.categoryId !== undefined ? dto.categoryId : existing.categoryId;
    const warnings = await this.checkOverlapWarnings(userId, categoryId, startTime, endTime, id);

    const activity = await this.repository.update(id, {
      title: dto.title ?? existing.title,
      categoryId: categoryId ?? null,
      startTime,
      endTime,
      note: dto.note !== undefined ? dto.note : existing.note,
    });

    return { data: activity, warnings };
  }

  async remove(userId: string, id: string) {
    await this.findOneOrThrow(userId, id);
    await this.repository.delete(id);
    return { success: true };
  }

  private async checkOverlapWarnings(
    userId: string,
    categoryId: string | null | undefined,
    startTime: Date,
    endTime: Date,
    excludeId?: string,
  ): Promise<string[]> {
    if (!categoryId) return [];
    const overlapping = await this.repository.findOverlapping(
      userId,
      categoryId,
      startTime,
      endTime,
      excludeId,
    );
    const candidates = ActivityOverlapUtil.findOverlapping(
      { startTime, endTime },
      overlapping.map((o) => ({ startTime: o.startTime, endTime: o.endTime })),
    );
    return candidates.map(
      () =>
        `This activity overlaps with another entry in the same category. It was still saved — please double-check your schedule.`,
    );
  }
}
