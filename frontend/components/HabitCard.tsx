'use client';

import { unlockedMilestone } from '@/lib/achievements';

const ICON_STYLES = [
  { bg: 'bg-accent-lavender', text: 'text-accent-lavender-text', icon: 'auto_stories' },
  { bg: 'bg-accent-mint', text: 'text-accent-mint-text', icon: 'terminal' },
  { bg: 'bg-accent-terracotta', text: 'text-accent-terracotta-text', icon: 'directions_run' },
];

const FREQUENCY_LABEL: Record<string, string> = {
  daily: 'Setiap hari',
  specific_days: 'Hari tertentu',
  weekly_count: 'Beberapa kali/minggu',
};

interface HabitCardProps {
  name: string;
  frequency?: string;
  currentStreak: number;
  skipCountWindow: number;
  checkedInToday: boolean;
  onCheckin: () => void;
  checking?: boolean;
}

/** Non-punitive by design: a missed/forgiven day never shows red or a strikethrough — just a small neutral note. */
export function HabitCard({
  name,
  frequency,
  currentStreak,
  skipCountWindow,
  checkedInToday,
  onCheckin,
  checking,
}: HabitCardProps) {
  const style = ICON_STYLES[name.length % ICON_STYLES.length];
  const badge = unlockedMilestone(currentStreak);

  return (
    <div className="flex items-start justify-between gap-space-sm rounded-2xl bg-surface-card p-space-md shadow-sm transition-all hover:shadow-md sm:gap-space-md">
      <div className="flex min-w-0 flex-1 items-start gap-space-sm sm:gap-space-md">
        <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl sm:h-11 sm:w-11 ${style.bg} ${style.text}`}>
          <span className="material-symbols-outlined text-[20px] sm:text-[22px]">{style.icon}</span>
        </div>
        <div className="flex min-w-0 flex-1 flex-col gap-0.5">
          <div className="flex min-w-0 flex-wrap items-center gap-x-1.5 gap-y-0.5">
            <p className="truncate font-label-lg text-label-lg font-bold text-text-primary">{name}</p>
            {badge && (
              <span
                title={`Pencapaian: ${badge.label}`}
                className="flex shrink-0 items-center gap-0.5 rounded-full bg-accent-lime px-1.5 py-0.5 font-label-sm text-[10px] font-bold text-text-primary"
              >
                <span className="material-symbols-outlined text-[12px]">{badge.icon}</span>
                {badge.days}
              </span>
            )}
          </div>
          <div className="flex flex-wrap items-center gap-x-2 gap-y-1 font-caption text-caption text-text-secondary">
            {frequency && (
              <span className="whitespace-nowrap">{FREQUENCY_LABEL[frequency] ?? frequency}</span>
            )}
            {currentStreak > 0 && (
              <span className="flex shrink-0 items-center gap-0.5 whitespace-nowrap font-semibold text-accent-terracotta-text">
                <span className="material-symbols-outlined text-[14px]">local_fire_department</span>
                {currentStreak} streak
              </span>
            )}
            {skipCountWindow > 0 && (
              <span className="whitespace-nowrap text-text-muted">{skipCountWindow} rest hari ini</span>
            )}
          </div>
        </div>
      </div>
      <button
        onClick={onCheckin}
        disabled={checkedInToday || checking}
        title={checkedInToday ? 'Selesai hari ini' : 'Tandai selesai'}
        aria-label={checkedInToday ? 'Selesai hari ini' : 'Tandai selesai'}
        className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full shadow-sm transition-transform ${
          checkedInToday
            ? 'bg-accent-mint text-accent-mint-text'
            : 'bg-accent-lime text-text-primary hover:scale-105 disabled:opacity-50'
        }`}
      >
        <span className="material-symbols-outlined text-[20px] font-bold" aria-hidden="true">
          {checking ? 'progress_activity' : checkedInToday ? 'done_all' : 'check'}
        </span>
      </button>
    </div>
  );
}
