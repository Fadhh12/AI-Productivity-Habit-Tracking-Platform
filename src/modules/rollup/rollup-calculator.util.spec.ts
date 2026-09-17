import { RollupCalculator } from './rollup-calculator.util';

describe('RollupCalculator', () => {
  it('sums minutes per category, bucketing nulls as Uncategorized', () => {
    const activities = [
      {
        categoryName: 'Kuliah',
        startTime: new Date('2026-01-01T09:00:00Z'),
        endTime: new Date('2026-01-01T10:30:00Z'),
      },
      {
        categoryName: 'Kuliah',
        startTime: new Date('2026-01-01T11:00:00Z'),
        endTime: new Date('2026-01-01T11:30:00Z'),
      },
      {
        categoryName: null,
        startTime: new Date('2026-01-01T12:00:00Z'),
        endTime: new Date('2026-01-01T12:15:00Z'),
      },
    ];
    expect(RollupCalculator.categoryDistributionMinutes(activities)).toEqual({
      Kuliah: 120,
      Uncategorized: 15,
    });
  });

  it('counts checkins by status, defaulting missing statuses to zero', () => {
    const checkins = [
      { habitId: 'h1', status: 'done' },
      { habitId: 'h1', status: 'done' },
      { habitId: 'h2', status: 'missed' },
    ];
    expect(RollupCalculator.checkinStatusCounts(checkins)).toEqual({
      done: 2,
      missed: 1,
      skipped_forgiven: 0,
    });
  });

  it('computes goal progress from habits and their checkins', () => {
    const habits = [
      { id: 'h1', name: 'Baca buku', currentStreak: 3, goalId: 'g1', goalTitle: 'Baca 12 buku' },
      { id: 'h2', name: 'Olahraga', currentStreak: 1, goalId: 'g1', goalTitle: 'Baca 12 buku' },
      { id: 'h3', name: 'Journaling', currentStreak: 0, goalId: null, goalTitle: null },
    ];
    const checkinsByHabitId = new Map([
      [
        'h1',
        [
          { habitId: 'h1', status: 'done' },
          { habitId: 'h1', status: 'missed' },
        ],
      ],
      ['h2', [{ habitId: 'h2', status: 'done' }]],
    ]);
    const result = RollupCalculator.goalProgress(habits, checkinsByHabitId);
    expect(result).toEqual([
      { goalId: 'g1', goalTitle: 'Baca 12 buku', doneCount: 2, habitCount: 2 },
    ]);
  });
});
