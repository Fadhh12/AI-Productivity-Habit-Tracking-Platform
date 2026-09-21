'use client';

import { useEffect, useState } from 'react';
import { Mascot, MascotMood } from '@/components/Mascot';
import { useMascotReaction } from '@/lib/mascot';

interface WelcomePosterProps {
  name: string;
  done: number;
  total: number;
  capacity: number;
  activities: number;
}

function greetingFor(hour: number) {
  if (hour < 11) return 'Selamat pagi';
  if (hour < 15) return 'Selamat siang';
  if (hour < 19) return 'Selamat sore';
  return 'Selamat malam';
}

function lineFor(done: number, total: number) {
  if (total === 0) return 'Belum ada habit hari ini. Yuk mulai dari satu yang kecil.';
  if (done === 0) return 'Yuk, satu centang dulu. Sisanya menyusul pelan-pelan.';
  if (done < total) return `${done} dari ${total} habit selesai. Lanjut saja, pelan pun tidak apa-apa.`;
  return 'Semua habit hari ini selesai. Istirahat yang cukup ya.';
}

/**
 * Poster-style hero for the dashboard: the mascot reacts to today's progress and says hello.
 * Uses fixed brand colours (force-light) so it looks the same in light and dark mode.
 */
export function WelcomePoster({ name, done, total, capacity, activities }: WelcomePosterProps) {
  // Time-of-day text depends on the visitor's clock, so it is set after mount to keep server and client HTML equal.
  const [hour, setHour] = useState<number | null>(null);
  useEffect(() => {
    setHour(new Date().getHours());
  }, []);

  const reaction = useMascotReaction();
  const allDone = total > 0 && done === total;
  const restMood: MascotMood = allDone ? 'cheer' : hour !== null && (hour >= 22 || hour < 5) ? 'sleepy' : 'happy';
  const mood: MascotMood = reaction?.mood ?? restMood;
  const shown = name.charAt(0).toUpperCase() + name.slice(1);

  return (
    <section
      aria-label="Sambutan"
      className="force-light relative overflow-hidden rounded-[32px] bg-[linear-gradient(135deg,#6D3BD7_0%,#4B22A8_100%)] p-6 text-white shadow-[0_28px_50px_-24px_rgba(75,34,168,0.7)] sm:p-8"
    >
      <span
        aria-hidden="true"
        className="pointer-events-none absolute -bottom-6 -left-3 select-none whitespace-nowrap text-[104px] font-black leading-none tracking-tighter text-transparent [-webkit-text-stroke:1.5px_rgba(204,255,0,0.16)] sm:text-[168px]"
      >
        continuum
      </span>
      <span aria-hidden="true" className="material-symbols-outlined pointer-events-none absolute right-[42%] top-6 hidden animate-float text-[22px] text-accent-lime sm:block">
        auto_awesome
      </span>
      <span
        aria-hidden="true"
        className="material-symbols-outlined pointer-events-none absolute bottom-10 right-[30%] hidden animate-float text-[16px] text-white/70 sm:block"
        style={{ animationDelay: '1.2s' }}
      >
        star
      </span>

      <div className="relative flex items-center justify-between gap-3">
        <div className="min-w-0 flex-1">
          <p className="text-[13px] font-semibold text-accent-lime">{hour === null ? 'Halo' : greetingFor(hour)}</p>
          <h1 className="mt-1 break-words text-[30px] font-bold leading-[1.05] tracking-tighter sm:text-[42px]">Halo, {shown}</h1>
          <p className="mt-3 max-w-[36ch] text-[14px] leading-relaxed text-white/80 sm:text-[15px]">{lineFor(done, total)}</p>

          <div className="mt-5 flex flex-wrap items-center gap-2">
            <span className="flex items-center gap-2 rounded-full bg-white/15 py-1.5 pl-3 pr-3.5 text-[12px] font-semibold ring-1 ring-white/15">
              <span className="h-1.5 w-10 overflow-hidden rounded-full bg-white/25" aria-hidden="true">
                <span
                  className="block h-full origin-left rounded-full bg-accent-lime transition-transform duration-700 ease-spring"
                  style={{ transform: `scaleX(${total ? done / total : 0})` }}
                />
              </span>
              <span className="tabular">
                {done}/{total} habit
              </span>
            </span>
            <span className="rounded-full bg-white/15 px-3.5 py-1.5 text-[12px] font-semibold ring-1 ring-white/15">
              <span className="tabular">{activities}</span> aktivitas
            </span>
            <span className="hidden rounded-full bg-white/15 px-3.5 py-1.5 text-[12px] font-semibold ring-1 ring-white/15 sm:inline">
              Kapasitas <span className="tabular">{total}/{capacity}</span>
            </span>
          </div>
        </div>

        <div className="relative shrink-0">
          {reaction?.message && (
            <div
              key={`${reaction.message}-${reaction.pulse}`}
              role="status"
              className="absolute -top-2 right-full z-10 mr-1 w-max max-w-[150px] animate-scale-in rounded-2xl rounded-br-md bg-white px-3 py-2 text-[12px] font-semibold leading-snug text-[#16171D] shadow-[0_12px_28px_-10px_rgba(22,23,29,0.5)] sm:max-w-[190px]"
              style={{ transformOrigin: 'bottom right' }}
            >
              {reaction.message}
            </div>
          )}
          <Mascot mood={mood} interactive pulse={reaction?.pulse ?? 0} className="w-[104px] sm:w-[168px]" />
        </div>
      </div>
    </section>
  );
}
