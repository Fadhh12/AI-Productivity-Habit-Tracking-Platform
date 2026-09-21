import { Reveal } from './Reveal';

const FREE = [
  'Habit, streak, goals, dan log aktivitas',
  'Pengingat, mode offline, dan lencana',
  'Coach AI, 5 pesan per hari',
  'Fitur AI lain, 10 kali per hari',
  'Ekspor laporan CSV',
];

const PLUS = [
  'Coach dan fitur AI jauh lebih longgar',
  'Digest AI bulanan dan deteksi pola',
  'Insight proaktif lengkap',
  'Tantangan mingguan personal dari AI',
  'Ekspor laporan PDF',
  'Sinkron Google Calendar otomatis',
];

function Item({ text, accent }: { text: string; accent?: boolean }) {
  return (
    <li className="flex items-start gap-3 text-[15px] leading-snug text-white/80">
      <span
        className={`material-symbols-outlined mt-px text-[20px] ${accent ? 'text-accent-lime' : 'text-white/45'}`}
        aria-hidden="true"
      >
        check
      </span>
      {text}
    </li>
  );
}

export function Plans() {
  return (
    <section id="paket" className="scroll-mt-24 px-5 pb-24 md:pb-32">
      <div className="mx-auto max-w-6xl">
        <Reveal className="max-w-2xl">
          <h2 className="text-[34px] font-bold leading-[1.05] tracking-tighter text-white sm:text-5xl">
            Gratis untuk dipakai setiap hari.
          </h2>
          <p className="mt-5 max-w-[52ch] text-[16px] leading-relaxed text-white/65">
            Semua fitur inti gratis selamanya. Plus menambah AI yang lebih dalam untuk yang butuh lebih.
          </p>
        </Reveal>

        <div className="mt-12 grid grid-cols-1 gap-4 lg:grid-cols-12">
          <Reveal className="lg:col-span-5">
            <div className="flex h-full flex-col rounded-[28px] bg-white/[0.04] p-6 ring-1 ring-white/10 sm:p-8">
              <h3 className="text-[22px] font-bold tracking-tight text-white">Gratis</h3>
              <p className="mt-1 text-[15px] text-white/55">Rp0, tanpa kartu kredit.</p>
              <ul className="mt-8 flex flex-col gap-4">
                {FREE.map((t) => (
                  <Item key={t} text={t} />
                ))}
              </ul>
            </div>
          </Reveal>

          <Reveal delay={100} className="lg:col-span-7">
            <div className="relative flex h-full flex-col overflow-hidden rounded-[28px] bg-[linear-gradient(150deg,rgba(204,255,0,0.16),rgba(204,255,0,0.04)_60%,transparent)] p-6 ring-1 ring-accent-lime/40 sm:p-8">
              <div className="flex items-center justify-between gap-4">
                <h3 className="text-[22px] font-bold tracking-tight text-white">Continuum Plus</h3>
                <span className="rounded-full bg-accent-lime px-3 py-1 text-[12px] font-bold text-sidebar-dark">
                  Segera hadir
                </span>
              </div>
              <p className="mt-1 text-[15px] text-white/55">
                Berlangganan tersedia lewat Google Play saat aplikasi Android dirilis.
              </p>
              <ul className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2">
                {PLUS.map((t) => (
                  <Item key={t} text={t} accent />
                ))}
              </ul>
            </div>
          </Reveal>
        </div>
      </div>
    </section>
  );
}
