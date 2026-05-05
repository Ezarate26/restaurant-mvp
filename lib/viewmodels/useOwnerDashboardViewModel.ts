'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import type { User } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';
import { fetchRestaurantById } from '@/lib/model/restaurants.repository';
import { fetchServicePointsByRestaurant } from '@/lib/model/service-points.repository';
import { fetchActiveSessionsByRestaurant } from '@/lib/model/service-sessions.repository';
import { fetchPendingServiceRequestsByRestaurant } from '@/lib/model/service-requests.repository';
import { fetchSessionUsersByRestaurant } from '@/lib/model/session-users.repository';
import {
  fetchProfilesByIds,
} from '@/lib/model/profiles.repository';
import { REALTIME_CHANNEL_OWNER } from '@/lib/model/realtime.constants';
import type {
  Message,
  Profile,
  Restaurant,
  ServicePoint,
  ServiceRequest,
  ServiceSession,
  SessionUser,
} from '@/lib/model/types';
import { isPresentSessionUser } from '@/lib/utils/session-user-presence';
import {
  resolveDashboardGate,
  signOutAndRedirect,
} from '@/lib/viewmodels/dashboard-auth.helpers';

export function useOwnerDashboardViewModel() {
  const router = useRouter();

  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [restaurant, setRestaurant] = useState<Restaurant | null>(null);
  const [restaurantId, setRestaurantId] = useState<string | null>(null);

  const [servicePoints, setServicePoints] = useState<ServicePoint[]>([]);
  const [sessions, setSessions] = useState<ServiceSession[]>([]);
  const [serviceRequests, setServiceRequests] = useState<ServiceRequest[]>([]);
  const [sessionUsers, setSessionUsers] = useState<SessionUser[]>([]);
  const [waiterProfiles, setWaiterProfiles] = useState<Profile[]>([]);
  const [lastMessageBySession, setLastMessageBySession] = useState<
    Record<string, Message | null>
  >({});

  const sessionsRef = useRef<ServiceSession[]>([]);
  useEffect(() => {
    sessionsRef.current = sessions;
  }, [sessions]);

  const sessionIdsRef = useRef<Set<string>>(new Set());
  useEffect(() => {
    sessionIdsRef.current = new Set(sessions.map((s) => s.id));
  }, [sessions]);

  const hydrateLastMessages = useCallback(
    async (sessionIds: string[], cancelled: boolean) => {
      if (sessionIds.length === 0) {
        if (!cancelled) setLastMessageBySession({});
        return;
      }
      const next: Record<string, Message | null> = {};
      await Promise.all(
        sessionIds.map(async (sid) => {
          const { data, error } = await supabase
            .from('messages')
            .select('*')
            .eq('session_id', sid)
            .order('created_at', { ascending: false })
            .limit(1)
            .maybeSingle();
          if (error) {
            console.error('owner:lastMessage', error);
            next[sid] = null;
          } else {
            next[sid] = (data as Message) ?? null;
          }
        })
      );
      if (!cancelled) {
        const rebuilt: Record<string, Message | null> = {};
        for (const sid of sessionIds) rebuilt[sid] = next[sid] ?? null;
        setLastMessageBySession(rebuilt);
      }
    },
    []
  );

  useEffect(() => {
    let cancelled = false;

    const init = async () => {
      const gate = await resolveDashboardGate(supabase, 'owner');
      if (gate.redirectTo) {
        router.push(gate.redirectTo);
        return;
      }
      if (!gate.user || !gate.profile?.restaurant_id) {
        router.push('/login');
        return;
      }
      if (cancelled) return;
      setUser(gate.user);
      setProfile(gate.profile);
      setRestaurantId(gate.profile.restaurant_id);

      const rest = await fetchRestaurantById(supabase, gate.profile.restaurant_id);
      if (cancelled) return;
      setRestaurant(rest);

      const [points, activeSessions, requests, users] = await Promise.all([
        fetchServicePointsByRestaurant(supabase, gate.profile.restaurant_id),
        fetchActiveSessionsByRestaurant(supabase, gate.profile.restaurant_id),
        fetchPendingServiceRequestsByRestaurant(supabase, gate.profile.restaurant_id),
        fetchSessionUsersByRestaurant(supabase, gate.profile.restaurant_id),
      ]);

      if (cancelled) return;
      setServicePoints(points);
      setSessions(activeSessions);
      setServiceRequests(requests);
      setSessionUsers(users);

      const waiterIds = Array.from(
        new Set(
          activeSessions
            .map((s) => s.assigned_to)
            .filter((id): id is string => Boolean(id))
        )
      );
      const profiles = await fetchProfilesByIds(supabase, waiterIds);
      if (!cancelled) setWaiterProfiles(profiles);

      await hydrateLastMessages(activeSessions.map((s) => s.id), cancelled);
    };

    void init();
    return () => {
      cancelled = true;
    };
  }, [router, hydrateLastMessages]);

  useEffect(() => {
    if (!restaurantId) return;

    const refetchUsers = async () => {
      const users = await fetchSessionUsersByRestaurant(
        supabase,
        restaurantId
      );
      setSessionUsers(users);
    };

    const channel = supabase
      .channel(REALTIME_CHANNEL_OWNER)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'service_sessions',
          filter: `restaurant_id=eq.${restaurantId}`,
        },
        (payload) => {
          if (payload.eventType === 'DELETE') {
            const old = payload.old as Partial<ServiceSession> | undefined;
            if (!old?.id) return;
            setSessions((prev) => prev.filter((s) => s.id !== old.id));
            setSessionUsers((prev) =>
              prev.filter((u) => u.session_id !== old.id)
            );
            return;
          }
          const row = payload.new as ServiceSession | undefined;
          if (!row?.id) return;

          if (row.status !== 'active') {
            setSessions((prev) => prev.filter((s) => s.id !== row.id));
            setSessionUsers((prev) =>
              prev.filter((u) => u.session_id !== row.id)
            );
            return;
          }

          setSessions((prev) => {
            const idx = prev.findIndex((s) => s.id === row.id);
            if (idx >= 0) {
              const copy = [...prev];
              copy[idx] = { ...copy[idx], ...row };
              return copy;
            }
            return [row, ...prev];
          });
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'service_requests',
          filter: `restaurant_id=eq.${restaurantId}`,
        },
        (payload) => {
          if (payload.eventType === 'DELETE') {
            const old = payload.old as Partial<ServiceRequest> | undefined;
            if (!old?.id) return;
            setServiceRequests((prev) => prev.filter((r) => r.id !== old.id));
            return;
          }
          const row = payload.new as ServiceRequest | undefined;
          if (!row?.id) return;

          if (row.status !== 'pending') {
            setServiceRequests((prev) => prev.filter((r) => r.id !== row.id));
            return;
          }

          setServiceRequests((prev) => {
            const idx = prev.findIndex((r) => r.id === row.id);
            if (idx >= 0) {
              const copy = [...prev];
              copy[idx] = { ...copy[idx], ...row };
              return copy;
            }
            return [row, ...prev];
          });
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'session_users',
        },
        (payload) => {
          const row = (payload.new ?? payload.old) as
            | SessionUser
            | undefined;
          if (!row?.session_id) return;
          if (!sessionIdsRef.current.has(row.session_id)) {
            setSessionUsers((prev) =>
              prev.filter((u) => u.session_id !== row.session_id)
            );
            return;
          }
          void refetchUsers();
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `restaurant_id=eq.${restaurantId}`,
        },
        (payload) => {
          const msg = payload.new as Message;
          if (!msg.session_id) return;
          if (!sessionIdsRef.current.has(msg.session_id)) return;
          setLastMessageBySession((prev) => {
            const cur = prev[msg.session_id!];
            if (cur && cur.created_at && msg.created_at) {
              if (new Date(cur.created_at) > new Date(msg.created_at))
                return prev;
            }
            return { ...prev, [msg.session_id!]: msg };
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [restaurantId]);

  useEffect(() => {
    const ids = Array.from(
      new Set(
        sessions
          .map((s) => s.assigned_to)
          .filter((id): id is string => Boolean(id))
      )
    );
    const known = new Set(waiterProfiles.map((p) => p.id));
    const missing = ids.filter((id) => !known.has(id));
    if (missing.length === 0) return;

    let cancelled = false;
    void (async () => {
      const fresh = await fetchProfilesByIds(supabase, missing);
      if (cancelled) return;
      setWaiterProfiles((prev) => {
        const map = new Map(prev.map((p) => [p.id, p] as const));
        for (const p of fresh) map.set(p.id, p);
        return Array.from(map.values());
      });
    })();
    return () => {
      cancelled = true;
    };
  }, [sessions, waiterProfiles]);

  useEffect(() => {
    if (!restaurantId) return;
    let cancelled = false;
    const ids = sessions.map((s) => s.id);
    void hydrateLastMessages(ids, cancelled);
    return () => {
      cancelled = true;
    };
  }, [restaurantId, sessions, hydrateLastMessages]);

  const profilesById = useMemo(() => {
    const map = new Map<string, Profile>();
    for (const p of waiterProfiles) map.set(p.id, p);
    return map;
  }, [waiterProfiles]);

  const pointsById = useMemo(() => {
    const map = new Map<string, ServicePoint>();
    for (const p of servicePoints) map.set(p.id, p);
    return map;
  }, [servicePoints]);

  const activeSessionIdSet = useMemo(
    () => new Set(sessions.map((s) => s.id)),
    [sessions]
  );

  const sessionUsersBySession = useMemo(() => {
    const m: Record<string, SessionUser[]> = {};
    for (const u of sessionUsers) {
      if (!activeSessionIdSet.has(u.session_id)) continue;
      if (!isPresentSessionUser(u)) continue;
      if (!m[u.session_id]) m[u.session_id] = [];
      m[u.session_id].push(u);
    }
    return m;
  }, [sessionUsers, activeSessionIdSet]);

  const pendingBySession = useMemo(() => {
    const m: Record<string, number> = {};
    for (const r of serviceRequests) {
      const sid = r.service_session_id;
      if (!sid || !activeSessionIdSet.has(sid)) continue;
      m[sid] = (m[sid] ?? 0) + 1;
    }
    return m;
  }, [serviceRequests, activeSessionIdSet]);

  /** Sesiones `active` en BD que aún muestran ocupación o trabajo pendiente (evita “fantasmas” sin nadie). */
  const dashboardSessions = useMemo(() => {
    return sessions.filter((s) => {
      if (s.status !== 'active') return false;
      const users = sessionUsersBySession[s.id] ?? [];
      const hasPresent = users.length > 0;
      const pending = (pendingBySession[s.id] ?? 0) > 0;
      return hasPresent || pending;
    });
  }, [sessions, sessionUsersBySession, pendingBySession]);

  const handleLogout = useCallback(async () => {
    await signOutAndRedirect(supabase, (path) => router.push(path));
  }, [router]);

  return {
    user,
    profile,
    restaurant,
    restaurantId,
    servicePoints,
    sessions,
    dashboardSessions,
    serviceRequests,
    sessionUsers,
    sessionUsersBySession,
    pendingBySession,
    profilesById,
    pointsById,
    lastMessageBySession,
    handleLogout,
  };
}
