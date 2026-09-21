import { AuthCtas } from './AuthCtas';
import { PhoneMock } from './PhoneMock';
import { Reveal } from './Reveal';

export function Hero() {
  return (
    <section className="relative overflow-hidden">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(60%_50%_at_75%_30%,rgba(204,255,0,0.10),transparent_70%),radial-gradient(40%_40%_at_10%_90%,rgba(204,255,0,0.05),transparent_70%)]"
      />
      <div className="relative mx-auto grid min-h-[100dvh] max-w-6xl grid-cols-1 items-center gap-12 px-5 pb-16 pt-28 md:pt-24 lg:grid-cols-[1.1fr_0.9fr] lg:gap-8">
        <div className="flex flex-col items-start gap-6">
          <Reveal>
            <h1 className="max-w-[14ch] text-[44px] font-bold leading-[1.02] tracking-tighter text-white sm:text-6xl lg:text-[68px]">
              Kebiasaan baik, tanpa rasa bersalah.
            </h1>
          </Reveal>
          <Reveal delay={100}>
            <p className="max-w-[46ch] text-[16px] leading-relaxed text-white/65 sm:text-[17px]">
              Continuum mencatat habit dan aktivitasmu, lalu AI coach membantu tetap konsisten. Bolos sehari bukan
              kegagalan.
            </p>
          </Reveal>
          <Reveal delay={200}>
            <AuthCtas />
          </Reveal>
        </div>
        <Reveal delay={150} className="lg:justify-self-end">
          <PhoneMock />
        </Reveal>
      </div>
    </section>
  );
}
