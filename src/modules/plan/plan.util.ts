export type Plan = 'free' | 'plus';

/** Gated capabilities. Anything not listed here stays free for everyone. */
export type PremiumFeature =
  | 'pdf_export'
  | 'monthly_digest'
  | 'pattern_detection'
  | 'proactive_insights_full'
  | 'calendar_auto_sync'
  | 'ai_challenge';

/** Separate daily counters: the coach is the costliest AI feature, so it gets its own budget. */
export type AiBucket = 'coach' | 'ai';

export const FREE_DAILY_LIMITS: Record<AiBucket, number> = { coach: 5, ai: 10 };

export function resolvePlan(premiumUntil: Date | null | undefined, now: Date = new Date()): Plan {
  return premiumUntil && premiumUntil.getTime() > now.getTime() ? 'plus' : 'free';
}

/** Plus users share the configurable ceiling (AI_DAILY_RATE_LIMIT); free users get the fixed small budget. */
export function dailyLimit(plan: Plan, bucket: AiBucket, plusLimit: number): number {
  return plan === 'plus' ? plusLimit : FREE_DAILY_LIMITS[bucket];
}

export const FEATURE_LABELS: Record<PremiumFeature, string> = {
  pdf_export: 'Export laporan PDF',
  monthly_digest: 'Digest AI bulanan',
  pattern_detection: 'Deteksi pola AI',
  proactive_insights_full: 'Insight proaktif lengkap',
  calendar_auto_sync: 'Sinkron Google Calendar otomatis',
  ai_challenge: 'Tantangan mingguan personal dari AI',
};

/** Extends the current premium period; renewing early adds to the remaining time instead of overwriting it. */
export function extendPremium(current: Date | null | undefined, days: number, now: Date = new Date()): Date {
  const base = current && current.getTime() > now.getTime() ? current : now;
  return new Date(base.getTime() + days * 86400000);
}
