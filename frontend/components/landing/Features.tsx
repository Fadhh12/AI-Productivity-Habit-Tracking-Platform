import { Reveal } from './Reveal';

const BADGES = ['local_fire_department', 'bolt', 'military_tech', 'workspace_premium'];

const CELL = 'relative h-full overflow-hidden rounded-[28px] p-6 sm:p-7';

function Icon({ name, className = '' }: { name: string; className?: string }) {
  return (
    <span className={`material-symbols-outlined text-[24px] ${className}`} aria-hidden="true">
      {name}
    </span>
  );
}

/** Bento grid: 7 features, 7 cells. Spans collapse to a single column below md. */
export function Features() {
  return (
    <section id="fitur" className="scroll-mt-24 px-5 pb-24 md:pb-32">
      <div className="mx-auto max-w-6xl">
        <Reveal className="max-w-2xl">
          <h2 className="text-[34px] font-bold leading-[1.05] tracking-tighter text-white sm:text-5xl">
            Satu tempat untuk habit, jadwal, dan refleksi.
          </h2>
        </Reveal>

        <div className="mt-12 grid grid-cols-1 gap-4 md:grid-cols-6">
          {/* 1. AI quick add */}
          <Reveal className="md:col-span-4 md:row-span-2">
            <div className={`${CELL} flex flex-col justify-between gap-10 bg-[linear-gradient(150deg,#CCFF00,#B6E600_70%)] text-sidebar-dark`}>
              <div>
                <Icon name="auto_awesome" />
                <h3 className="mt-4 max-w-[16ch] text-[28px] font-bold leading-[1.05] tracking-tight sm:text-[34px]">
                  Catat aktivitas semudah mengobrol.
                </h3>
                <p className="mt-3 max-w-[44ch] text-[15px] leading-relaxed text-sidebar-dark/75">
                  Ketik seperti pesan biasa. AI mengubahnya jadi jadwal lengkap dengan jam dan kategori, kamu tinggal
                  konfirmasi.
                </p>
              </div>
              <div className="flex flex-col gap-2">
                <p className="w-fit max-w-full rounded-full bg-sidebar-dark px-5 py-3 text-[14px] font-medium text-white">
                  meeting sama dosen jam 2 siang 1 jam
                </p>
                <p className="ml-auto w-fit max-w-full rounded-2xl bg-white/70 px-5 py-3 text-[14px] font-semibold text-sidebar-dark">
                  Meeting dosen, 14.00 sampai 15.00
                </p>
              </div>
            </div>
          </Reveal>

          {/* 2. Coach */}
          <Reveal delay={80} className="md:col-span-2">
            <div className={`${CELL} bg-white/[0.04] ring-1 ring-white/10`}>
              <Icon name="forum" className="text-accent-lime" />
              <h3 className="mt-4 text-[20px] font-bold tracking-tight text-white">Coach yang kenal datamu</h3>
              <p className="mt-2 text-[14px] leading-relaxed text-white/60">
                Tanya kapan saja. Jawabannya berdasar habit dan aktivitasmu sendiri.
              </p>
            </div>
          </Reveal>

          {/* 3. Badges */}
          <Reveal delay={160} className="md:col-span-2">
            <div className={`${CELL} bg-[#1B1D26] ring-1 ring-white/10`}>
              <ul className="flex gap-2" aria-hidden="true">
                {BADGES.map((b, i) => (
                  <li
                    key={b}
                    className={`flex h-10 w-10 items-center justify-center rounded-full ${i < 3 ? 'bg-accent-lime text-sidebar-dark' : 'bg-white/10 text-white/40'}`}
                  >
                    <Icon name={b} className="!text-[20px]" />
                  </li>
                ))}
              </ul>
              <h3 className="mt-4 text-[20px] font-bold tracking-tight text-white">Level dan lencana</h3>
              <p className="mt-2 text-[14px] leading-relaxed text-white/60">
                Setiap centang menambah XP. Lencana terbuka dari streak 3 hari sampai satu tahun.
              </p>
            </div>
          </Reveal>

          {/* 4. Weekly challenge */}
          <Reveal className="md:col-span-3">
            <div className={`${CELL} bg-white/[0.04] ring-1 ring-white/10`}>
              <div className="flex items-start justify-between gap-4">
                <div>
                  <Icon name="flag" className="text-accent-lime" />
                  <h3 className="mt-4 text-[20px] font-bold tracking-tight text-white">Tantangan mingguan</h3>
                </div>
                <span className="tabular rounded-full bg-white/10 px-3 py-1 text-[13px] font-semibold text-white">3/5</span>
              </div>
              <p className="mt-2 max-w-[42ch] text-[14px] leading-relaxed text-white/60">
                Target kecil baru setiap Senin. Dengan Plus, AI menyesuaikannya dengan ritmemu.
              </p>
              <div className="mt-6 h-2 overflow-hidden rounded-full bg-white/10">
                <div className="h-full w-3/5 rounded-full bg-accent-lime" />
              </div>
            </div>
          </Reveal>

          {/* 5. Reports */}
          <Reveal delay={80} className="md:col-span-3">
            <div
              className={`${CELL} bg-[#16171D] bg-[linear-gradient(rgba(255,255,255,0.04)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.04)_1px,transparent_1px)] bg-[size:28px_28px] ring-1 ring-white/10`}
            >
              <Icon name="monitoring" className="text-accent-lime" />
              <h3 className="mt-4 text-[20px] font-bold tracking-tight text-white">Laporan bulanan</h3>
              <p className="mt-2 max-w-[42ch] text-[14px] leading-relaxed text-white/60">
                Lihat pola waktu dan konsistensimu. Ekspor CSV gratis, PDF dengan Continuum Plus.
              </p>
            </div>
          </Reveal>

          {/* 6. Share card */}
          <Reveal className="md:col-span-2">
            <div className={`${CELL} bg-[linear-gradient(160deg,rgba(204,255,0,0.14),transparent_70%)] ring-1 ring-accent-lime/20`}>
              <Icon name="ios_share" className="text-accent-lime" />
              <h3 className="mt-4 text-[20px] font-bold tracking-tight text-white">Kartu streak</h3>
              <p className="mt-2 text-[14px] leading-relaxed text-white/60">
                Bagikan pencapaianmu ke Instagram atau WhatsApp dengan satu ketukan.
              </p>
            </div>
          </Reveal>

          {/* 7. Offline PWA */}
          <Reveal delay={80} className="md:col-span-4">
            <div className={`${CELL} flex flex-col justify-between gap-6 bg-white/[0.04] ring-1 ring-white/10 sm:flex-row sm:items-end`}>
              <div>
                <Icon name="install_mobile" className="text-accent-lime" />
                <h3 className="mt-4 text-[20px] font-bold tracking-tight text-white">Pasang di layar utama</h3>
                <p className="mt-2 max-w-[46ch] text-[14px] leading-relaxed text-white/60">
                  Bisa dipasang seperti aplikasi biasa. Check-in tetap tersimpan saat offline dan dikirim otomatis
                  ketika internet kembali.
                </p>
              </div>
              <span className="w-fit shrink-0 rounded-full bg-white/10 px-4 py-2 text-[13px] font-semibold text-white">
                Android dan iOS
              </span>
            </div>
          </Reveal>
        </div>
      </div>
    </section>
  );
}
