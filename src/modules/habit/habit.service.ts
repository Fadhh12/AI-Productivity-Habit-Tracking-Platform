import { Injectable, NotFoundException } from '@nestjs/common';
import { HabitRepository } from './habit.repository';
import { StreakEngineService } from './streak-engine.service';
import { DateUtil } from '../../shared/utils/date.util';
import { CreateHabitDto } from './dto/create-habit.dto';
import { UpdateHabitDto } from './dto/update-habit.dto';
import { CheckinHabitDto } from './dto/checkin-habit.dto';

const MAX_ACTIVE_HABITS = 5;
const FORGIVENESS_WINDOW_DAYS = 7;

@Injectable()
export class HabitService {
  constructor(
    private readonly repository: HabitRepository,
    private readonly streakEngine: StreakEngineService,
  ) {}

  findAll(userId: string) {
    return this.repository.findAll(userId);
  }

  async findOneOrThrow(userId: string, id: string) {
    const habit = await this.repository.findById(userId, id);
    if (!habit) throw new NotFoundException('Habit not found');
    return habit;
  }

  async create(userId: string, dto: CreateHabitDto) {
    const activeCount = await this.repository.countActive(userId);
    if (activeCount >= MAX_ACTIVE_HABITS && !dto.force) {
      return {
        requiresConfirmation: true,
        message: `You already have ${activeCount} active habits. Anti-burnout guidance suggests 3-5. Resend with "force": true to add another anyway.`,
      };
    }

    const habit = await this.repository.create(userId, {
      name: dto.name,
      frequency: dto.frequency,
      goalId: dto.goalId ?? null,
    });
    return { data: habit };
  }

  async update(userId: string, id: string, dto: UpdateHabitDto) {
    const existing = await this.findOneOrThrow(userId, id);

    if (dto.active === true && !existing.active) {
      const activeCount = await this.repository.countActive(userId);
      if (activeCount >= MAX_ACTIVE_HABITS && !dto.force) {
        return {
          requiresConfirmation: true,
          message: `You already have ${activeCount} active habits. Resend with "force": true to reactivate anyway.`,
        };
      }
    }

    const { force: _force, ...rest } = dto;
    return { data: await this.repository.update(id, rest) };
  }

  async remove(userId: string, id: string) {
    await this.findOneOrThrow(userId, id);
    await this.repository.delete(id);
    return { success: true };
  }

  /**
   * Checks in "today" (in the habit owner's local timezone) as done. Any days
   * between the last recorded checkin and yesterday are first resolved
   * automatically (missed / skipped_forgiven) so the streak stays consistent
   * even if the daily cron hasn't run yet. Idempotent: calling twice for the
   * same local day returns the same result without double-incrementing.
   */
  async checkin(userId: string, habitId: string, dto: CheckinHabitDto) {
    const habit = await this.repository.findByIdWithUser(habitId);
    if (!habit || habit.userId !== userId) throw new NotFoundException('Habit not found');

    const now = new Date();
    const todayStr = DateUtil.localDateString(now, habit.user.timezone);

    const existingToday = await this.repository.findCheckinByDate(habitId, todayStr);
    if (existingToday?.status === 'done') {
      return {
        data: await this.repository.findById(userId, habitId),
        checkin: existingToday,
        idempotent: true,
      };
    }

    let currentStreak = habit.currentStreak;
    const lastCheckin = await this.repository.findLatestCheckin(habitId);
    const lastProcessedDate = lastCheckin
      ? lastCheckin.checkinDate.toISOString().slice(0, 10)
      : DateUtil.localDateString(habit.createdAt, habit.user.timezone);

    let cursor = DateUtil.addDays(lastProcessedDate, 1);
    while (cursor < todayStr) {
      const missedInWindow = await this.countMissedInWindow(habitId, cursor);
      const result = this.streakEngine.resolveDay({
        currentStreak,
        missedInWindowBeforeToday: missedInWindow,
        didCheckIn: false,
      });
      await this.repository.upsertCheckin(habitId, cursor, result.status);
      currentStreak = result.newStreak;
      cursor = DateUtil.addDays(cursor, 1);
    }

    const missedInWindowToday = await this.countMissedInWindow(habitId, todayStr);
    const result = this.streakEngine.resolveDay({
      currentStreak,
      missedInWindowBeforeToday: missedInWindowToday,
      didCheckIn: true,
    });

    const checkin = await this.repository.upsertCheckin(habitId, todayStr, result.status, dto.note);
    const updatedHabit = await this.repository.update(habitId, {
      currentStreak: result.newStreak,
      skipCountWindow: result.skipCountWindow,
    });

    return { data: updatedHabit, checkin, idempotent: false };
  }

  /** Processes and persists any past days (up to and including `throughDateStr`) that have no checkin recorded yet. */
  async processMissedDaysUpTo(habitId: string, throughDateStr: string) {
    const habit = await this.repository.findByIdWithUser(habitId);
    if (!habit) throw new NotFoundException('Habit not found');

    let currentStreak = habit.currentStreak;
    const lastCheckin = await this.repository.findLatestCheckin(habitId);
    const lastProcessedDate = lastCheckin
      ? lastCheckin.checkinDate.toISOString().slice(0, 10)
      : DateUtil.localDateString(habit.createdAt, habit.user.timezone);

    let cursor = DateUtil.addDays(lastProcessedDate, 1);
    let processedAny = false;
    while (cursor <= throughDateStr) {
      const missedInWindow = await this.countMissedInWindow(habitId, cursor);
      const result = this.streakEngine.resolveDay({
        currentStreak,
        missedInWindowBeforeToday: missedInWindow,
        didCheckIn: false,
      });
      await this.repository.upsertCheckin(habitId, cursor, result.status);
      currentStreak = result.newStreak;
      cursor = DateUtil.addDays(cursor, 1);
      processedAny = true;
    }

    if (processedAny) {
      await this.repository.update(habitId, {
        currentStreak,
        skipCountWindow: await this.countMissedInWindow(
          habitId,
          DateUtil.addDays(throughDateStr, 1),
        ),
      });
    }
  }

  private async countMissedInWindow(habitId: string, dateStr: string): Promise<number> {
    const fromDate = DateUtil.addDays(dateStr, -(FORGIVENESS_WINDOW_DAYS - 1));
    const toDate = DateUtil.addDays(dateStr, -1);
    if (toDate < fromDate) return 0;
    const checkins = await this.repository.findCheckinsInRange(habitId, fromDate, toDate);
    return checkins.filter((c) => c.status === 'missed' || c.status === 'skipped_forgiven').length;
  }
}
