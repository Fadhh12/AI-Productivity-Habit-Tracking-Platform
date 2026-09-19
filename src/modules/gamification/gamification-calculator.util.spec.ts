import { GamificationCalculator, GamificationStats } from './gamification-calculator.util';

const empty: GamificationStats = {
  doneCheckins: 0,
  activitiesLogged: 0,
  reflectionsAnswered: 0,
  goalsCompleted: 0,
  forgivenRestDays: 0,
  goalLinkedHabits: 0,
  longestStreak: 0,
};

describe('GamificationCalculator', () => {
  it('computes xp from weighted activity', () => {
    expect(
      GamificationCalculator.xp({ ...empty, doneCheckins: 2, activitiesLogged: 2, reflectionsAnswered: 1, goalsCompleted: 1 }),
    ).toBe(20 + 10 + 15 + 100);
  });

  it('starts at level 1 with 0 xp', () => {
    expect(GamificationCalculator.level(0)).toEqual({ level: 1, xp: 0, xpIntoLevel: 0, xpForNextLevel: 100 });
  });

  it('levels up at 100 xp and tracks progress inside the level', () => {
    const info = GamificationCalculator.level(150);
    expect(info.level).toBe(2);
    expect(info.xpIntoLevel).toBe(50);
    expect(info.xpForNextLevel).toBe(300);
  });

  it('unlocks a badge exactly at its target and caps progress', () => {
    const badges = GamificationCalculator.badges({ ...empty, longestStreak: 9 });
    const streak7 = badges.find((b) => b.id === 'streak-7')!;
    expect(streak7.unlocked).toBe(true);
    expect(streak7.progress).toBe(7);
    expect(badges.find((b) => b.id === 'streak-30')!.unlocked).toBe(false);
  });
});
