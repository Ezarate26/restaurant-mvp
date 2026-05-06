'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { UIEvent } from 'react';
import { supabase } from '@/lib/supabase';
import {
  fetchMessagesBySession,
  insertMessage,
} from '@/lib/model/messages.repository';
import { fetchServicePointById } from '@/lib/model/service-points.repository';
import {
  fetchServiceSessionById,
  getOrCreateActiveSessionForPoint,
  touchSessionActivity,
} from '@/lib/model/service-sessions.repository';
import { fetchRestaurantDefaultLanguage } from '@/lib/model/restaurants.repository';
import {
  fetchActiveSessionUsersBySession,
  upsertSessionUserByIdentifier,
  updateSessionUserLanguage,
} from '@/lib/model/session-users.repository';
import { insertServiceRequest } from '@/lib/model/service-requests.repository';
import { REALTIME_CHANNEL_SESSION } from '@/lib/model/realtime.constants';
import { getOrCreateCustomerIdentifier } from '@/lib/utils/customerIdentifier';
import { fetchProfileByUserId } from '@/lib/model/profiles.repository';
import {
  sessionUserArrivalIndex,
  staffBubbleHeaderFromFullName,
} from '@/lib/utils/session-user-display-name';
import { isTechnicalUserIdentifier, paddedUsuarioOrder } from '@/lib/utils/user-identifier';
import {
  loadChatSnapshot,
  resolvePreferredLanguage,
  type LoginCustomerResponse,
} from '@/lib/viewmodels/customer-chat.helpers';
import { useSessionStore } from '@/lib/stores/sessionStore';
import { ensureTranslationsForNewMessage } from '@/lib/model/message-translations.repository';
import { normalizeLanguageCode } from '@/constants/languages';
import { useSessionLanguages } from '@/lib/hooks/useSessionLanguages';
import { useMessageSender } from '@/lib/hooks/useMessageSender';
import type {
  Message,
  ServicePoint,
  ServiceSession,
  SessionUser,
} from '@/lib/model/types';

type ChatTypingPayload = {
  session_id: string;
  user_id: string;
  sender: 'customer' | 'waiter';
};

export interface UseCustomerChatViewModelArgs {
  servicePointId: string;
  initialLanguageHint?: string | null;
  preferredSessionId?: string | null;
  /** Query `open_chat=1` tras completar registro: inicia sesión + entra al chat. */
  autoOpenChatAfterLoad?: boolean;
  /**
   * Tras cerrar/finalizar conversación: quitar `session` y `open_chat` de la URL
   * para no reutilizar una sesión cerrada ni crear otra al volver al “inicio” QR/mesa.
   */
  clearCustomerUrlAfterSessionEnd?: () => void;
}

function stripOpenChatQueryParam(): void {
  if (typeof window === 'undefined') return;
  try {
    const u = new URL(window.location.href);
    if (!u.searchParams.has('open_chat')) return;
    u.searchParams.delete('open_chat');
    const next = `${u.pathname}${u.search}${u.hash}`;
    window.history.replaceState({}, '', next);
  } catch {
    /* noop */
  }
}

