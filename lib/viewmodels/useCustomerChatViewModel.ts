'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
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

export interface UseCustomerChatViewModelArgs {
  servicePointId: string;
  /** Sugerencia desde `?lang=` — solo preselecciona UI; el chat sigue cerrado hasta confirmar. */
  initialLanguageHint?: string | null;
  /** Si el QR pegaba a una sesión concreta y sigue activa en este punto. */
  preferredSessionId?: string | null;
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

  const sessionIdRef = useRef<string | null>(null);

  useEffect(() => {
    sessionIdRef.current = session?.id ?? null;
  }, [session?.id]);

  /** Fase 1: punto + sesión + session_user (sin mensajes ni realtime de chat). */
  useEffect(() => {
    let cancelled = false;
    setIsLoading(true);
    setError(null);
    setChatActive(false);
    setMessages([]);
    setSessionUsers([]);
    setSelectedLanguage(null);

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
      setChatActive(true);
    } catch (e) {
      console.error('confirmEnterChat', e);
      setError('No se pudo abrir el chat. Intenta de nuevo.');
    } finally {
      setIsConfirmingChat(false);
    }
  }, [selectedLanguage, session, sessionUser?.id]);

  useEffect(() => {
    if (!chatActive) return;
    const sid = session?.id;
    if (!sid) return;

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
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [chatActive, session?.id]);

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
      void touchSessionActivity(supabase, session.id);
    } catch (e) {
      console.error('sendMessage', e);
    }
  }, [chatActive, text, session, sessionUser]);

  const callWaiter = useCallback(async () => {
    if (!chatActive || !session) return;
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
        session_user_id: sessionUser?.id ?? null,
        user_identifier: sessionUser?.user_identifier ?? null,
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
  };
}
