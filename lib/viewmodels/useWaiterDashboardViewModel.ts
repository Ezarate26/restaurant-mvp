'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import type { User } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';
import { fetchMessagesBySession } from '@/lib/model/messages.repository';
import { fetchServicePointsByRestaurant } from '@/lib/model/service-points.repository';
import {
  assignWaiterToSession,
  closeSessionForEveryone,
  fetchActiveSessionsByRestaurant,
  fetchServiceSessionById,
} from '@/lib/model/service-sessions.repository';
import { fetchRestaurantDefaultLanguage } from '@/lib/model/restaurants.repository';
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
import { useSessionStore } from '@/lib/stores/sessionStore';
import { useEnsureSessionUser } from '@/lib/hooks/useEnsureSessionUser';
import { normalizeLanguageCode } from '@/constants/languages';
import { useSessionLanguages } from '@/lib/hooks/useSessionLanguages';
import { useMessageSender } from '@/lib/hooks/useMessageSender';
import { ensureTranslationsForNewMessage } from '@/lib/model/message-translations.repository';
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
  const sessionStore = useSessionStore();
  const ensureSessionUser = useEnsureSessionUser();

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
  const {
    languages: sessionLanguages,
    refetchSessionLanguages,
  } = useSessionLanguages(activeSessionId);

  const { handleSendMessage, hydrateViewerMessages } = useMessageSender();

  const [messages, setMessages] = useState<Message[]>([]);
  const [text, setText] = useState('');

  const [unread, setUnread] = useState<Record<string, number>>({});
  const [typingIndicator, setTypingIndicator] = useState<string | null>(null);
  const [finalizeBusy, setFinalizeBusy] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [restaurantDefaultLanguage, setRestaurantDefaultLanguage] =
    useState<string>('es');

  const userIdRef = useRef<string | null>(null);
  const sessionUsersRef = useRef<SessionUser[]>([]);
  const waiterSessionChannelRef = useRef<ReturnType<
    typeof supabase.channel
  > | null>(null);
  const typingHideRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastTypingSentRef = useRef(0);
  const latestLanguagesRef = useRef<string[]>([]);

  useEffect(() => {
    sessionUsersRef.current = sessionUsers;
  }, [sessionUsers]);

  useEffect(() => {
    latestLanguagesRef.current = sessionLanguages;
  }, [sessionLanguages]);

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

      const [points, activeSessions, requests, defaultLang] = await Promise.all([
        fetchServicePointsByRestaurant(supabase, gate.profile.restaurant_id),
        fetchActiveSessionsByRestaurant(supabase, gate.profile.restaurant_id),
        fetchPendingServiceRequestsByRestaurant(supabase, gate.profile.restaurant_id),
        fetchRestaurantDefaultLanguage(supabase, gate.profile.restaurant_id),
      ]);

      if (cancelled) return;
      setRestaurantDefaultLanguage(defaultLang);
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
          if (payload.eventType === 'INSERT') {
            const ins = payload.new as SessionUser | undefined;
            if (ins?.session_id === sid) {
              void (async () => {
                try {
                  const langs = await refetchSessionLanguages();
                  latestLanguagesRef.current = langs;
                } catch (e) {
                  console.error(
                    'refetchSessionLanguages:session-users-insert-waiter',
                    e
                  );
                }
              })();
            }
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
          if (
            msg.sender !== 'system' &&
            (!msg.session_user_id || !msg.user_identifier || !msg.original_language)
          ) {
            return;
          }

          if (isActive) {
            const sidActive = activeSessionIdRef.current;
            setMessages((prev) => {
              if (prev.some((m) => m.id === msg.id)) return prev;
              return [...prev, msg];
            });
            if (msg.session_id) {
              setUnread((prev) => ({ ...prev, [msg.session_id as string]: 0 }));
            }
            if (sidActive) {
              void (async () => {
                try {
                  await ensureTranslationsForNewMessage(
                    supabase,
                    sidActive,
                    msg
                  );
                  if (activeSessionIdRef.current !== sidActive) return;
                  const fresh = await fetchMessagesBySession(
                    supabase,
                    sidActive
                  );
                  if (activeSessionIdRef.current !== sidActive) return;
                  setMessages(fresh);
                } catch (e) {
                  console.error(
                    'ensureTranslationsForNewMessage:waiter-message-insert',
                    e
                  );
                }
              })();
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
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'message_translations',
        },
        (payload) => {
          const tr = payload.new as {
            message_id?: string | null;
            language?: string | null;
            translated_text?: string | null;
          };
          if (!tr?.message_id) return;
          setMessages((prev) =>
            prev.map((m) => {
              if (m.id !== tr.message_id) return m;
              const next = m.translations ? [...m.translations] : [];
              const lang = (tr.language ?? '').trim().toLowerCase();
              if (!lang) return m;
              if (
                next.some(
                  (x) => (x.language ?? '').trim().toLowerCase() === lang
                )
              ) {
                return m;
              }
              next.push({
                message_id: m.id,
                language: lang,
                translated_text: tr.translated_text ?? null,
              });
              return { ...m, translations: next };
            })
          );
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [restaurantId, refetchSessionLanguages]);

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
    const sess = sessionsRef.current.find((s) => s.id === sessionId) ?? null;
    activeSessionIdRef.current = sessionId;
    setActiveSessionId(sessionId);
    setTypingIndicator(null);
    setUnread((prev) => ({ ...prev, [sessionId]: 0 }));

    const [data, usersRaw] = await Promise.all([
      fetchMessagesBySession(supabase, sessionId),
      fetchActiveSessionUsersBySession(supabase, sessionId),
    ]);
    if (activeSessionIdRef.current !== sessionId) return;
    setMessages(data);
    // Evitar contaminar la lista de clientes con el mesero (el mesero también vive en session_users).
    const users =
      user?.id ? usersRaw.filter((u) => u.user_identifier !== user.id) : usersRaw;
    setSessionUsers(users);

    // Asegurar que el mesero tenga session_user y guardarlo en store para enviar mensajes.
    if (user?.id) {
      try {
        const su = await ensureSessionUser({
          sessionId,
          userId: user.id,
          profile,
        });
        const langs =
          sessionLanguages.length > 0
            ? sessionLanguages
            : [
                ...new Set(
                  [...usersRaw.map((u) => u.language)]
                    .filter(
                      (x): x is string =>
                        typeof x === 'string' && Boolean(x.trim())
                    )
                    .map((x) => normalizeLanguageCode(x))
                ),
              ];
        const { messages: hydrated } = await hydrateViewerMessages({
          sessionId,
          viewerLanguage: su.language,
          latestLanguagesRef,
        });
        setMessages(hydrated);
        sessionStore.setSession({
          sessionId,
          servicePointId: sess?.service_point_id ?? null,
          role: 'waiter',
          profile,
          sessionUser: su,
          languages: langs,
          users: [
            { id: su.id, role: 'waiter' },
            ...users.map((u) => ({ id: u.id, role: 'customer' as const })),
          ],
        });
      } catch (e) {
        console.error('openChat:ensureSessionUser', e);
        // No bloquear UI; el envío de mensajes validará sessionUser.
      }
    }
  }, [
    sessionStore,
    user?.id,
    profile,
    ensureSessionUser,
    sessionLanguages,
    hydrateViewerMessages,
  ]);

  useEffect(() => {
    if (!activeSessionId) return;
    if (!sessionLanguages.length) return;
    // Mantener store alineado a idiomas activos DB.
    sessionStore.setSession({
      sessionId: activeSessionId,
      servicePointId: sessionStore.servicePointId,
      role: 'waiter',
      profile: sessionStore.profile,
      sessionUser: sessionStore.sessionUser,
      languages: sessionLanguages,
      users: sessionStore.users,
    });
  }, [activeSessionId, sessionLanguages]);

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
        const langs = await refetchSessionLanguages();
        latestLanguagesRef.current = langs;
      } catch (e) {
        console.error('takeTable', e);
      }
    },
    [user, openChat, refetchSessionLanguages]
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
      sessionStore.clearSession();
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
  }, [finalizeBusy, sessionStore]);

  const sendMessage = useCallback(async () => {
    if (!activeSessionId || !text.trim() || !profile) return;
    const sessionId = sessionStore.sessionId ?? activeSessionId;
    if (!sessionId) throw new Error('No active session');
    if (!sessionStore.sessionUser?.id) {
      throw new Error('Waiter not linked to session');
    }
    const rawLang =
      sessionStore.sessionUser?.language?.trim() ||
      profile?.language?.trim() ||
      '';
    if (!rawLang) throw new Error('No user language');
    const sess = sessionsRef.current.find((s) => s.id === sessionId);
    if (!sess || sess.status !== 'active') return;

    try {
      const original = normalizeLanguageCode(rawLang);
      const { messages: fresh } = await handleSendMessage({
        insertRow: {
          session_id: sessionId,
          restaurant_id: sess.restaurant_id,
          sender: 'waiter',
          text: text.trim(),
          session_user_id: sessionStore.sessionUser.id,
          user_identifier: sessionStore.sessionUser.user_identifier,
          original_language: original,
        },
        latestLanguagesRef,
      });
      setMessages(fresh);
      setText('');
    } catch (e) {
      console.error('sendMessage', e);
    }
  }, [
    activeSessionId,
    text,
    profile,
    sessionStore.sessionId,
    sessionStore.sessionUser,
    handleSendMessage,
  ]);

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
