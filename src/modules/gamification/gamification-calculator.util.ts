export interface GamificationStats {
  doneCheckins: number;
  activitiesLogged: number;
  reflectionsAnswered: number;
  goalsCompleted: number;
  forgivenRestDays: number;
  goalLinkedHabits: number;
  longestStreak: number;
}

export type BadgeMetric = keyof GamificationStats;

export interface BadgeDefinition {
  id: string;
  label: string;
  description: string;
  icon: string;
  metric: BadgeMetric;
  target: number;
}

export interface BadgeState extends BadgeDefinition {
  progress: number;
  unlocked: boolean;
}

export interface LevelInfo {
  level: number;
  xp: number;
  xpIntoLevel: number;
  xpForNextLevel: number;
}

const XP_PER = { checkin: 10, activity: 5, reflection: 15, goal: 100 } as const;

export const BADGES: BadgeDefinition[] = [
  { id: 'first-step', label: 'Langkah Pertama', description: 'Centang habit pertamamu', icon: 'flag', metric: 'doneCheckins', target: 1 },
  { id: 'checkin-25', label: 'Mulai Terbiasa', description: '25 checkin habit', icon: 'check_circle', metric: 'doneCheckins', target: 25 },
  { id: 'checkin-100', label: 'Konsisten', description: '100 checkin habit', icon: 'workspace_premium', metric: 'doneCheckins', target: 100 },
  { id: 'streak-7', label: 'Seminggu Penuh', description: 'Streak 7 hari di satu habit', icon: 'local_fire_department', metric: 'longestStreak', target: 7 },
  { id: 'streak-30', label: 'Sebulan Solid', description: 'Streak 30 hari di satu habit', icon: 'emoji_events', metric: 'longestStreak', target: 30 },
  { id: 'logger-10', label: 'Pencatat Rajin', description: 'Catat 10 aktivitas', icon: 'history_toggle_off', metric: 'activitiesLogged', target: 10 },
  { id: 'logger-100', label: 'Arsip Hidup', description: 'Catat 100 aktivitas', icon: 'inventory_2', metric: 'activitiesLogged', target: 100 },
  { id: 'reflect-1', label: 'Berhenti Sejenak', description: 'Jawab refleksi harian pertamamu', icon: 'self_improvement', metric: 'reflectionsAnswered', target: 1 },
  { id: 'reflect-14', label: 'Penulis Refleksi', description: '14 refleksi harian', icon: 'edit_note', metric: 'reflectionsAnswered', target: 14 },
  { id: 'connected', label: 'Terhubung ke Tujuan', description: 'Kaitkan habit ke sebuah goal', icon: 'link', metric: 'goalLinkedHabits', target: 1 },
  { id: 'rest-wise', label: 'Istirahat Bijak', description: 'Pakai hari toleransi tanpa memutus streak', icon: 'nature_people', metric: 'forgivenRestDays', target: 1 },
  { id: 'goal-done', label: 'Tujuan Tercapai', description: 'Selesaikan sebuah goal', icon: 'stars', metric: 'goalsCompleted', target: 1 },
];

export class GamificationCalculator {
  static xp(stats: GamificationStats): number {
    return (
      stats.doneCheckins * XP_PER.checkin +
      stats.activitiesLogged * XP_PER.activity +
      stats.reflectionsAnswered * XP_PER.reflection +
      stats.goalsCompleted * XP_PER.goal
    );
  }

  /** Level n starts at 100*(n-1)^2 XP, so early levels come fast and later ones stretch out. */
  static level(xp: number): LevelInfo {
    const level = Math.floor(Math.sqrt(xp / 100)) + 1;
    const levelStart = 100 * (level - 1) ** 2;
    const nextStart = 100 * level ** 2;
    return { level, xp, xpIntoLevel: xp - levelStart, xpForNextLevel: nextStart - levelStart };
  }

  static badges(stats: GamificationStats): BadgeState[] {
    return BADGES.map((b) => ({
      ...b,
      progress: Math.min(stats[b.metric], b.target),
      unlocked: stats[b.metric] >= b.target,
    }));
  }
}
