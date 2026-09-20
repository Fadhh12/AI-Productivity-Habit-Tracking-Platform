'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth';
import { BottomNav } from '@/components/BottomNav';
import { Sidebar } from '@/components/Sidebar';
import { TopHeader } from '@/components/TopHeader';
import { BadgeUnlockToast } from '@/components/BadgeUnlockToast';
import { OfflineBanner } from '@/components/OfflineBanner';

export default function AppShellLayout({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) router.replace('/login');
  }, [loading, user, router]);

  if (loading || !user) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-canvas-bg text-text-muted">Memuat…</div>
    );
  }

  return (
    <div className="min-h-screen bg-canvas-bg lg:pl-72">
      <Sidebar />
      <TopHeader />
      <main className="w-full px-space-md pb-24 pt-24 lg:px-space-xl lg:pb-space-xl">{children}</main>
      <BottomNav />
      <BadgeUnlockToast />
      <OfflineBanner />
    </div>
  );
}
