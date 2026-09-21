'use client';

import { useEffect, useState } from 'react';

const KEY = 'continuum_companion';
const CHANGE_EVENT = 'continuum:companion';

function read(): boolean {
  try {
    return localStorage.getItem(KEY) !== 'off';
  } catch {
    return true;
  }
}

export function setCompanionEnabled(enabled: boolean) {
  try {
    localStorage.setItem(KEY, enabled ? 'on' : 'off');
  } catch {
    /* storage blocked: the choice lasts until the page is closed */
  }
  window.dispatchEvent(new Event(CHANGE_EVENT));
}

/** Whether the floating mascot companion is switched on (default on). Read after mount so server and client HTML match. */
export function useCompanionEnabled(): boolean | null {
  const [enabled, setEnabled] = useState<boolean | null>(null);
  useEffect(() => {
    setEnabled(read());
    const onChange = () => setEnabled(read());
    window.addEventListener(CHANGE_EVENT, onChange);
    return () => window.removeEventListener(CHANGE_EVENT, onChange);
  }, []);
  return enabled;
}
