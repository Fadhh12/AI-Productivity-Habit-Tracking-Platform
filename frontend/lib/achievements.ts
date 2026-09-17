export interface Milestone {
  days: number;
  label: string;
  icon: string;
}

/** Streak-length rewards. Purely derived from `Habit.currentStreak` — no backend storage needed. */
export const STREAK_MILESTONES: Milestone[] = [
  { days: 3, label: 'Momentum Awal', icon: 'bolt' },
  { days: 7, label: 'Seminggu Penuh', icon: 'local_fire_department' },
  { days: 14, label: 'Dua Minggu Konsisten', icon: 'military_tech' },
  { days: 30, label: 'Sebulan Solid', icon: 'workspace_premium' },
  { days: 60, label: 'Dua Bulan Kuat', icon: 'emoji_events' },
  { days: 100, label: 'Seratus Hari', icon: 'stars' },
  { days: 180, label: 'Setengah Tahun', icon: 'auto_awesome' },
  { days: 365, label: 'Satu Tahun Legend', icon: 'diamond' },
];

/** The highest milestone a streak has already reached, or null if below the first one. */
export function unlockedMilestone(streak: number): Milestone | null {
  let unlocked: Milestone | null = null;
  for (const m of STREAK_MILESTONES) {
    if (streak >= m.days) unlocked = m;
  }
  return unlocked;
}

/** The next milestone still ahead of this streak, or null if every milestone is already unlocked. */
export function nextMilestone(streak: number): Milestone | null {
  return STREAK_MILESTONES.find((m) => streak < m.days) ?? null;
}
