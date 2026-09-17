'use client';

interface HabitCardProps {
  name: string;
  currentStreak: number;
  skipCountWindow: number;
  checkedInToday: boolean;
  onCheckin: () => void;
  checking?: boolean;
}

/** Non-punitive by design: a missed/forgiven day never shows red or a strikethrough — just a small neutral note. */
export function HabitCard({ name, currentStreak, skipCountWindow, checkedInToday, onCheckin, checking }: HabitCardProps) {
  return (
    <div className="flex items-center justify-between rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
      <div>
        <p className="font-medium text-gray-900">{name}</p>
        <p className="mt-0.5 text-xs text-gray-500">
          🔥 {currentStreak} hari beruntun
          {skipCountWindow > 0 && <span className="ml-2 text-gray-400">· {skipCountWindow} skip minggu ini</span>}
        </p>
      </div>
      <button
        onClick={onCheckin}
        disabled={checkedInToday || checking}
        className={`shrink-0 rounded-full px-4 py-2 text-sm font-medium transition ${
          checkedInToday
            ? 'bg-brand-100 text-brand-700'
            : 'bg-brand-600 text-white hover:bg-brand-700 disabled:opacity-50'
        }`}
      >
        {checkedInToday ? '✓ Selesai' : checking ? '...' : 'Centang'}
      </button>
    </div>
  );
}
