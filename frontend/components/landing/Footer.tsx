import Link from 'next/link';

const LINKS = [
  { href: '#fitur', label: 'Fitur' },
  { href: '#cara-kerja', label: 'Cara kerja' },
  { href: '#paket', label: 'Paket' },
  { href: '/login', label: 'Masuk' },
];

export function Footer() {
  return (
    <footer className="border-t border-white/10 px-5 py-10">
      <div className="mx-auto flex max-w-6xl flex-col justify-between gap-8 sm:flex-row sm:items-center">
        <div className="flex items-center gap-3">
          <span className="flex h-8 w-8 items-center justify-center rounded-full bg-accent-lime text-[15px] font-bold text-sidebar-dark">
            C
          </span>
          <div>
            <p className="text-[15px] font-bold text-white">Continuum</p>
            <p className="text-[13px] text-white/50">Kebiasaan baik, tanpa rasa bersalah.</p>
          </div>
        </div>
        <nav aria-label="Tautan footer">
          <ul className="flex flex-wrap gap-x-6 gap-y-2">
            {LINKS.map((l) => (
              <li key={l.href}>
                {l.href.startsWith('/') ? (
                  <Link href={l.href} className="text-[14px] text-white/60 transition-colors hover:text-white">
                    {l.label}
                  </Link>
                ) : (
                  <a href={l.href} className="text-[14px] text-white/60 transition-colors hover:text-white">
                    {l.label}
                  </a>
                )}
              </li>
            ))}
          </ul>
        </nav>
      </div>
      <p className="mx-auto mt-8 max-w-6xl text-[13px] text-white/40">© {new Date().getFullYear()} Continuum</p>
    </footer>
  );
}
