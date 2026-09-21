'use client';

import { useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth';
import { BottomNav } from '@/components/BottomNav';
import { Sidebar } from '@/components/Sidebar';
import { TopHeader } from '@/components/TopHeader';
import { BadgeUnlockToast } from '@/components/BadgeUnlockToast';
import { OfflineBanner } from '@/components/OfflineBanner';
import { PlanProvider } from '@/lib/plan';

export default function AppShellLayout({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!loading && !user) router.replace('/login');
  }, [loading, user, router]);

  if (loading || !user) {
    return (
      <div className="flex min-h-[100dvh] items-center justify-center bg-canvas-bg">
        <div className="flex h-12 w-12 animate-float items-center justify-center rounded-full bg-accent-lime font-headline-md text-headline-md font-bold text-text-primary shadow-soft">
          C
        </div>
        <span className="sr-only">Memuat…</span>
      </div>
    );
  }

  return (
    <PlanProvider>
    <div className="min-h-[100dvh] bg-canvas-bg lg:pl-72">
      <Sidebar />
      <TopHeader />
      <main className="mx-auto w-full max-w-[1600px] px-space-md pb-28 pt-24 lg:px-space-xl lg:pb-space-xl">
        {/* Keyed by route so every navigation replays the entry animation. */}
        <div key={pathname} className="animate-fade-up">
          {children}
        </div>
      </main>
      <BottomNav />
      <BadgeUnlockToast />
      <OfflineBanner />
    </div>
    </PlanProvider>
  );
}
