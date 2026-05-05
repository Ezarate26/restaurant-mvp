'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import type { User } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';
import {
  fetchMessagesBySession,
  insertMessage,
} from '@/lib/model/messages.repository';
import { fetchServicePointsByRestaurant } from '@/lib/model/service-points.repository';
import {
  assignWaiterToSession,
  closeSessionForEveryone,
  fetchActiveSessionsByRestaurant,
  fetchServiceSessionById,
} from '@/lib/model/service-sessions.repository';
import {
  claimAllPendingForSession,
  fetchPendingServiceRequestsByRestaurant,
} from '@/lib/model/service-requests.repository';
import { fetchActiveSessionUsersBySession } from '@/lib/model/session-users.repository';
import {
  fetchProfilesByIds,
} from '@/lib/model/profiles.repository';
import {
  REALTIME_CHANNEL_RESTAURANT,
  REALTIME_CHANNEL_SESSION,
} from '@/lib/model/realtime.constants';
import { sessionToTableView } from '@/lib/adapters/sessionToTable';
import { sessionUserArrivalIndex } from '@/lib/utils/session-user-display-name';
import { isTechnicalUserIdentifier, paddedUsuarioOrder } from '@/lib/utils/user-identifier';
import { groupServiceRequestsBySession } from '@/lib/adapters/serviceRequestToPending';
import {
  resolveDashboardGate,
  signOutAndRedirect,
} from '@/lib/viewmodels/dashboard-auth.helpers';
import type {
  Message,
  Profile,
  ServicePoint,
  ServiceRequest,
  ServiceSession,
  SessionUser,
} from '@/lib/model/types';
import type { PendingTableRequestView } from '@/lib/adapters/pending-table-request.types';
import type { TableView } from '@/lib/adapters/table-view.types';

type ChatTypingPayload = {
  session_id: string;
  user_id: string;
  sender: 'customer' | 'waiter';
};

