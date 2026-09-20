'use client';

import { createContext, ReactNode, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { apiFetch } from '@/lib/api';
import { PlanSummary } from '@/lib/types';

interface PlanContextValue {
  plan: PlanSummary | null;
  isPlus: boolean;
  refresh: () => Promise<void>;
}

const PlanContext = createContext<PlanContextValue>({ plan: null, isPlus: false, refresh: async () => undefined });

export function PlanProvider({ children }: { children: ReactNode }) {
  const [plan, setPlan] = useState<PlanSummary | null>(null);

  const refresh = useCallback(async () => {
    try {
      setPlan(await apiFetch<PlanSummary>('/api/plan'));
    } catch {
      // Offline or a transient error: keep the last known plan; the server enforces limits regardless.
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const value = useMemo(() => ({ plan, isPlus: plan?.plan === 'plus', refresh }), [plan, refresh]);
  return <PlanContext.Provider value={value}>{children}</PlanContext.Provider>;
}

export function usePlan() {
  return useContext(PlanContext);
}
