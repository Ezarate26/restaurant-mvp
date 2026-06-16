'use client';

import type { ReactNode } from 'react';

type SystemMessageCardProps = {
  children: ReactNode;
};

export function SystemMessageCard({ children }: SystemMessageCardProps) {
  return (
    <div className="my-2 flex justify-center px-4">
      <div className="max-w-md rounded-md bg-[var(--app-bg)] px-3 py-1.5 text-center text-xs font-medium text-[var(--app-muted)] ring-1 ring-[var(--app-border)] transition-colors duration-200">
        {children}
      </div>
    </div>
  );
}
