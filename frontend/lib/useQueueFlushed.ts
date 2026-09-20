'use client';

import { useEffect, useRef } from 'react';
import { QUEUE_FLUSHED_EVENT } from './offlineQueue';

/** Runs `onFlushed` after offline changes have been synced, so a page can reload the data the queue just wrote. */
export function useQueueFlushed(onFlushed: () => void) {
  const ref = useRef(onFlushed);
  ref.current = onFlushed;

  useEffect(() => {
    const handler = () => ref.current();
    window.addEventListener(QUEUE_FLUSHED_EVENT, handler);
    return () => window.removeEventListener(QUEUE_FLUSHED_EVENT, handler);
  }, []);
}
