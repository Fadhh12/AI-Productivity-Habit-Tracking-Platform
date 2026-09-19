export interface Category {
  id: string;
  name: string;
  color: string;
  active: boolean;
}

export interface Activity {
  id: string;
  title: string;
  startTime: string;
  endTime: string;
  note: string | null;
  categoryId: string | null;
  category: Category | null;
}

export interface HabitCheckin {
  id: string;
  habitId: string;
  checkinDate: string;
  status: 'done' | 'missed' | 'skipped_forgiven';
  note: string | null;
}

export interface Habit {
  id: string;
  name: string;
  frequency: string;
  currentStreak: number;
  skipCountWindow: number;
  active: boolean;
  goalId: string | null;
  checkins?: HabitCheckin[];
}

export interface Notification {
  id: string;
  type: string;
  message: string;
  read: boolean;
  createdAt: string;
}

export interface Goal {
  id: string;
  title: string;
  horizon: 'yearly' | 'monthly';
  parentGoalId: string | null;
  targetDate: string | null;
  status: string;
}

export interface GoalBreakdown extends Goal {
  habits: Habit[];
  childGoals: Array<Goal & { habits: Habit[] }>;
}

export interface QuickAddDraft {
  title: string;
  category_guess: string | null;
  start_time: string;
  end_time: string;
  ai_available: boolean;
  fallback: boolean;
  is_ai_generated: boolean;
}

export interface DailyReflection {
  date: string;
  prompt: string;
  responseText: string | null;
  ai_available: boolean;
  fallback: boolean;
  is_ai_generated: boolean;
}

export interface PatternDetection {
  patterns: string[];
  ai_available: boolean;
  fallback: boolean;
  is_ai_generated: boolean;
}

export interface MonthlyReport {
  available: boolean;
  message?: string;
  data?: {
    month: string;
    generatedAt: string;
    categoryDistributionMinutes: Record<string, number>;
    checkinStatusCounts: Record<string, number>;
    habitStreakTrend: Array<{ habitId: string; name: string; currentStreak: number }>;
    goalProgress: Array<{ goalId: string; goalTitle: string; doneCount: number; habitCount: number }>;
  };
}

export interface GamificationBadge {
  id: string;
  label: string;
  description: string;
  icon: string;
  target: number;
  progress: number;
  unlocked: boolean;
}

export interface GamificationSummary {
  level: number;
  xp: number;
  xpIntoLevel: number;
  xpForNextLevel: number;
  badges: GamificationBadge[];
}
