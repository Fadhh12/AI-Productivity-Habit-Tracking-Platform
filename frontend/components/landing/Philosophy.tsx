import { Reveal } from './Reveal';

const WEEK = [
  { day: 'Sen', state: 'done' },
  { day: 'Sel', state: 'done' },
  { day: 'Rab', state: 'rest' },
  { day: 'Kam', state: 'done' },
  { day: 'Jum', state: 'done' },
  { day: 'Sab', state: 'done' },
  { day: 'Min', state: 'done' },
] as const;

export function Philosophy() {
  return (
    <section id="filosofi" className="scroll-mt-24 px-5 py-24 md:py-32">
      <div className="mx-auto max-w-6xl">
        <Reveal className="max-w-3xl">
          <h2 className="text-[34px] font-bold leading-[1.05] tracking-tighter text-white sm:text-5xl">
            Bolos sehari bukan akhir dunia.
          </h2>
          <p className="mt-5 max-w-[56ch] text-[16px] leading-relaxed text-white/65">
            Banyak aplikasi menghukummu dengan angka merah dan streak yang hangus. Continuum memakai warna netral dan
            memberi ruang untuk istirahat.
          </p>
        </Reveal>

        <div className="mt-12 grid grid-cols-1 gap-4 md:grid-cols-12">
          <Reveal className="md:col-span-7">
            <div className="relative h-full overflow-hidden rounded-[28px] bg-[linear-gradient(140deg,rgba(204,255,0,0.16),rgba(204,255,0,0.03)_55%,transparent)] p-6 ring-1 ring-accent-lime/25 sm:p-8">
              <p className="text-[13px] font-semibold text-accent-lime">Di Continuum</p>
              <p className="mt-2 text-[26px] font-bold leading-tight tracking-tight text-white sm:text-[30px]">
                Hari istirahat tercatat. Streak tetap aman.
              </p>
              <ul className="mt-8 flex items-end justify-between gap-2" aria-label="Contoh satu minggu dengan satu hari istirahat">
                {WEEK.map((d) => (
                  <li key={d.day} className="flex flex-1 flex-col items-center gap-2">
                    <span
                      className={`flex h-11 w-full max-w-12 items-center justify-center rounded-2xl sm:h-14 ${
                        d.state === 'done' ? 'bg-accent-lime text-sidebar-dark' : 'bg-white/10 text-white/60'
                      }`}
                    >
                      <span className="material-symbols-outlined text-[20px]" aria-hidden="true">
                        {d.state === 'done' ? 'check' : 'bedtime'}
                      </span>
                    </span>
                    <span className="text-[12px] font-medium text-white/55">{d.day}</span>
                  </li>
                ))}
              </ul>
            </div>
          </Reveal>

          <div className="flex flex-col gap-4 md:col-span-5">
            <Reveal delay={100}>
              <div className="rounded-[28px] bg-white/[0.04] p-6 ring-1 ring-white/10 sm:p-7">
                <p className="text-[13px] font-semibold text-white/50">Aplikasi biasa</p>
                <p className="mt-2 text-[20px] font-bold leading-snug tracking-tight text-white/70">
                  Streak hangus. Mulai lagi dari hari ke-1.
                </p>
              </div>
            </Reveal>
            <Reveal delay={200} className="flex-1">
              <div className="flex h-full flex-col justify-between gap-6 rounded-[28px] bg-white/[0.04] p-6 ring-1 ring-white/10 sm:p-7">
                <p className="text-[20px] font-bold leading-snug tracking-tight text-white">
                  Maksimal 5 habit aktif sekaligus.
                </p>
                <p className="text-[15px] leading-relaxed text-white/60">
                  Sedikit tapi benar-benar dijalani lebih baik daripada daftar panjang yang bikin lelah.
                </p>
              </div>
            </Reveal>
          </div>
        </div>
      </div>
    </section>
  );
}
