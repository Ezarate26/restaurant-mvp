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
import {
  fetchActiveSessionUsersBySession,
  upsertSessionUserByIdentifier,
  updateSessionUserLanguage,
  updateSessionUserProfile,
} from '@/lib/model/session-users.repository';
import { insertServiceRequest } from '@/lib/model/service-requests.repository';
import { REALTIME_CHANNEL_SESSION } from '@/lib/model/realtime.constants';
import { getOrCreateCustomerIdentifier } from '@/lib/utils/customerIdentifier';
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
}

export interface OptionalProfileDraft {
  displayName: string;
  username: string;
  email: string;
}

export function useCustomerChatViewModel({
  servicePointId,
  initialLanguageHint,
  preferredSessionId,
}: UseCustomerChatViewModelArgs) {
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
  const [profileDraft, setProfileDraft] = useState<OptionalProfileDraft>({
    displayName: '',
    username: '',
    email: '',
  });
  const [profileNotice, setProfileNotice] = useState<string | null>(null);

  const [lastReadAt, setLastReadAt] = useState<string | null>(null);
  const [typingIndicator, setTypingIndicator] = useState<string | null>(null);

  const sessionIdRef = useRef<string | null>(null);
  const sessionUsersRef = useRef<SessionUser[]>([]);
  const sessionChannelRef = useRef<ReturnType<typeof supabase.channel> | null>(
    null
  );
  const typingHideRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastTypingSentRef = useRef(0);

  useEffect(() => {
    sessionIdRef.current = session?.id ?? null;
  }, [session?.id]);

  useEffect(() => {
    sessionUsersRef.current = sessionUsers;
  }, [sessionUsers]);

  const flashTypingLine = useCallback((label: string) => {
    if (typingHideRef.current) clearTimeout(typingHideRef.current);
    setTypingIndicator(label);
    typingHideRef.current = setTimeout(() => {
      setTypingIndicator(null);
      typingHideRef.current = null;
    }, 2600);
  }, []);

  /** Fase 1: punto + sesión + session_user (sin mensajes ni realtime de chat). */
  useEffect(() => {
    let cancelled = false;
    setIsLoading(true);
    setError(null);
    setChatActive(false);
    setMessages([]);
    setSessionUsers([]);
    setSelectedLanguage(null);
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

        let sess: ServiceSession | null = null;
        if (preferredSessionId) {
          const pref = await fetchServiceSessionById(
            supabase,
            preferredSessionId
          );
          if (
            pref &&
            pref.status === 'active' &&
            pref.service_point_id === sp.id
          ) {
            sess = pref;
          }
        }
        if (!sess) {
          sess = await getOrCreateActiveSessionForPoint(supabase, sp, null);
        }
        if (cancelled) return;
        setSession(sess);

        const identifier = getOrCreateCustomerIdentifier();
        const su = await upsertSessionUserByIdentifier(supabase, {
          sessionId: sess.id,
          userIdentifier: identifier,
          language: null,
        });
        if (cancelled) return;
        setSessionUser(su);
        setProfileDraft({
          displayName: su.display_name?.trim() ?? '',
          username: su.username?.trim() ?? '',
          email: su.email?.trim() ?? '',
        });

        const fromDb = su.language?.trim() || null;
        const hint = initialLanguageHint?.trim() || null;
        setSelectedLanguage(fromDb ?? hint ?? null);

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
  }, [servicePointId, preferredSessionId, initialLanguageHint]);

  const hasOptionalProfileInput = useMemo(() => {
    return Boolean(
      profileDraft.displayName.trim() ||
        profileDraft.username.trim() ||
        profileDraft.email.trim()
    );
  }, [profileDraft.displayName, profileDraft.email, profileDraft.username]);

  const saveOptionalProfile = useCallback(async () => {
    const suId = sessionUser?.id;
    if (!suId) return { saved: false };

    const displayName = profileDraft.displayName.trim();
    const username = profileDraft.username.trim();
    const email = profileDraft.email.trim();
    const hasInput = Boolean(displayName || username || email);
    if (!hasInput) {
      setProfileNotice(null);
      return { saved: false };
    }

    const result = await updateSessionUserProfile(supabase, suId, {
      display_name: displayName || null,
      username: username || null,
      email: email || null,
      is_profile_completed: true,
    });

    if (result.ok) {
      setSessionUser(result.sessionUser);
      setProfileDraft({
        displayName: result.sessionUser.display_name?.trim() ?? '',
        username: result.sessionUser.username?.trim() ?? '',
        email: result.sessionUser.email?.trim() ?? '',
      });
      setProfileNotice(null);
      return { saved: true };
    }

    setProfileNotice(result.message);
    return { saved: false, reason: result.reason };
  }, [profileDraft.displayName, profileDraft.email, profileDraft.username, sessionUser?.id]);

  const selectLanguage = useCallback(async (code: string) => {
    setSelectedLanguage(code);
    const suId = sessionUser?.id;
    if (!suId) return;
    try {
      const updated = await updateSessionUserLanguage(supabase, suId, code);
      setSessionUser(updated);
    } catch (e) {
      console.error('selectLanguage', e);
    }
  }, [sessionUser?.id]);

  const confirmEnterChat = useCallback(async () => {
    if (!selectedLanguage?.trim() || !session) return;
    setIsConfirmingChat(true);
    setError(null);
    try {
      await saveOptionalProfile();
      if (sessionUser?.id) {
        await updateSessionUserLanguage(
          supabase,
          sessionUser.id,
          selectedLanguage.trim()
        );
      }
      const [msgs, users] = await Promise.all([
        fetchMessagesBySession(supabase, session.id),
        fetchActiveSessionUsersBySession(supabase, session.id),
      ]);
      setMessages(msgs);
      setSessionUsers(users);
      const tail = msgs.length > 0 ? msgs[msgs.length - 1]?.created_at : null;
      setLastReadAt(tail ?? new Date().toISOString());
      setChatActive(true);
    } catch (e) {
      console.error('confirmEnterChat', e);
      setError('No se pudo abrir el chat. Intenta de nuevo.');
    } finally {
      setIsConfirmingChat(false);
    }
  }, [saveOptionalProfile, selectedLanguage, session, sessionUser?.id]);

  useEffect(() => {
    if (!chatActive) return;
    const sid = session?.id;
    if (!sid || !sessionUser?.id) return;

    const showTypingFromPayload = (p: ChatTypingPayload) => {
      if (p.session_id !== sid) return;
      if (p.sender === 'customer' && p.user_id === sessionUser.id) return;

      if (p.sender === 'waiter') {
        flashTypingLine('Mesero está escribiendo…');
        return;
      }

      const su = sessionUsersRef.current.find((u) => u.id === p.user_id);
      const idLabel =
        su?.display_name?.trim() ||
        su?.username?.trim() ||
        su?.user_identifier?.trim();
      flashTypingLine(
        idLabel
          ? `Usuario ${idLabel} está escribiendo…`
          : 'Un usuario está escribiendo…'
      );
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
          setMessages((prev) => {
            if (prev.some((m) => m.id === msg.id)) return prev;
            return [...prev, msg];
          });
          setLastReadAt(new Date().toISOString());
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
          const row = payload.new as SessionUser | undefined;
          if (!row?.id) return;
          if (row.id === sessionUser?.id) {
            setSessionUser((prev) => (prev ? { ...prev, ...row } : row));
          }
          if (row.status === 'left') {
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
  }, [chatActive, session?.id, sessionUser?.id, flashTypingLine]);

  const notifyTyping = useCallback(() => {
    const ch = sessionChannelRef.current;
    const sid = session?.id;
    const suId = sessionUser?.id;
    if (!ch || !sid || !suId) return;
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
  }, [session?.id, sessionUser?.id]);

  const handleMessagesScroll = useCallback((e: UIEvent<HTMLDivElement>) => {
    const el = e.currentTarget;
    const nearBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 72;
    if (nearBottom) {
      setLastReadAt(new Date().toISOString());
    }
  }, []);

  const sendMessage = useCallback(async () => {
    if (!chatActive || !text.trim() || !session || !sessionUser) return;
    try {
      await insertMessage(supabase, {
        session_id: session.id,
        restaurant_id: session.restaurant_id,
        sender: 'customer',
        text: text.trim(),
        session_user_id: sessionUser.id,
        user_identifier: sessionUser.user_identifier,
      });
      setText('');
      setLastReadAt(new Date().toISOString());
      void touchSessionActivity(supabase, session.id);
    } catch (e) {
      console.error('sendMessage', e);
    }
  }, [chatActive, text, session, sessionUser]);

  const callWaiter = useCallback(async () => {
    if (!chatActive || !session || !sessionUser) return;
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
    profileDraft,
    setProfileDraft,
    hasOptionalProfileInput,
    saveOptionalProfile,
    profileNotice,
    setProfileNotice,
    lastReadAt,
    typingIndicator,
    notifyTyping,
    handleMessagesScroll,
  };
}
