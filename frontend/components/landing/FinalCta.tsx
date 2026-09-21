import { AuthCtas } from './AuthCtas';
import { Reveal } from './Reveal';

export function FinalCta() {
  return (
    <section className="px-5 pb-24 md:pb-32">
      <Reveal className="mx-auto max-w-6xl">
        <div className="relative overflow-hidden rounded-[36px] bg-[#16171D] px-6 py-16 text-center ring-1 ring-accent-lime/30 sm:px-12 sm:py-24">
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 bg-[radial-gradient(50%_70%_at_50%_0%,rgba(204,255,0,0.16),transparent_70%)]"
          />
          <div className="relative flex flex-col items-center gap-8">
            <h2 className="max-w-[18ch] text-[36px] font-bold leading-[1.05] tracking-tighter text-white sm:text-6xl">
              Mulai dengan satu habit hari ini.
            </h2>
            <p className="max-w-[44ch] text-[16px] leading-relaxed text-white/65">
              Gratis, tanpa kartu kredit. Kalau besok terlewat, kamu tinggal lanjut.
            </p>
            <AuthCtas className="flex-wrap justify-center" />
          </div>
        </div>
      </Reveal>
    </section>
  );
}
