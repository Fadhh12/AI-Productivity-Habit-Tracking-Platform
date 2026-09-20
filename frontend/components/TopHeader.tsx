'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth';
import { apiFetch } from '@/lib/api';
import { Activity, Goal, Habit } from '@/lib/types';
import { NotificationBell } from '@/components/NotificationBell';

interface SearchResult {
  key: string;
  label: string;
  sublabel: string;
  href: string;
  icon: string;
}

export function TopHeader() {
  const { user } = useAuth();
  const router = useRouter();

  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) setSearchOpen(false);
    }
    document.addEventListener('mousedown', onClickOutside);
    return () => document.removeEventListener('mousedown', onClickOutside);
  }, []);

  useEffect(() => {
    const q = query.trim().toLowerCase();
    if (q.length < 2) {
      setResults([]);
      setSearching(false);
      return;
    }
    setSearching(true);
    const timer = setTimeout(async () => {
      try {
        const [habits, goals, activities] = await Promise.all([
          apiFetch<Habit[]>('/api/habits'),
          apiFetch<Goal[]>('/api/goals'),
          apiFetch<Activity[]>('/api/activities'),
        ]);
        const found: SearchResult[] = [
          ...habits
            .filter((h) => h.name.toLowerCase().includes(q))
            .map((h) => ({ key: `h-${h.id}`, label: h.name, sublabel: 'Habit', href: '/habit-tracker', icon: 'check_circle' })),
          ...goals
            .filter((g) => g.title.toLowerCase().includes(q))
            .map((g) => ({
              key: `g-${g.id}`,
              label: g.title,
              sublabel: g.horizon === 'yearly' ? 'Goal Tahunan' : 'Goal Bulanan',
              href: `/goals/${g.parentGoalId ?? g.id}`,
              icon: 'flag',
            })),
          ...activities
            .filter((a) => a.title.toLowerCase().includes(q))
            .slice(0, 5)
            .map((a) => ({
              key: `a-${a.id}`,
              label: a.title,
              sublabel: `Aktivitas · ${new Date(a.startTime).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })}`,
              href: `/activity-logs?date=${a.startTime.slice(0, 10)}`,
              icon: 'history_toggle_off',
            })),
        ].slice(0, 8);
        setResults(found);
      } catch {
        setResults([]);
      } finally {
        setSearching(false);
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [query]);

  function onSelectResult(href: string) {
    setSearchOpen(false);
    setQuery('');
    router.push(href);
  }

  const displayName = user?.email.split('@')[0] ?? '';
  const memberSince = user ? new Date(user.createdAt).getFullYear() : '';

  return (
    <header className="fixed left-0 right-0 top-0 z-40 flex h-20 items-center justify-between gap-space-sm bg-surface/80 px-space-md shadow-[0_1px_8px_rgba(0,0,0,0.04)] backdrop-blur-xl lg:left-72 lg:px-space-xl">
      <div className="flex min-w-0 max-w-lg flex-1 items-center gap-space-md" ref={searchRef}>
        <div className="relative flex w-full items-center">
          <span className="material-symbols-outlined absolute left-space-md text-[20px] text-text-muted">search</span>
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onFocus={() => setSearchOpen(true)}
            className="w-full rounded-full bg-surface-container-low py-space-sm pl-11 pr-space-md font-body-sm text-body-sm text-on-surface placeholder:text-text-muted focus:bg-surface-card focus:outline-none"
            placeholder="Cari aktivitas, habit, atau goal..."
            type="text"
          />
          {searchOpen && query.trim().length >= 2 && (
            <div className="absolute left-0 right-0 top-12 z-50 max-h-96 overflow-y-auto rounded-lg bg-surface-card p-space-sm shadow-[0_12px_32px_-4px_rgba(22,23,29,0.08)]">
              {searching ? (
                <p className="px-space-sm py-3 font-body-sm text-body-sm text-text-muted">Mencari…</p>
              ) : results.length === 0 ? (
                <p className="px-space-sm py-3 font-body-sm text-body-sm text-text-muted">Tidak ada hasil untuk &quot;{query}&quot;.</p>
              ) : (
                results.map((r) => (
                  <button
                    key={r.key}
                    onClick={() => onSelectResult(r.href)}
                    type="button"
                    className="flex w-full items-center gap-space-sm rounded-xl px-space-sm py-space-sm text-left transition-colors hover:bg-surface-container-low"
                  >
                    <span className="material-symbols-outlined text-[18px] text-text-muted">{r.icon}</span>
                    <div className="flex min-w-0 flex-col">
                      <span className="truncate font-label-md text-label-md text-text-primary">{r.label}</span>
                      <span className="font-caption text-caption text-text-muted">{r.sublabel}</span>
                    </div>
                  </button>
                ))
              )}
            </div>
          )}
        </div>
      </div>
      <div className="flex shrink-0 items-center gap-space-sm lg:gap-space-lg">
        <NotificationBell />
        <div className="flex items-center gap-space-sm pl-space-sm">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-tertiary-container font-label-md text-label-md font-bold text-on-tertiary-container">
            {displayName.slice(0, 1).toUpperCase()}
          </div>
          <div className="hidden flex-col sm:flex">
            <span className="font-label-md text-label-md font-semibold text-text-primary">{displayName}</span>
            <span className="font-label-sm text-label-sm font-medium text-accent-lavender-text">
              Member sejak {memberSince}
            </span>
          </div>
        </div>
      </div>
    </header>
  );
}
