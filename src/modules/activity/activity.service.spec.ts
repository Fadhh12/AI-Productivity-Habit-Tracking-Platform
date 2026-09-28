import { BadRequestException, NotFoundException } from '@nestjs/common';
import { ActivityService } from './activity.service';
import { ActivityRepository } from './activity.repository';

describe('ActivityService', () => {
  let repository: jest.Mocked<ActivityRepository>;
  let service: ActivityService;

  beforeEach(() => {
    repository = {
      findAll: jest.fn(),
      findAllForDate: jest.fn(),
      findStartingBetween: jest.fn(),
      findById: jest.fn(),
      findOverlapping: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    } as unknown as jest.Mocked<ActivityRepository>;

    service = new ActivityService(repository);
  });

  describe('create', () => {
    it('rejects an endTime that is not after startTime', async () => {
      await expect(
        service.create('u1', {
          title: 'Kerja',
          startTime: '2026-01-01T10:00:00.000Z',
          endTime: '2026-01-01T09:00:00.000Z',
        } as never),
      ).rejects.toThrow(BadRequestException);
      expect(repository.create).not.toHaveBeenCalled();
    });

    it('creates without warnings when there is no category (nothing to overlap against)', async () => {
      repository.create.mockResolvedValue({ id: 'a1' } as never);

      const result = await service.create('u1', {
        title: 'Kerja',
        startTime: '2026-01-01T09:00:00.000Z',
        endTime: '2026-01-01T10:00:00.000Z',
      } as never);

      expect(repository.findOverlapping).not.toHaveBeenCalled();
      expect(result).toEqual({ data: { id: 'a1' }, warnings: [] });
    });

    it('warns, but still saves, when the new entry overlaps another in the same category', async () => {
      repository.findOverlapping.mockResolvedValue([
        {
          startTime: new Date('2026-01-01T09:30:00.000Z'),
          endTime: new Date('2026-01-01T10:30:00.000Z'),
        },
      ] as never);
      repository.create.mockResolvedValue({ id: 'a1' } as never);

      const result = await service.create('u1', {
        title: 'Kerja',
        categoryId: 'c1',
        startTime: '2026-01-01T09:00:00.000Z',
        endTime: '2026-01-01T10:00:00.000Z',
      } as never);

      expect(repository.create).toHaveBeenCalled();
      expect(result.warnings).toHaveLength(1);
    });

    it('reports no warning when the category has no time overlap', async () => {
      repository.findOverlapping.mockResolvedValue([]);
      repository.create.mockResolvedValue({ id: 'a1' } as never);

      const result = await service.create('u1', {
        title: 'Kerja',
        categoryId: 'c1',
        startTime: '2026-01-01T09:00:00.000Z',
        endTime: '2026-01-01T10:00:00.000Z',
      } as never);

      expect(result.warnings).toEqual([]);
    });
  });

  describe('update', () => {
    it('throws NotFoundException when the activity does not belong to the caller', async () => {
      repository.findById.mockResolvedValue(null);
      await expect(service.update('u1', 'missing', { title: 'x' } as never)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('rejects an update that would make endTime precede startTime', async () => {
      repository.findById.mockResolvedValue({
        id: 'a1',
        title: 'Kerja',
        categoryId: null,
        startTime: new Date('2026-01-01T09:00:00.000Z'),
        endTime: new Date('2026-01-01T10:00:00.000Z'),
        note: null,
      } as never);

      await expect(
        service.update('u1', 'a1', { endTime: '2026-01-01T08:00:00.000Z' } as never),
      ).rejects.toThrow(BadRequestException);
    });

    it('excludes the activity itself from its own overlap check', async () => {
      repository.findById.mockResolvedValue({
        id: 'a1',
        title: 'Kerja',
        categoryId: 'c1',
        startTime: new Date('2026-01-01T09:00:00.000Z'),
        endTime: new Date('2026-01-01T10:00:00.000Z'),
        note: null,
      } as never);
      repository.findOverlapping.mockResolvedValue([]);
      repository.update.mockResolvedValue({ id: 'a1' } as never);

      await service.update('u1', 'a1', { title: 'Kerja lembur' } as never);

      expect(repository.findOverlapping).toHaveBeenCalledWith(
        'u1',
        'c1',
        new Date('2026-01-01T09:00:00.000Z'),
        new Date('2026-01-01T10:00:00.000Z'),
        'a1',
      );
    });
  });

  describe('remove', () => {
    it('deletes only after confirming ownership', async () => {
      repository.findById.mockResolvedValue({ id: 'a1' } as never);
      const result = await service.remove('u1', 'a1');
      expect(repository.delete).toHaveBeenCalledWith('a1');
      expect(result).toEqual({ success: true });
    });
  });
});
