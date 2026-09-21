import { Reveal } from './Reveal';

const STEPS = [
  {
    icon: 'flag',
    title: 'Pilih satu habit kecil',
    body: 'Mulai dari yang paling ringan, misalnya baca 20 menit atau jalan pagi.',
  },
  {
    icon: 'check_circle',
    title: 'Centang setiap hari',
    body: 'Satu ketukan cukup. Kalau hari itu terlewat, tandai istirahat dan streak tetap aman.',
  },
  {
    icon: 'insights',
    title: 'Lihat polanya',
    body: 'Laporan dan AI coach menunjukkan kapan kamu paling konsisten dan apa yang bisa diatur ulang.',
  },
];

/** Left column holds the heading and stays put on desktop while the steps scroll past. */
export function HowItWorks() {
  return (
    <section id="cara-kerja" className="scroll-mt-24 px-5 pb-24 md:pb-32">
      <div className="mx-auto grid max-w-6xl grid-cols-1 gap-12 lg:grid-cols-[0.8fr_1.2fr] lg:gap-20">
        <Reveal className="lg:sticky lg:top-32 lg:self-start">
          <h2 className="text-[34px] font-bold leading-[1.05] tracking-tighter text-white sm:text-5xl">
            Mulai dalam dua menit.
          </h2>
          <p className="mt-5 max-w-[40ch] text-[16px] leading-relaxed text-white/65">
            Tanpa pengaturan rumit. Daftar, pilih habit pertama, lalu centang.
          </p>
        </Reveal>

        <ol className="relative flex flex-col gap-10">
          <span
            aria-hidden="true"
            className="absolute bottom-8 left-[27px] top-8 w-px bg-gradient-to-b from-accent-lime/60 via-white/15 to-transparent"
          />
          {STEPS.map((s, i) => (
            <Reveal as="li" key={s.title} delay={i * 90} className="relative flex gap-5">
              <span className="relative z-10 flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-[#1B1D26] ring-1 ring-accent-lime/40">
                <span className="material-symbols-outlined text-[26px] text-accent-lime" aria-hidden="true">
                  {s.icon}
                </span>
              </span>
              <div className="pt-1.5">
                <h3 className="text-[22px] font-bold tracking-tight text-white">{s.title}</h3>
                <p className="mt-2 max-w-[46ch] text-[15px] leading-relaxed text-white/60">{s.body}</p>
              </div>
            </Reveal>
          ))}
        </ol>
      </div>
    </section>
  );
}
