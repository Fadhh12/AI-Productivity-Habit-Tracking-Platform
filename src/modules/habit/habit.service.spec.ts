import { NotFoundException } from '@nestjs/common';
import { HabitService } from './habit.service';
import { HabitRepository } from './habit.repository';
import { StreakEngineService } from './streak-engine.service';
import { DateUtil } from '../../shared/utils/date.util';

describe('HabitService', () => {
  let repository: jest.Mocked<HabitRepository>;
  let service: HabitService;

  beforeEach(() => {
    repository = {
      countActive: jest.fn(),
      findAll: jest.fn(),
      findAllActive: jest.fn(),
      findById: jest.fn(),
      findByIdWithUser: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      findCheckinsInRange: jest.fn(),
      findCheckinByDate: jest.fn(),
      findLatestCheckin: jest.fn(),
      upsertCheckin: jest.fn(),
    } as unknown as jest.Mocked<HabitRepository>;

    service = new HabitService(repository, new StreakEngineService());
  });

  describe('create', () => {
    it('creates the habit when under the active-habit limit', async () => {
      repository.countActive.mockResolvedValue(2);
      repository.create.mockResolvedValue({ id: 'h1', name: 'Baca' } as never);

      const result = await service.create('u1', {
        name: 'Baca',
        frequency: 'daily',
      } as never);

      expect(result).toEqual({ data: { id: 'h1', name: 'Baca' } });
      expect(repository.create).toHaveBeenCalledWith('u1', {
        name: 'Baca',
        frequency: 'daily',
        goalId: null,
      });
    });

    it('asks for confirmation at the 5-active-habit soft limit without force', async () => {
      repository.countActive.mockResolvedValue(5);

      const result = await service.create('u1', { name: 'Baca', frequency: 'daily' } as never);

      expect(result).toEqual({
        requiresConfirmation: true,
        message: expect.stringContaining('5 active habits'),
      });
      expect(repository.create).not.toHaveBeenCalled();
    });

    it('bypasses the confirmation when force is set', async () => {
      repository.countActive.mockResolvedValue(5);
      repository.create.mockResolvedValue({ id: 'h1' } as never);

      const result = await service.create('u1', {
        name: 'Baca',
        frequency: 'daily',
        force: true,
      } as never);

      expect(result).toEqual({ data: { id: 'h1' } });
    });
  });

  describe('findOneOrThrow', () => {
    it('throws NotFoundException when the habit does not exist for that user', async () => {
      repository.findById.mockResolvedValue(null);
      await expect(service.findOneOrThrow('u1', 'missing')).rejects.toThrow(NotFoundException);
    });
  });

  describe('remove', () => {
    it('deletes the habit once ownership is confirmed', async () => {
      repository.findById.mockResolvedValue({ id: 'h1' } as never);
      const result = await service.remove('u1', 'h1');
      expect(repository.delete).toHaveBeenCalledWith('h1');
      expect(result).toEqual({ success: true });
    });

    it('never calls delete when the habit is not found', async () => {
      repository.findById.mockResolvedValue(null);
      await expect(service.remove('u1', 'missing')).rejects.toThrow(NotFoundException);
      expect(repository.delete).not.toHaveBeenCalled();
    });
  });

  describe('checkin', () => {
    const todayStr = DateUtil.localDateString(new Date(), 'UTC');

    it('rejects a habit that does not belong to the caller', async () => {
      repository.findByIdWithUser.mockResolvedValue({ id: 'h1', userId: 'someone-else' } as never);
      await expect(service.checkin('u1', 'h1', {})).rejects.toThrow(NotFoundException);
    });

    it('is idempotent when the habit was already checked in today', async () => {
      repository.findByIdWithUser.mockResolvedValue({
        id: 'h1',
        userId: 'u1',
        user: { timezone: 'UTC' },
      } as never);
      repository.findCheckinByDate.mockResolvedValue({ status: 'done' } as never);
      repository.findById.mockResolvedValue({ id: 'h1', currentStreak: 3 } as never);

      const result = await service.checkin('u1', 'h1', {});

      expect(result.idempotent).toBe(true);
      expect(repository.upsertCheckin).not.toHaveBeenCalled();
    });

    it('starts a fresh streak on the first-ever checkin with no backfill needed', async () => {
      repository.findByIdWithUser.mockResolvedValue({
        id: 'h1',
        userId: 'u1',
        currentStreak: 0,
        createdAt: new Date(),
        user: { timezone: 'UTC' },
      } as never);
      repository.findCheckinByDate.mockResolvedValue(null);
      repository.findLatestCheckin.mockResolvedValue(null);
      repository.findCheckinsInRange.mockResolvedValue([]);
      repository.upsertCheckin.mockResolvedValue({ status: 'done' } as never);
      repository.update.mockResolvedValue({ id: 'h1', currentStreak: 1 } as never);

      const result = await service.checkin('u1', 'h1', { note: 'nice' });

      expect(result.idempotent).toBe(false);
      expect(repository.upsertCheckin).toHaveBeenCalledWith('h1', todayStr, 'done', 'nice');
      expect(repository.update).toHaveBeenCalledWith('h1', {
        currentStreak: 1,
        skipCountWindow: 0,
      });
    });

    it('backfills missed days between the last checkin and today before recording today', async () => {
      const threeDaysAgo = DateUtil.addDays(todayStr, -3);
      repository.findByIdWithUser.mockResolvedValue({
        id: 'h1',
        userId: 'u1',
        currentStreak: 5,
        createdAt: new Date(`${threeDaysAgo}T00:00:00.000Z`),
        user: { timezone: 'UTC' },
      } as never);
      repository.findCheckinByDate.mockResolvedValue(null);
      repository.findLatestCheckin.mockResolvedValue({
        checkinDate: new Date(`${threeDaysAgo}T00:00:00.000Z`),
      } as never);
      // No prior checkins recorded in any window -> every missed day is a forgiven first skip.
      repository.findCheckinsInRange.mockResolvedValue([]);
      repository.upsertCheckin.mockResolvedValue({ status: 'skipped_forgiven' } as never);
      repository.update.mockResolvedValue({ id: 'h1' } as never);

      await service.checkin('u1', 'h1', {});

      // Two missed days backfilled (threeDaysAgo+1, threeDaysAgo+2), then today's checkin.
      expect(repository.upsertCheckin).toHaveBeenCalledTimes(3);
      expect(repository.upsertCheckin).toHaveBeenNthCalledWith(
        1,
        'h1',
        DateUtil.addDays(threeDaysAgo, 1),
        'skipped_forgiven',
      );
      expect(repository.upsertCheckin).toHaveBeenNthCalledWith(
        2,
        'h1',
        DateUtil.addDays(threeDaysAgo, 2),
        'skipped_forgiven',
      );
      expect(repository.upsertCheckin).toHaveBeenNthCalledWith(
        3,
        'h1',
        todayStr,
        'done',
        undefined,
      );
    });
  });
});
