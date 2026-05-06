/* eslint-disable react-hooks/exhaustive-deps */
'use client';

import type { ReactNode } from 'react';
import { createContext, useContext, useMemo, useState } from 'react';
import type { Profile, SessionUser } from '@/lib/model/types';

export type SessionRole = 'customer' | 'waiter' | null;

export type SessionStoreUser = {
  id: string;
  role: Exclude<SessionRole, null>;
};

export type SessionStoreState = {
  sessionId: string | null;
  servicePointId: string | null;
  role: SessionRole;
  profile: Profile | null;
  sessionUser: SessionUser | null;
  languages: string[];
  users: SessionStoreUser[];
  setSession: (args: {
    sessionId: string;
    servicePointId: string | null;
    role: Exclude<SessionRole, null>;
    profile?: Profile | null;
    sessionUser?: SessionUser | null;
    /** Si se omite, no se tocan los idiomas ya guardados (evita borrar `languages` en login parcial). */
    languages?: string[];
    users?: SessionStoreUser[];
  }) => void;
  clearSession: () => void;
};

const SessionStoreContext = createContext<SessionStoreState | null>(null);

export function SessionStoreProvider({ children }: { children: ReactNode }) {
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [servicePointId, setServicePointId] = useState<string | null>(null);
  const [role, setRole] = useState<SessionRole>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [sessionUser, setSessionUser] = useState<SessionUser | null>(null);
  const [languages, setLanguages] = useState<string[]>([]);
  const [users, setUsers] = useState<SessionStoreUser[]>([]);

  const value = useMemo<SessionStoreState>(
    () => ({
      sessionId,
      servicePointId,
      role,
      profile,
      sessionUser,
      languages,
      users,
      setSession: ({
        sessionId: sid,
        servicePointId: spid,
        role: r,
        profile: p = null,
        sessionUser: su = null,
        languages: langs,
        users: u,
      }) => {
        setSessionId(sid);
        setServicePointId(spid);
        setRole(r);
        setProfile(p);
        setSessionUser(su);
        if (langs !== undefined) {
          setLanguages(langs);
        }
        setUsers(u ?? []);
      },
      clearSession: () => {
        setSessionId(null);
        setServicePointId(null);
        setRole(null);
        setProfile(null);
        setSessionUser(null);
        setLanguages([]);
        setUsers([]);
      },
    }),
    [sessionId, servicePointId, role, profile, sessionUser, languages, users]
  );

  return (
    <SessionStoreContext.Provider value={value}>
      {children}
    </SessionStoreContext.Provider>
  );
}

export function useSessionStore() {
  const ctx = useContext(SessionStoreContext);
  if (!ctx) {
    throw new Error('useSessionStore must be used within SessionStoreProvider');
  }
  return ctx;
}

