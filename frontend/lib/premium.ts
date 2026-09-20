import { ApiError } from '@/lib/api';

export interface UpgradeReason {
  kind: 'premium' | 'limit';
  message: string;
  feature?: string;
}

/** Recognises the API's PREMIUM_REQUIRED (403) and free-plan LIMIT_REACHED (429) errors so screens can offer an upgrade instead of a raw error. */
export function upgradeReason(err: unknown): UpgradeReason | null {
  if (!(err instanceof ApiError) || typeof err.body !== 'object' || err.body === null) return null;
  const { code, feature, plan } = err.body as { code?: string; feature?: string; plan?: string };
  if (code === 'PREMIUM_REQUIRED') return { kind: 'premium', message: err.message, feature };
  if (code === 'LIMIT_REACHED' && plan === 'free') return { kind: 'limit', message: err.message };
  return null;
}
