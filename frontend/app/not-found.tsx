import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="force-light relative flex min-h-[100dvh] flex-col items-center justify-center overflow-hidden bg-[#0F1015] px-6 text-center text-white">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(50%_40%_at_50%_30%,rgba(204,255,0,0.12),transparent_70%)]"
      />
      <div className="relative flex flex-col items-center gap-6">
        <span className="animate-float flex h-16 w-16 items-center justify-center rounded-full bg-accent-lime text-[28px] font-bold text-sidebar-dark">
          C
        </span>
        <h1 className="text-[40px] font-bold leading-tight tracking-tighter sm:text-6xl">Halaman ini tidak ada.</h1>
        <p className="max-w-[40ch] text-[16px] leading-relaxed text-white/65">
          Alamatnya mungkin salah atau halamannya sudah dipindah. Streak-mu aman, kok.
        </p>
        <Link
          href="/"
          className="press group inline-flex items-center gap-2.5 rounded-full bg-accent-lime py-3.5 pl-6 pr-2 text-[15px] font-bold text-sidebar-dark hover:bg-accent-lime-dim"
        >
          Kembali ke beranda
          <span className="flex h-9 w-9 items-center justify-center rounded-full bg-sidebar-dark text-accent-lime transition-transform duration-500 ease-spring group-hover:-translate-x-0.5">
            <span className="material-symbols-outlined text-[20px]" aria-hidden="true">
              home
            </span>
          </span>
        </Link>
      </div>
    </div>
  );
}
