'use client';

import { useState } from 'react';
import { HabitCard } from '@/components/HabitCard';

const INITIAL = [
  { name: 'Baca buku', frequency: 'daily', streak: 12 },
  { name: 'Olahraga', frequency: 'specific_days', streak: 5 },
  { name: 'Coding harian', frequency: 'daily', streak: 21 },
];

/**
 * A phone frame holding the real HabitCard component. Tapping the check button plays the same
 * celebration users get in the app, so visitors can try the core interaction before signing up.
 */
export function PhoneMock() {
  const [done, setDone] = useState<Set<number>>(new Set());
  const total = INITIAL.length;
  const progress = done.size / total;

  return (
    <div className="relative mx-auto w-full max-w-[330px]">
      <div className="absolute -left-32 top-[42%] z-10 hidden animate-float items-center gap-2 rounded-full bg-[#1E2029] px-3.5 py-2 text-[13px] font-semibold text-white shadow-[0_18px_36px_-12px_rgba(0,0,0,0.6)] ring-1 ring-white/10 lg:flex">
        <span className="material-symbols-outlined animate-flame text-[18px] text-accent-lime" aria-hidden="true">
          local_fire_department
        </span>
        Streak 21 hari
      </div>
      <div
        className="absolute -right-10 bottom-10 z-10 hidden animate-float items-center gap-2 rounded-full bg-accent-lime px-3.5 py-2 text-[13px] font-bold text-sidebar-dark shadow-[0_18px_36px_-12px_rgba(0,0,0,0.6)] lg:flex"
        style={{ animationDelay: '1.4s' }}
      >
        <span className="material-symbols-outlined text-[18px]" aria-hidden="true">
          workspace_premium
        </span>
        Level 4
      </div>

      <div className="rounded-[46px] bg-[#23252F] p-2.5 shadow-[0_40px_80px_-24px_rgba(0,0,0,0.8),inset_0_1px_0_rgba(255,255,255,0.12)] ring-1 ring-white/10">
        <div className="overflow-hidden rounded-[38px] bg-canvas-bg">
          <div className="mx-auto mt-2.5 h-5 w-24 rounded-full bg-sidebar-dark" aria-hidden="true" />
          <div className="flex flex-col gap-4 px-4 pb-6 pt-4">
            <div>
              <p className="text-[12px] font-medium text-text-secondary">Senin, hari ini</p>
              <p className="text-[22px] font-bold leading-tight tracking-tight text-text-primary">Habit aktif</p>
            </div>
            <div className="flex items-center gap-2" aria-label={`${done.size} dari ${total} habit selesai`}>
              <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-surface-container">
                <div
                  className="h-full origin-left rounded-full bg-accent-lime transition-transform duration-700 ease-spring"
                  style={{ transform: `scaleX(${progress})` }}
                />
              </div>
              <span className="tabular text-[12px] font-semibold text-text-secondary">
                {done.size}/{total}
              </span>
            </div>
            <div className="flex flex-col gap-3">
              {INITIAL.map((h, i) => (
                <HabitCard
                  key={h.name}
                  name={h.name}
                  frequency={h.frequency}
                  currentStreak={h.streak + (done.has(i) ? 1 : 0)}
                  skipCountWindow={0}
                  checkedInToday={done.has(i)}
                  onCheckin={() => setDone((prev) => new Set(prev).add(i))}
                />
              ))}
            </div>
            <p className="text-center text-[12px] text-text-secondary">
              {done.size === total ? 'Semua selesai. Istirahat yang cukup ya.' : 'Coba ketuk tombol centang.'}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
