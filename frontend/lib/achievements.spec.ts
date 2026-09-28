import { describe, expect, it } from 'vitest';
import { unlockedMilestone, nextMilestone, STREAK_MILESTONES } from './achievements';

describe('unlockedMilestone', () => {
  it('returns null below the first milestone', () => {
    expect(unlockedMilestone(0)).toBeNull();
    expect(unlockedMilestone(2)).toBeNull();
  });

  it('returns the exact milestone when the streak matches it precisely', () => {
    expect(unlockedMilestone(7)?.label).toBe('Seminggu Penuh');
  });

  it('returns the highest milestone reached, not the first one crossed', () => {
    expect(unlockedMilestone(45)?.label).toBe('Sebulan Solid');
  });

  it('returns the final milestone once the streak exceeds every threshold', () => {
    expect(unlockedMilestone(1000)?.label).toBe('Satu Tahun Legend');
  });
});

describe('nextMilestone', () => {
  it('returns the first milestone when nothing is unlocked yet', () => {
    expect(nextMilestone(0)?.days).toBe(3);
  });

  it('returns the very next threshold above the current streak', () => {
    expect(nextMilestone(10)?.days).toBe(14);
  });

  it('returns null once every milestone has been reached', () => {
    const last = STREAK_MILESTONES[STREAK_MILESTONES.length - 1];
    expect(nextMilestone(last.days)).toBeNull();
  });
});