export function useCustomerChatViewModel({
  servicePointId,
  initialLanguageHint,
  preferredSessionId,
  autoOpenChatAfterLoad = false,
  clearCustomerUrlAfterSessionEnd,
}: UseCustomerChatViewModelArgs) {
  const sessionStore = useSessionStore();
  const [point, setPoint] = useState<ServicePoint | null>(null);
  const [session, setSession] = useState<ServiceSession | null>(null);
  const [sessionUser, setSessionUser] = useState<SessionUser | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [sessionUsers, setSessionUsers] = useState<SessionUser[]>([]);
  const [text, setText] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [chatActive, setChatActive] = useState(false);
  const [selectedLanguage, setSelectedLanguage] = useState<string | null>(null);
  const [isConfirmingChat, setIsConfirmingChat] = useState(false);
  const [profileNotice, setProfileNotice] = useState<string | null>(null);
  const [leaveChatBusy, setLeaveChatBusy] = useState(false);
  const [newSessionBusy, setNewSessionBusy] = useState(false);
  const [loginBusy, setLoginBusy] = useState(false);
  /** Encabezado en burbujas del mesero (vista cliente), desde `profiles.full_name`. */
  const [assignedStaffHeader, setAssignedStaffHeader] = useState<string | null>(
    null
  );
  const [restaurantDefaultLanguage, setRestaurantDefaultLanguage] =
    useState<string>('es');

  const [lastReadAt, setLastReadAt] = useState<string | null>(null);
  const [typingIndicator, setTypingIndicator] = useState<string | null>(null);
  const {
    languages: sessionLanguages,
    refetchSessionLanguages,
  } = useSessionLanguages(chatActive ? session?.id ?? null : null);

  const { handleSendMessage, hydrateViewerMessages } = useMessageSender();

  const sessionIdRef = useRef<string | null>(null);
  const latestLanguagesRef = useRef<string[]>([]);
  const sessionUsersRef = useRef<SessionUser[]>([]);
  const sessionChannelRef = useRef<ReturnType<typeof supabase.channel> | null>(
    null
  );
  const typingHideRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastTypingSentRef = useRef(0);
  const assignedStaffHeaderRef = useRef<string | null>(null);
  const autoOpenChatAttemptedRef = useRef(false);

  useEffect(() => {
    sessionIdRef.current = session?.id ?? null;
  }, [session?.id]);

  useEffect(() => {
    sessionUsersRef.current = sessionUsers;
  }, [sessionUsers]);

  useEffect(() => {
    latestLanguagesRef.current = sessionLanguages;
  }, [sessionLanguages]);

  useEffect(() => {
    if (!chatActive || !session?.id) return;
    if (!sessionLanguages.length) return;
    sessionStore.setSession({
      sessionId: session.id,
      servicePointId: point?.id ?? null,
      role: 'customer',
      profile: sessionStore.profile,
      sessionUser: sessionStore.sessionUser ?? sessionUser,
      languages: sessionLanguages,
      users: sessionStore.users,
    });
  }, [
    chatActive,
    session?.id,
    sessionUser,
    sessionLanguages,
    sessionStore,
    point?.id,
  ]);

  /** Aviso tipo banner (p. ej. correo enviado): desaparece solo a los 5 s. */
  useEffect(() => {
    if (!profileNotice?.trim()) return;
    const id = window.setTimeout(() => setProfileNotice(null), 5000);
    return () => window.clearTimeout(id);
  }, [profileNotice]);

  useEffect(() => {
    assignedStaffHeaderRef.current = assignedStaffHeader;
  }, [assignedStaffHeader]);

  useEffect(() => {
    const aid = session?.assigned_to?.trim();
    if (!aid) {
      setAssignedStaffHeader(null);
      return;
    }
    let cancelled = false;
    void (async () => {
      try {
        const p = await fetchProfileByUserId(supabase, aid);
        if (cancelled) return;
        setAssignedStaffHeader(staffBubbleHeaderFromFullName(p?.full_name));
      } catch {
        if (!cancelled) {
          setAssignedStaffHeader(null);
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [session?.assigned_to]);

  const flashTypingLine = useCallback((label: string) => {
    if (typingHideRef.current) clearTimeout(typingHideRef.current);
    setTypingIndicator(label);
    typingHideRef.current = setTimeout(() => {
      setTypingIndicator(null);
      typingHideRef.current = null;
    }, 2600);
  }, []);

  /**
   * Solo cargamos el punto de servicio. La fila `service_sessions` y `session_users`
   * se crean al habilitar el chat (Ordenar ahora, login o datos que abren conversación).
   */
  useEffect(() => {
    let cancelled = false;
    setIsLoading(true);
    setError(null);
    setChatActive(false);
    setMessages([]);
    setSessionUsers([]);
    setSession(null);
    setSessionUser(null);
    setLastReadAt(null);
    setTypingIndicator(null);

    const init = async () => {
      try {
        const sp = await fetchServicePointById(supabase, servicePointId);
        if (cancelled) return;
        if (!sp) {
          setError('Punto no encontrado');
          setIsLoading(false);
          return;
        }
        setPoint(sp);
        const hint = initialLanguageHint?.trim() || null;
        setSelectedLanguage(hint || 'es');

        try {
          const defLang = await fetchRestaurantDefaultLanguage(
            supabase,
            sp.restaurant_id
          );
          if (!cancelled) setRestaurantDefaultLanguage(defLang);
        } catch {
          if (!cancelled) setRestaurantDefaultLanguage('es');
        }

        setIsLoading(false);
      } catch (e) {
        if (cancelled) return;
        console.error('useCustomerChatViewModel:init', e);
        setError('Error inicializando la sesión');
        setIsLoading(false);
      }
    };

    void init();
    return () => {
      cancelled = true;
    };
  }, [servicePointId, initialLanguageHint]);

  useEffect(() => {
    autoOpenChatAttemptedRef.current = false;
  }, [servicePointId, preferredSessionId, autoOpenChatAfterLoad]);

  const selectLanguage = useCallback(
    async (code: string) => {
      setSelectedLanguage(code);
      const suId = sessionUser?.id;
      if (!suId) return;
      try {
        const updated = await updateSessionUserLanguage(supabase, suId, code);
        setSessionUser(updated);
        const sid = session?.id;
        if (chatActive && sid) {
          const norm = normalizeLanguageCode(code);
          const { messages: hydrated } = await hydrateViewerMessages({
            sessionId: sid,
            viewerLanguage: norm,
            latestLanguagesRef,
          });
          setMessages(hydrated);
        }
      } catch (e) {
        console.error('selectLanguage', e);
      }
    },
    [
      sessionUser?.id,
      session?.id,
      chatActive,
      hydrateViewerMessages,
    ]
  );

  const ensureSessionAndParticipant = useCallback(async (): Promise<{
    session: ServiceSession;
    sessionUser: SessionUser;
  }> => {
    if (!point) {
      throw new Error('Punto no disponible');
    }
    const lang =
      selectedLanguage?.trim() ||
      initialLanguageHint?.trim() ||
      'es';

    let sess: ServiceSession | null = null;
    if (preferredSessionId?.trim()) {
      const pref = await fetchServiceSessionById(
        supabase,
        preferredSessionId.trim()
      );
      if (
        pref &&
        pref.status === 'active' &&
        pref.service_point_id === point.id
      ) {
        sess = pref;
      }
    }
    if (!sess) {
      sess = await getOrCreateActiveSessionForPoint(supabase, point, lang);
    }

    const identifier = getOrCreateCustomerIdentifier();
    const su = await upsertSessionUserByIdentifier(supabase, {
      sessionId: sess.id,
      userIdentifier: identifier,
      language: lang,
    });

    setSession(sess);
    setSessionUser(su);
    setSelectedLanguage(lang);
    sessionStore.setSession({
      sessionId: sess.id,
      servicePointId: point.id,
      role: 'customer',
      users: [{ id: su.id, role: 'customer' }],
    });

    return { session: sess, sessionUser: su };
  }, [point, preferredSessionId, selectedLanguage, initialLanguageHint, sessionStore]);

  const confirmEnterChat = useCallback(async () => {
    if (!point) {
      setError('Punto no disponible');
      return;
    }
    const lang =
      selectedLanguage?.trim() ||
      initialLanguageHint?.trim() ||
      'es';
    setIsConfirmingChat(true);
    setError(null);
    setProfileNotice(null);
    try {
      const { session: sess, sessionUser: su } =
        await ensureSessionAndParticipant();
      const updated = await updateSessionUserLanguage(supabase, su.id, lang);
      setSessionUser(updated);
      setSelectedLanguage(lang);
      const snapshot = await loadChatSnapshot(supabase, sess.id);
      setMessages(snapshot.messages);
      setSessionUsers(snapshot.sessionUsers);
      setLastReadAt(snapshot.lastReadAt);
      setChatActive(true);
      const viewLang = normalizeLanguageCode(
        updated.language?.trim() || lang
      );
      try {
        const { messages: hydrated } = await hydrateViewerMessages({
          sessionId: sess.id,
          viewerLanguage: viewLang,
          latestLanguagesRef,
        });
        setMessages(hydrated);
      } catch (hydrateErr) {
        console.error('confirmEnterChat:hydrateViewer', hydrateErr);
      }
    } catch (e) {
      console.error('confirmEnterChat', e);
      setError('No se pudo abrir el chat. Intenta de nuevo.');
    } finally {
      setIsConfirmingChat(false);
    }
  }, [
    point,
    selectedLanguage,
    initialLanguageHint,
    ensureSessionAndParticipant,
    hydrateViewerMessages,
  ]);

  const loginCustomerAccount = useCallback(
    async (email: string, password: string) => {
      if (!point?.restaurant_id) {
        throw new Error('Punto no disponible. Espera un momento e intenta de nuevo.');
      }
      setLoginBusy(true);
      setError(null);
      try {
        let sid = session?.id ?? null;
        let suId = sessionUser?.id ?? null;

        const restaurantId = point.restaurant_id;

        let deviceId: string | null = null;
        try {
          deviceId = getOrCreateCustomerIdentifier();
        } catch {
          deviceId = null;
        }

        const lang =
          selectedLanguage?.trim() ||
          initialLanguageHint?.trim() ||
          'es';

        let data: LoginCustomerResponse;

        if (sid && suId) {
          const res = await fetch('/api/customer/login-customer', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              sessionUserId: suId,
              sessionId: sid,
              restaurantId,
              email,
              password,
              deviceId,
              language: lang,
            }),
          });
          data = (await res.json()) as LoginCustomerResponse;
          if (!res.ok) {
            const msg = [data.error, data.detail].filter(Boolean).join(' — ');
            throw new Error(msg || 'No se pudo iniciar sesión');
          }
          if (data.session) {
            setSession(data.session);
            sid = data.session.id;
          }
        } else {
          const res = await fetch('/api/customer/login-customer', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              restaurantId,
              servicePointId: point.id,
              preferredSessionId: preferredSessionId?.trim() || null,
              language: lang,
              email,
              password,
              deviceId,
            }),
          });
          data = (await res.json()) as LoginCustomerResponse;
          if (!res.ok) {
            const msg = [data.error, data.detail].filter(Boolean).join(' — ');
            throw new Error(msg || 'No se pudo iniciar sesión');
          }
          if (!data.session || !data.sessionUser) {
            throw new Error('Respuesta incompleta del servidor al iniciar sesión');
          }
          setSession(data.session);
          setSessionUser(data.sessionUser);
          sid = data.session.id;
          suId = data.sessionUser.id;
        }

        if (data.sessionUser) {
          setSessionUser(data.sessionUser);
        }

        setProfileNotice('Bienvenido de nuevo 👋');

        if (sid) {
          if (!chatActive) {
            const lang = resolvePreferredLanguage({
              selectedLanguage,
              sessionUserLanguage: data.sessionUser?.language ?? null,
              initialLanguageHint,
            });
            try {
              let customerSu = data.sessionUser as SessionUser;
              if (data.sessionUser?.id) {
                const updated = await updateSessionUserLanguage(
                  supabase,
                  data.sessionUser.id,
                  lang
                );
                customerSu = updated;
                setSessionUser(updated);
                setSelectedLanguage(lang);
              }
              const snapshot = await loadChatSnapshot(supabase, sid);
              setMessages(snapshot.messages);
              setSessionUsers(snapshot.sessionUsers);
              setLastReadAt(snapshot.lastReadAt);
              setChatActive(true);
              const langNorm = normalizeLanguageCode(
                customerSu.language?.trim() || lang
              );
              const { messages: syncedMessages } =
                await hydrateViewerMessages({
                  sessionId: sid,
                  viewerLanguage: langNorm,
                  latestLanguagesRef,
                });
              setMessages(syncedMessages);
              if (customerSu.id) {
                sessionStore.setSession({
                  sessionId: sid,
                  servicePointId: point.id,
                  role: 'customer',
                  users: [{ id: customerSu.id, role: 'customer' }],
                  languages: latestLanguagesRef.current.length
                    ? latestLanguagesRef.current
                    : [langNorm],
                });
              }
            } catch (e) {
              console.error('loginCustomerAccount:openChat', e);
              setError('No se pudo abrir el chat. Pulsa «Ordenar ahora».');
            }
          } else {
            try {
              const prefLang = resolvePreferredLanguage({
                selectedLanguage,
                sessionUserLanguage: data.sessionUser?.language ?? null,
                initialLanguageHint,
              });
              let customerSu = data.sessionUser as SessionUser;
              if (prefLang && data.sessionUser?.id) {
                const updated = await updateSessionUserLanguage(
                  supabase,
                  data.sessionUser.id,
                  prefLang
                );
                customerSu = updated;
                setSessionUser(updated);
                setSelectedLanguage(prefLang);
              }
              const users = await fetchActiveSessionUsersBySession(
                supabase,
                sid
              );
              setSessionUsers(users);
              const langNorm = normalizeLanguageCode(
                customerSu.language?.trim() ||
                  prefLang ||
                  lang ||
                  'es'
              );
              const { messages: syncedMessages } =
                await hydrateViewerMessages({
                  sessionId: sid,
                  viewerLanguage: langNorm,
                  latestLanguagesRef,
                });
              setMessages(syncedMessages);
              sessionStore.setSession({
                sessionId: sid,
                servicePointId: point.id,
                role: 'customer',
                users: [{ id: customerSu.id, role: 'customer' }],
                languages: latestLanguagesRef.current.length
                  ? latestLanguagesRef.current
                  : [langNorm],
              });
            } catch (e) {
              console.error('loginCustomerAccount:refreshUsers', e);
            }
          }
        }
      } finally {
        setLoginBusy(false);
      }
    },
    [
      session?.id,
      session?.restaurant_id,
      sessionUser?.id,
      point?.id,
      point?.restaurant_id,
      preferredSessionId,
      chatActive,
      selectedLanguage,
      initialLanguageHint,
      sessionStore,
      hydrateViewerMessages,
    ]
  );

  /** Vuelve a la pantalla previa al chat sin filas de sesión en memoria (como recién escaneado QR). */
  const resetToPreorderAfterSessionEnd = useCallback(() => {
    setTypingIndicator(null);
    setSessionUsers([]);
    setMessages([]);
    setChatActive(false);
    setSession(null);
    setSessionUser(null);
    setText('');
    setLastReadAt(null);
    sessionStore.clearSession();
    clearCustomerUrlAfterSessionEnd?.();
  }, [clearCustomerUrlAfterSessionEnd, sessionStore]);

  useEffect(() => {
    if (!autoOpenChatAfterLoad || autoOpenChatAttemptedRef.current) return;
    if (isLoading || chatActive) return;
    if (!point) return;

    autoOpenChatAttemptedRef.current = true;

    void (async () => {
      try {
        await confirmEnterChat();
        stripOpenChatQueryParam();
      } catch (e) {
        console.error('autoOpenChatAfterRegistration', e);
        autoOpenChatAttemptedRef.current = true;
        stripOpenChatQueryParam();
        setError(
          e instanceof Error
            ? e.message
            : 'No se pudo abrir el chat automáticamente. Pulsa «Ordenar ahora» o inicia sesión.'
        );
      }
    })();
  }, [
    autoOpenChatAfterLoad,
    isLoading,
    chatActive,
    point,
    loginCustomerAccount,
    confirmEnterChat,
  ]);

  useEffect(() => {
    if (!chatActive) return;
    const sid = session?.id;
    if (!sid || !sessionUser?.id) return;

    const showTypingFromPayload = (p: ChatTypingPayload) => {
      if (p.session_id !== sid) return;
      if (p.sender === 'customer' && p.user_id === sessionUser.id) return;

      if (p.sender === 'waiter') {
        const h = assignedStaffHeaderRef.current;
        const first = h?.includes(' · ') ? h.split(' · ')[0]?.trim() : null;
        flashTypingLine(
          first ? `${first} está escribiendo…` : 'Personal está escribiendo…'
        );
        return;
      }

      const users = sessionUsersRef.current;
      const su = users.find((u) => u.id === p.user_id);
      if (su) {
        const idx = sessionUserArrivalIndex(users, su.id) ?? 1;
        const idf = su.user_identifier?.trim();
        const name =
          su.display_name?.trim() ||
          su.username?.trim() ||
          (idf && !isTechnicalUserIdentifier(idf) ? idf : paddedUsuarioOrder(idx));
        flashTypingLine(`${name} está escribiendo…`);
      } else {
        flashTypingLine('Un usuario está escribiendo…');
      }
    };

    const channel = supabase
      .channel(`${REALTIME_CHANNEL_SESSION}:${sid}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `session_id=eq.${sid}`,
        },
        (payload) => {
          const msg = payload.new as Message;
          if (
            msg.sender !== 'system' &&
            (!msg.session_user_id || !msg.user_identifier || !msg.original_language)
          ) {
            return;
          }
          setMessages((prev) => {
            if (prev.some((m) => m.id === msg.id)) return prev;
            return [...prev, msg];
          });
          setLastReadAt(new Date().toISOString());

          void (async () => {
            try {
              await ensureTranslationsForNewMessage(supabase, sid, msg);
              if (sessionIdRef.current !== sid) return;
              const fresh = await fetchMessagesBySession(supabase, sid);
              if (sessionIdRef.current !== sid) return;
              setMessages(fresh);
            } catch (e) {
              console.error('ensureTranslationsForNewMessage:message-insert', e);
            }
          })();
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
              if (next.some((x) => (x.language ?? '').trim().toLowerCase() === lang)) {
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
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'service_sessions',
          filter: `id=eq.${sid}`,
        },
        (payload) => {
          const row = payload.new as ServiceSession | undefined;
          if (!row?.id) return;
          if (row.status === 'closed') {
            resetToPreorderAfterSessionEnd();
            return;
          }
          setSession((prev) =>
            prev?.id === row.id ? { ...prev, ...row } : prev
          );
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'session_users',
          filter: `session_id=eq.${sid}`,
        },
        (payload) => {
          if (payload.eventType === 'DELETE') {
            const old = payload.old as Partial<SessionUser> | undefined;
            if (!old?.id) return;
            setSessionUsers((prev) => prev.filter((u) => u.id !== old.id));
            return;
          }
          if (payload.eventType === 'INSERT') {
            void (async () => {
              try {
                const langs = await refetchSessionLanguages();
                latestLanguagesRef.current = langs;
              } catch (e) {
                console.error('refetchSessionLanguages:session-users-insert', e);
              }
            })();
          }
          const row = payload.new as SessionUser | undefined;
          if (!row?.id) return;
          if (row.id === sessionUser?.id) {
            setSessionUser((prev) => (prev ? { ...prev, ...row } : row));
          }
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
      .on('broadcast', { event: 'typing' }, ({ payload }) => {
        const p = payload as ChatTypingPayload;
        if (!p?.session_id || !p.user_id || !p.sender) return;
        showTypingFromPayload(p);
      })
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          sessionChannelRef.current = channel;
        }
      });

    return () => {
      sessionChannelRef.current = null;
      supabase.removeChannel(channel);
    };
  }, [
    chatActive,
    session?.id,
    sessionUser?.id,
    flashTypingLine,
    resetToPreorderAfterSessionEnd,
    refetchSessionLanguages,
  ]);

  const notifyTyping = useCallback(() => {
    const ch = sessionChannelRef.current;
    const sid = session?.id;
    const suId = sessionUser?.id;
    if (!ch || !sid || !suId) return;
    if (session?.status === 'closed' || sessionUser?.status === 'left') return;
    const now = Date.now();
    if (now - lastTypingSentRef.current < 850) return;
    lastTypingSentRef.current = now;
    void ch.send({
      type: 'broadcast',
      event: 'typing',
      payload: {
        session_id: sid,
        user_id: suId,
        sender: 'customer',
      } satisfies ChatTypingPayload,
    });
  }, [session?.id, session?.status, sessionUser?.id, sessionUser?.status]);

  const handleMessagesScroll = useCallback((e: UIEvent<HTMLDivElement>) => {
    const el = e.currentTarget;
    const nearBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 72;
    if (nearBottom) {
      setLastReadAt(new Date().toISOString());
    }
  }, []);

  const sendMessage = useCallback(async () => {
    if (!chatActive || !text.trim() || !session || !sessionUser) return;
    if (session.status === 'closed' || sessionUser.status === 'left') return;
    const body = text.trim();
    const sessionId = sessionStore.sessionId ?? session.id;
    if (!sessionId) throw new Error('No active session');
    if (!sessionUser?.id) throw new Error('No session user');
    const rawLang =
      sessionUser.language?.trim() ||
      selectedLanguage?.trim() ||
      initialLanguageHint?.trim() ||
      '';
    if (!rawLang) throw new Error('No user language');
    const original = normalizeLanguageCode(rawLang);
    try {
      const { messages: updatedMessages } = await handleSendMessage({
        insertRow: {
          session_id: sessionId,
          restaurant_id: session.restaurant_id,
          sender: 'customer',
          text: body,
          session_user_id: sessionUser.id,
          user_identifier: sessionUser.user_identifier,
          original_language: original,
        },
        latestLanguagesRef,
      });
      setMessages(updatedMessages);
      if (!session.assigned_to) {
        try {
          await insertServiceRequest(supabase, {
            restaurant_id: session.restaurant_id,
            service_session_id: session.id,
            type: 'message',
            message:
              body.length > 140 ? `${body.slice(0, 137)}…` : body,
          });
        } catch (reqErr) {
          console.error('sendMessage:serviceRequest', reqErr);
        }
      }
      setText('');
      setLastReadAt(new Date().toISOString());
      void touchSessionActivity(supabase, sessionId);
    } catch (e) {
      console.error('sendMessage', e);
    }
  }, [
    chatActive,
    text,
    session,
    sessionUser,
    selectedLanguage,
    initialLanguageHint,
    sessionStore.sessionId,
    handleSendMessage,
  ]);

  const callWaiter = useCallback(async () => {
    if (!chatActive || !session || !sessionUser) return;
    if (session.status === 'closed' || sessionUser.status === 'left') return;
    try {
      await insertServiceRequest(supabase, {
        restaurant_id: session.restaurant_id,
        service_session_id: session.id,
        type: 'call',
        message: 'Solicitan atención',
      });
      await insertMessage(supabase, {
        session_id: session.id,
        restaurant_id: session.restaurant_id,
        sender: 'system',
        text: '🔔 Solicitan atención',
        session_user_id: sessionUser.id,
        user_identifier: sessionUser.user_identifier,
      });
      void touchSessionActivity(supabase, session.id);
    } catch (e) {
      console.error('callWaiter', e);
    }
  }, [chatActive, session, sessionUser]);

  /** Cierra la sesión para todos vía API admin (el cliente anónimo no puede pasar RLS en mesa). */
  const closeSessionForEveryone = useCallback(async () => {
    if (!session?.id || !sessionUser?.id || !session.restaurant_id) return;
    if (session.status === 'closed' || sessionUser.status === 'left') return;
    setLeaveChatBusy(true);
    setError(null);
    try {
      const res = await fetch('/api/customer/close-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId: session.id,
          sessionUserId: sessionUser.id,
          restaurantId: session.restaurant_id,
        }),
      });
      const data = (await res.json()) as { error?: string; ok?: boolean };
      if (!res.ok) {
        throw new Error(data.error ?? 'No se pudo cerrar la sesión');
      }
      resetToPreorderAfterSessionEnd();
    } catch (e) {
      console.error('closeSessionForEveryone', e);
      setError(
        e instanceof Error
          ? e.message
          : 'No se pudo cerrar la sesión. Intenta de nuevo.'
      );
      throw e;
    } finally {
      setLeaveChatBusy(false);
    }
  }, [
    session?.id,
    session?.status,
    session?.restaurant_id,
    sessionUser?.id,
    sessionUser?.status,
    resetToPreorderAfterSessionEnd,
  ]);

  /** Ya no crea sesión vacía: solo asegura estado “inicio QR” (la sesión nueva va con «Ordenar ahora»). */
  const startNewSessionAfterClose = useCallback(async () => {
    setNewSessionBusy(true);
    setError(null);
    try {
      resetToPreorderAfterSessionEnd();
    } finally {
      setNewSessionBusy(false);
    }
  }, [resetToPreorderAfterSessionEnd]);

  const chatComposerDisabled = useMemo(() => {
    if (!chatActive) return true;
    if (session?.status === 'closed') return true;
    if (sessionUser?.status === 'left') return true;
    return false;
  }, [chatActive, session?.status, sessionUser?.status]);

  const closureBanner = useMemo(() => {
    if (!chatActive) return null;
    if (session?.status === 'closed') {
      return 'Esta conversación ha finalizado';
    }
    if (sessionUser?.status === 'left') {
      return 'Saliste de esta conversación o la mesa finalizó. Ya no puedes enviar mensajes.';
    }
    return null;
  }, [chatActive, session?.status, sessionUser?.status]);

  const showStartNewSession = useMemo(
    () => Boolean(chatActive && session?.status === 'closed'),
    [chatActive, session?.status]
  );

  const headerLabel = useMemo(() => point?.name ?? 'Sesión', [point?.name]);

  return {
    point,
    session,
    sessionUser,
    sessionUsers,
    messages,
    text,
    setText,
    sendMessage,
    callWaiter,
    headerLabel,
    isLoading,
    error,
    chatActive,
    selectedLanguage,
    selectLanguage,
    confirmEnterChat,
    isConfirmingChat,
    profileNotice,
    setProfileNotice,
    loginCustomerAccount,
    loginBusy,
    lastReadAt,
    typingIndicator,
    /** Encabezado en burbujas del mesero (p. ej. "María · Personal"). */
    assignedStaffHeader,
    notifyTyping,
    handleMessagesScroll,
    closeSessionForEveryone,
    leaveChatBusy,
    startNewSessionAfterClose,
    newSessionBusy,
    chatComposerDisabled,
    closureBanner,
    showStartNewSession,
  };
}
