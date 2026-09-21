'use client';

import { Mascot } from '@/components/Mascot';
import { setCompanionEnabled, useCompanionEnabled } from '@/lib/companion';

/** Settings card that switches the floating mascot companion on or off. */
export function CompanionSetting() {
  const enabled = useCompanionEnabled();
  const on = enabled ?? true;

  return (
    <section className="flex items-center gap-space-md rounded-2xl bg-surface-card p-space-md shadow-soft sm:p-space-lg">
      <Mascot mood={on ? 'happy' : 'sleepy'} follow={on} className="force-light w-16 shrink-0 sm:w-20" />
      <div className="min-w-0 flex-1">
        <h2 className="font-headline-sm text-headline-sm font-bold text-text-primary">Teman maskot Conti</h2>
        <p className="mt-0.5 font-body-sm text-body-sm text-text-secondary">
          Conti menemanimu di setiap halaman: menyemangati saat kamu centang habit, menunggu saat AI berpikir, dan tidur kalau kamu lama tidak di sini.
        </p>
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={on}
        aria-label="Tampilkan teman maskot"
        onClick={() => setCompanionEnabled(!on)}
        className={`press relative h-8 w-14 shrink-0 rounded-full transition-colors duration-300 ${on ? 'bg-accent-lime' : 'bg-surface-container-high'}`}
      >
        <span
          className={`absolute left-1 top-1 h-6 w-6 rounded-full bg-white shadow transition-transform duration-500 ease-spring ${on ? 'translate-x-6' : 'translate-x-0'}`}
        />
      </button>
    </section>
  );
}
