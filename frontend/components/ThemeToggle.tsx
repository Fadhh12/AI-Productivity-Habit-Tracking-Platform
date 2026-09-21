'use client';

import { useEffect, useState } from 'react';

const STORAGE_KEY = 'continuum-theme';

/** Switches between light and dark. The first visit follows the system setting (see the inline script in layout). */
export function ThemeToggle() {
  const [dark, setDark] = useState(false);

  useEffect(() => {
    setDark(document.documentElement.classList.contains('dark'));
  }, []);

  function toggle() {
    const next = !dark;
    setDark(next);
    document.documentElement.classList.toggle('dark', next);
    try {
      localStorage.setItem(STORAGE_KEY, next ? 'dark' : 'light');
    } catch {
      /* storage blocked: the choice just lasts for this visit */
    }
  }

  return (
    <button
      type="button"
      onClick={toggle}
      aria-pressed={dark}
      aria-label={dark ? 'Ganti ke mode terang' : 'Ganti ke mode gelap'}
      title={dark ? 'Mode terang' : 'Mode gelap'}
      className="press relative flex h-11 w-11 items-center justify-center rounded-full bg-surface-container-low text-on-surface hover:bg-surface-container-high"
    >
      <span
        className="material-symbols-outlined text-[22px] transition-transform duration-500 ease-spring"
        style={{ transform: dark ? 'rotate(360deg)' : 'rotate(0deg)' }}
        aria-hidden="true"
      >
        {dark ? 'light_mode' : 'dark_mode'}
      </span>
    </button>
  );
}
