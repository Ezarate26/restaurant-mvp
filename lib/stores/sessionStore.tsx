'use client';

import type { ReactNode } from 'react';

/** Store mínimo — reservado para estado global futuro. */
export function SessionStoreProvider({ children }: { children: ReactNode }) {
  return children;
}

export function useSessionStore() {
  return {
    sessionId: null,
    role: null,
    clearSession: () => {},
  };
}