export function useWaiterDashboardViewModel() {
  const router = useRouter();

  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [restaurantId, setRestaurantId] = useState<string | null>(null);

  const [servicePoints, setServicePoints] = useState<ServicePoint[]>([]);
  const [sessions, setSessions] = useState<ServiceSession[]>([]);
  const [serviceRequests, setServiceRequests] = useState<ServiceRequest[]>([]);
  const [sessionUsers, setSessionUsers] = useState<SessionUser[]>([]);
  const [waiterProfiles, setWaiterProfiles] = useState<Profile[]>([]);

  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
  const activeSessionIdRef = useRef<string | null>(null);

  const [messages, setMessages] = useState<Message[]>([]);
  const [text, setText] = useState('');

  const [unread, setUnread] = useState<Record<string, number>>({});
  const [typingIndicator, setTypingIndicator] = useState<string | null>(null);
  const [finalizeBusy, setFinalizeBusy] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const userIdRef = useRef<string | null>(null);
  const sessionUsersRef = useRef<SessionUser[]>([]);
  const waiterSessionChannelRef = useRef<ReturnType<
    typeof supabase.channel
  > | null>(null);
  const typingHideRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastTypingSentRef = useRef(0);

  useEffect(() => {
    sessionUsersRef.current = sessionUsers;
  }, [sessionUsers]);

  useEffect(() => {
    activeSessionIdRef.current = activeSessionId;
  }, [activeSessionId]);

  useEffect(() => {
    userIdRef.current = user?.id ?? null;
  }, [user?.id]);

  useEffect(() => {
    let cancelled = false;

    const init = async () => {
      const gate = await resolveDashboardGate(supabase, 'waiter');
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

      const [points, activeSessions, requests] = await Promise.all([
        fetchServicePointsByRestaurant(supabase, gate.profile.restaurant_id),
        fetchActiveSessionsByRestaurant(supabase, gate.profile.restaurant_id),
        fetchPendingServiceRequestsByRestaurant(supabase, gate.profile.restaurant_id),
      ]);

      if (cancelled) return;
      setServicePoints(points);
      setSessions(activeSessions);
      setServiceRequests(requests);
      setSessionUsers([]);

      const waiterIds = Array.from(
        new Set(
          activeSessions
            .map((s) => s.assigned_to)
            .filter((id): id is string => Boolean(id))
        )
      );
      const profiles = await fetchProfilesByIds(supabase, waiterIds);
      if (!cancelled) setWaiterProfiles(profiles);
    };

    void init();

    return () => {
      cancelled = true;
    };
  }, [router]);

  useEffect(() => {
    if (!toastMessage) return;
    const t = window.setTimeout(() => setToastMessage(null), 4200);
    return () => window.clearTimeout(t);
  }, [toastMessage]);

  useEffect(() => {
    if (!restaurantId) return;

    const channel = supabase
      .channel(REALTIME_CHANNEL_RESTAURANT)
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
            setServiceRequests((prev) =>
              prev.filter((r) => r.service_session_id !== old.id)
            );
            if (activeSessionIdRef.current === old.id) {
              activeSessionIdRef.current = null;
              setActiveSessionId(null);
              setMessages([]);
              setSessionUsers([]);
              setText('');
              setTypingIndicator(null);
            }
            return;
          }
          const row = payload.new as ServiceSession | undefined;
          if (!row?.id) return;

          if (row.status !== 'active') {
            setSessions((prev) => prev.filter((s) => s.id !== row.id));
            setServiceRequests((prev) =>
              prev.filter((r) => r.service_session_id !== row.id)
            );
            if (activeSessionIdRef.current === row.id) {
              activeSessionIdRef.current = null;
              setActiveSessionId(null);
              setMessages([]);
              setSessionUsers([]);
              setText('');
              setTypingIndicator(null);
            }
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
          const sid = activeSessionIdRef.current;
          if (!sid) return;

          if (payload.eventType === 'DELETE') {
            const old = payload.old as Partial<SessionUser> | undefined;
            if (!old?.id || old.session_id !== sid) return;
            setSessionUsers((prev) => prev.filter((u) => u.id !== old.id));
            return;
          }
          const row = payload.new as SessionUser | undefined;
          if (!row?.id || row.session_id !== sid) return;

          if (row.status !== 'active') {
            setSessionUsers((prev) => prev.filter((u) => u.id !== row.id));
            return;
          }

          setSessionUsers((prev) => {
            const idx = prev.findIndex((u) => u.id === row.id);
            if (idx >= 0) {
              const copy = [...prev];
              copy[idx] = { ...copy[idx], ...row };
              return copy;
            }
            return [...prev, row];
          });
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
          const isActive = msg.session_id === activeSessionIdRef.current;

          if (isActive) {
            setMessages((prev) => {
              if (prev.some((m) => m.id === msg.id)) return prev;
              return [...prev, msg];
            });
            if (msg.session_id) {
              setUnread((prev) => ({ ...prev, [msg.session_id as string]: 0 }));
            }
            return;
          }

          if (msg.sender === 'waiter') return;
          if (!msg.session_id) return;

          // Sólo cuenta unread para sesiones asignadas al usuario actual.
          const sess = sessionsRef.current.find((s) => s.id === msg.session_id);
          if (!sess || sess.assigned_to !== userIdRef.current) return;

          setUnread((prev) => ({
            ...prev,
            [msg.session_id as string]: (prev[msg.session_id as string] || 0) + 1,
          }));
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [restaurantId]);

  useEffect(() => {
    if (!activeSessionId) {
      setTypingIndicator(null);
      waiterSessionChannelRef.current = null;
      return;
    }

    const flashTypingLine = (label: string) => {
      if (typingHideRef.current) clearTimeout(typingHideRef.current);
      setTypingIndicator(label);
      typingHideRef.current = setTimeout(() => {
        setTypingIndicator(null);
        typingHideRef.current = null;
      }, 2600);
    };

    const channel = supabase
      .channel(`${REALTIME_CHANNEL_SESSION}:${activeSessionId}`)
      .on('broadcast', { event: 'typing' }, ({ payload }) => {
        const p = payload as ChatTypingPayload;
        if (
          !p?.session_id ||
          p.session_id !== activeSessionIdRef.current ||
          !p.user_id ||
          !p.sender
        ) {
          return;
        }

        if (p.sender === 'waiter' && p.user_id === userIdRef.current) return;

        if (p.sender === 'customer') {
          const users = sessionUsersRef.current;
          const su = users.find((u) => u.id === p.user_id);
          if (su) {
            const idx = sessionUserArrivalIndex(users, su.id) ?? 1;
            const idf = su.user_identifier?.trim();
            const name =
              su.display_name?.trim() ||
              su.username?.trim() ||
              (idf && !isTechnicalUserIdentifier(idf)
                ? idf
                : paddedUsuarioOrder(idx));
            flashTypingLine(`${name} está escribiendo…`);
          } else {
            flashTypingLine('Un cliente está escribiendo…');
          }
        }
      })
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          waiterSessionChannelRef.current = channel;
        }
      });

    return () => {
      waiterSessionChannelRef.current = null;
      supabase.removeChannel(channel);
    };
  }, [activeSessionId]);

  const sessionsRef = useRef<ServiceSession[]>([]);
  useEffect(() => {
    sessionsRef.current = sessions;
  }, [sessions]);

  // Re-fetch perfiles asignados cuando aparece un mesero nuevo en sesiones.
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

  const handleLogout = useCallback(async () => {
    await signOutAndRedirect(supabase, (path) => router.push(path));
  }, [router]);

  const openChat = useCallback(async (sessionId: string) => {
    activeSessionIdRef.current = sessionId;
    setActiveSessionId(sessionId);
    setTypingIndicator(null);
    setUnread((prev) => ({ ...prev, [sessionId]: 0 }));

    const [data, users] = await Promise.all([
      fetchMessagesBySession(supabase, sessionId),
      fetchActiveSessionUsersBySession(supabase, sessionId),
    ]);
    if (activeSessionIdRef.current !== sessionId) return;
    setMessages(data);
    setSessionUsers(users);
  }, []);

  const takeTable = useCallback(
    async (sessionId: string) => {
      if (!user) return;
      try {
        await assignWaiterToSession(supabase, sessionId, user.id);
        await claimAllPendingForSession(supabase, sessionId, user.id);
        const fresh = await fetchServiceSessionById(supabase, sessionId);
        if (fresh?.status === 'active') {
          setSessions((prev) => {
            const idx = prev.findIndex((s) => s.id === sessionId);
            if (idx >= 0) {
              const copy = [...prev];
              copy[idx] = fresh;
              return copy;
            }
            return [fresh, ...prev];
          });
        }
        setServiceRequests((prev) =>
          prev.filter(
            (r) =>
              !(
                r.service_session_id === sessionId &&
                r.status === 'pending'
              )
          )
        );
        await openChat(sessionId);
      } catch (e) {
        console.error('takeTable', e);
      }
    },
    [user, openChat]
  );

  const finalizeActiveSession = useCallback(async () => {
    const sid = activeSessionIdRef.current;
    if (!sid || finalizeBusy) return;
    setFinalizeBusy(true);
    try {
      await closeSessionForEveryone(supabase, sid, 'completed');
      activeSessionIdRef.current = null;
      setActiveSessionId(null);
      setMessages([]);
      setSessionUsers([]);
      setSessions((prev) => prev.filter((s) => s.id !== sid));
      setServiceRequests((prev) =>
        prev.filter((r) => r.service_session_id !== sid)
      );
      setText('');
      setTypingIndicator(null);
      setToastMessage('Sesión finalizada');
    } catch (e) {
      console.error('finalizeActiveSession', e);
      throw e;
    } finally {
      setFinalizeBusy(false);
    }
  }, [finalizeBusy]);

  const sendMessage = useCallback(async () => {
    if (!activeSessionId || !text.trim() || !profile) return;
    const sess = sessionsRef.current.find((s) => s.id === activeSessionId);
    if (!sess || sess.status !== 'active') return;

    try {
      await insertMessage(supabase, {
        session_id: activeSessionId,
        restaurant_id: sess.restaurant_id,
        sender: 'waiter',
        text: text.trim(),
      });
      setText('');
    } catch (e) {
      console.error('sendMessage', e);
    }
  }, [activeSessionId, text, profile]);

  const notifyTyping = useCallback(() => {
    const ch = waiterSessionChannelRef.current;
    const sid = activeSessionId;
    const uid = user?.id;
    if (!ch || !sid || !uid) return;
    const now = Date.now();
    if (now - lastTypingSentRef.current < 850) return;
    lastTypingSentRef.current = now;
    void ch.send({
      type: 'broadcast',
      event: 'typing',
      payload: {
        session_id: sid,
        user_id: uid,
        sender: 'waiter',
      } satisfies ChatTypingPayload,
    });
  }, [activeSessionId, user?.id]);

  // --- Adapters → forma esperada por WaiterDashboardView ---

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

  const tables: TableView[] = useMemo(() => {
    const uid = user?.id;
    if (!uid) return [];
    return sessions
      .filter((s) => s.assigned_to === uid)
      .map((s) =>
        sessionToTableView({
          session: s,
          point: (s.service_point_id && pointsById.get(s.service_point_id)) || null,
          assignedProfile: s.assigned_to
            ? profilesById.get(s.assigned_to) ?? null
            : null,
        })
      );
  }, [sessions, pointsById, profilesById, user?.id]);

  /**
   * Solo solicitudes de mesas sin mesero: si ya hay `assigned_to`, no debe
   * aparecer en Solicitudes (evita duplicado con Mesas y confunde a otros meseros).
   */
  const pendingRequests: PendingTableRequestView[] = useMemo(() => {
    const sessionById = new Map(sessions.map((s) => [s.id, s]));
    const openForPickup = serviceRequests.filter((r) => {
      if (r.status !== 'pending') return false;
      const sid = r.service_session_id as string | null | undefined;
      if (!sid) return false;
      const s = sessionById.get(sid);
      if (!s || s.status !== 'active') return false;
      if (s.assigned_to) return false;
      return true;
    });
    return groupServiceRequestsBySession(openForPickup);
  }, [serviceRequests, sessions]);

  /** Nombre de mesa para solicitudes pendientes (sesión aún no en `tables` hasta tomarla). */
  const pendingSessionLabels = useMemo(() => {
    const out: Record<string, string> = {};
    for (const pr of pendingRequests) {
      const s = sessions.find((x) => x.id === pr.table_id);
      const point = s?.service_point_id
        ? pointsById.get(s.service_point_id)
        : null;
      out[pr.table_id] = point?.name?.trim() || 'Mesa';
    }
    return out;
  }, [pendingRequests, sessions, pointsById]);

  /** Conteo de session_users activos por sesión (para futura UI; hoy lo expone read-only). */
  const sessionUsersCountBySession = useMemo(() => {
    const m: Record<string, number> = {};
    for (const u of sessionUsers) {
      if (u.status !== 'active') continue;
      m[u.session_id] = (m[u.session_id] ?? 0) + 1;
    }
    return m;
  }, [sessionUsers]);

  const chatSessionUsers = useMemo(() => {
    if (!activeSessionId) return [];
    return sessionUsers.filter(
      (u) => u.session_id === activeSessionId && u.status === 'active'
    );
  }, [activeSessionId, sessionUsers]);

  // Mantener firma compatible con el page actual.
  return {
    user,
    profile,
    sessions,
    tables,
    pendingSessionLabels,
    pendingRequests,
    activeTable: activeSessionId,
    messages,
    text,
    setText,
    unread,
    sessionUsersCountBySession,
    handleLogout,
    takeTable,
    openChat,
    sendMessage,
    typingIndicator,
    notifyTyping,
    chatSessionUsers,
    finalizeActiveSession,
    finalizeBusy,
    toastMessage,
  };
}
