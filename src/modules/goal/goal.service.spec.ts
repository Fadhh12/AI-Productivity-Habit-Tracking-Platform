import { BadRequestException, NotFoundException } from '@nestjs/common';
import { GoalService } from './goal.service';
import { GoalRepository } from './goal.repository';

describe('GoalService', () => {
  let repository: jest.Mocked<GoalRepository>;
  let service: GoalService;

  beforeEach(() => {
    repository = {
      findAll: jest.fn(),
      findById: jest.fn(),
      findBreakdown: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    } as unknown as jest.Mocked<GoalRepository>;

    service = new GoalService(repository);
  });

  describe('create', () => {
    it('creates a yearly goal with no parent', async () => {
      repository.create.mockResolvedValue({ id: 'g1' } as never);

      await service.create('u1', { title: 'Baca 12 buku', horizon: 'yearly' } as never);

      expect(repository.create).toHaveBeenCalledWith('u1', {
        title: 'Baca 12 buku',
        horizon: 'yearly',
        parentGoalId: null,
        targetDate: null,
      });
    });

    it('rejects a yearly goal that names a parent', async () => {
      await expect(
        service.create('u1', {
          title: 'Baca 12 buku',
          horizon: 'yearly',
          parentGoalId: 'g0',
        } as never),
      ).rejects.toThrow(BadRequestException);
      expect(repository.create).not.toHaveBeenCalled();
    });

    it('rejects a monthly goal whose parent does not exist for this user', async () => {
      repository.findById.mockResolvedValue(null);

      await expect(
        service.create('u1', {
          title: 'Baca 1 buku',
          horizon: 'monthly',
          parentGoalId: 'missing',
        } as never),
      ).rejects.toThrow(BadRequestException);
    });

    it('rejects a monthly goal whose parent is itself monthly', async () => {
      repository.findById.mockResolvedValue({ id: 'g0', horizon: 'monthly' } as never);

      await expect(
        service.create('u1', {
          title: 'Baca 1 buku',
          horizon: 'monthly',
          parentGoalId: 'g0',
        } as never),
      ).rejects.toThrow(BadRequestException);
    });

    it('creates a monthly goal linked to a valid yearly parent', async () => {
      repository.findById.mockResolvedValue({ id: 'g0', horizon: 'yearly' } as never);
      repository.create.mockResolvedValue({ id: 'g1' } as never);

      await service.create('u1', {
        title: 'Baca 1 buku',
        horizon: 'monthly',
        parentGoalId: 'g0',
      } as never);

      expect(repository.create).toHaveBeenCalledWith('u1', {
        title: 'Baca 1 buku',
        horizon: 'monthly',
        parentGoalId: 'g0',
        targetDate: null,
      });
    });
  });

  describe('update', () => {
    it('throws NotFoundException when the goal does not belong to the caller', async () => {
      repository.findById.mockResolvedValue(null);
      await expect(service.update('u1', 'missing', { title: 'x' } as never)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('rejects re-parenting a yearly goal under another goal', async () => {
      repository.findById.mockResolvedValue({
        id: 'g1',
        title: 'Old',
        horizon: 'yearly',
        parentGoalId: null,
        targetDate: null,
        status: 'active',
      } as never);

      await expect(service.update('u1', 'g1', { parentGoalId: 'g0' } as never)).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  describe('remove', () => {
    it('soft-unlinks by deleting only the goal row, never habits (DB handles the SET NULL)', async () => {
      repository.findById.mockResolvedValue({ id: 'g1' } as never);
      const result = await service.remove('u1', 'g1');
      expect(repository.delete).toHaveBeenCalledWith('g1');
      expect(result).toEqual({ success: true });
    });
  });
});
