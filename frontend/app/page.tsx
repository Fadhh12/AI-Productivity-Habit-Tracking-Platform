'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth';

export default function RootPage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (loading) return;
    router.replace(user ? '/today' : '/login');
  }, [loading, user, router]);

  return (
    <div className="flex min-h-[100dvh] items-center justify-center text-gray-400">
      Memuat Continuum…
    </div>
  );
}
