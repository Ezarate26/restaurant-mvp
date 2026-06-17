'use client';

import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { HomeView } from '@/components/home/HomeView';
import { LANDING_PATH } from '@/lib/constants/routes';
import { useSupabaseAuth } from '@/lib/hooks/useSupabaseAuth';

export default function HomePage() {
  const router = useRouter();
  const { isAuthenticated, isLoading } = useSupabaseAuth();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.replace(LANDING_PATH);
    }
  }, [isAuthenticated, isLoading, router]);

  if (isLoading || !isAuthenticated) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[var(--app-bg)] text-sm text-[var(--app-muted)]">
        Cargando…
      </div>
    );
  }

  return <HomeView />;
}
