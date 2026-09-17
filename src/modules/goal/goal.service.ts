import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { GoalRepository } from './goal.repository';
import { CreateGoalDto } from './dto/create-goal.dto';
import { UpdateGoalDto } from './dto/update-goal.dto';

@Injectable()
export class GoalService {
  constructor(private readonly repository: GoalRepository) {}

  findAll(userId: string) {
    return this.repository.findAll(userId);
  }

  async findOneOrThrow(userId: string, id: string) {
    const goal = await this.repository.findById(userId, id);
    if (!goal) throw new NotFoundException('Goal not found');
    return goal;
  }

  async breakdown(userId: string, id: string) {
    const goal = await this.repository.findBreakdown(userId, id);
    if (!goal) throw new NotFoundException('Goal not found');
    return goal;
  }

  async create(userId: string, dto: CreateGoalDto) {
    if (dto.horizon === 'yearly' && dto.parentGoalId) {
      throw new BadRequestException('A yearly goal cannot have a parent goal');
    }

    if (dto.horizon === 'monthly' && dto.parentGoalId) {
      const parent = await this.repository.findById(userId, dto.parentGoalId);
      if (!parent)
        throw new BadRequestException('parentGoalId does not reference an existing goal of yours');
      if (parent.horizon !== 'yearly') {
        throw new BadRequestException('A monthly goal must be linked to a yearly goal');
      }
    }

    return this.repository.create(userId, {
      title: dto.title,
      horizon: dto.horizon,
      parentGoalId: dto.parentGoalId ?? null,
      targetDate: dto.targetDate ? new Date(dto.targetDate) : null,
    });
  }

  async update(userId: string, id: string, dto: UpdateGoalDto) {
    const existing = await this.findOneOrThrow(userId, id);
    const horizon = dto.horizon ?? existing.horizon;

    if (dto.parentGoalId !== undefined) {
      if (horizon === 'yearly' && dto.parentGoalId) {
        throw new BadRequestException('A yearly goal cannot have a parent goal');
      }
      if (horizon === 'monthly' && dto.parentGoalId) {
        const parent = await this.repository.findById(userId, dto.parentGoalId);
        if (!parent || parent.horizon !== 'yearly') {
          throw new BadRequestException('A monthly goal must be linked to a yearly goal');
        }
      }
    }

    return this.repository.update(id, {
      title: dto.title ?? existing.title,
      horizon,
      parentGoalId: dto.parentGoalId !== undefined ? dto.parentGoalId : existing.parentGoalId,
      targetDate: dto.targetDate ? new Date(dto.targetDate) : existing.targetDate,
      status: dto.status ?? existing.status,
    });
  }

  /** Deleting a goal never deletes linked habits or child goals — it only soft-unlinks them (DB-level ON DELETE SET NULL). */
  async remove(userId: string, id: string) {
    await this.findOneOrThrow(userId, id);
    await this.repository.delete(id);
    return { success: true };
  }
}
