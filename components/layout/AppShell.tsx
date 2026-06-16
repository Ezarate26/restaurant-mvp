'use client';

import type { ReactNode } from 'react';
import { AppSidebar } from '@/components/layout/AppSidebar';
import {
  MobileNavButton,
  MobileNavProvider,
} from '@/components/layout/MobileNavContext';
import { ThemeToggle } from '@/components/ui/ThemeToggle';

type AppShellProps = {
  children: ReactNode;
  /** Sin sidebar (landing, auth centrado opcional) */
  bare?: boolean;
  maxWidth?: 'sm' | 'md' | 'lg' | 'full';
};

export function AppShell({
  children,
  bare = false,
  maxWidth = 'md',
}: AppShellProps) {
  const maxClass =
    maxWidth === 'full'
      ? 'max-w-none'
      : maxWidth === 'lg'
        ? 'max-w-3xl'
        : maxWidth === 'sm'
          ? 'max-w-sm'
          : 'max-w-md';

  if (bare) {
    return (
      <div className="relative min-h-screen overflow-x-hidden bg-[var(--app-bg)] text-[var(--app-text)]">
        <div className="pointer-events-none fixed right-3 top-3 z-50 sm:right-4 sm:top-4 lg:hidden">
          <div className="pointer-events-auto">
            <ThemeToggle compact />
          </div>
        </div>
        {children}
      </div>
    );
  }

  return (
    <MobileNavProvider>
      <div className="flex min-h-screen overflow-x-hidden bg-[var(--app-bg)] text-[var(--app-text)]">
        <AppSidebar />
        <main className="flex min-h-0 min-w-0 flex-1 flex-col overflow-y-auto app-scrollbar">
          <div className="relative z-app-header flex shrink-0 items-center justify-between gap-2 border-b border-[var(--app-border)] bg-[var(--app-sidebar)] px-3 py-2 lg:hidden">
            <MobileNavButton />
            <ThemeToggle compact />
          </div>
          <div
            className={`mx-auto w-full min-w-0 ${maxClass} relative z-0 px-3 py-6 sm:px-6 sm:py-10`}
          >
            {children}
          </div>
        </main>
      </div>
    </MobileNavProvider>
  );
}
