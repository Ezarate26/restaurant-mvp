'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { fetchMessagesByConversation } from '@/lib/model/messages.repository';
import { fetchActiveMembersByConversation } from '@/lib/model/conversation-members.repository';
import { REALTIME_CHANNEL_CONVERSATION } from '@/lib/model/realtime.constants';
import { clearActiveConversationSession } from '@/lib/utils/active-conversation-session';
import { ensureTranslationsForNewMessage } from '@/lib/model/message-translations.repository';
import { applyTranscriptionFallbackIfNeeded } from '@/lib/model/voice-transcription-fallback';
import type {
  Conversation,
  ConversationMember,
  Message,
  VoiceMessage,
} from '@/lib/model/types';

type TypingPayload = {
  conversation_id: string;
  member_id: string;
  display_name?: string;
  active?: boolean;
};

type RecordingPayload = {
  conversation_id: string;
  member_id: string;
  display_name?: string;
  active?: boolean;
};

type TypingUser = {
  memberId: string;
  displayName: string;
};

export interface UseChatRealtimeArgs {
  conversationId: string;
  memberId: string;
  member: ConversationMember | null;
  setMessages: React.Dispatch<React.SetStateAction<Message[]>>;
  setMembers: React.Dispatch<React.SetStateAction<ConversationMember[]>>;
  setMember: React.Dispatch<React.SetStateAction<ConversationMember | null>>;
  setConversation: React.Dispatch<React.SetStateAction<Conversation | null>>;
  setShowRegistrationPrompt: React.Dispatch<React.SetStateAction<boolean>>;
}

/**
 * Encapsula la suscripción Realtime de la conversación y la presencia
 * (typing / recording) + broadcasting. Extraído del ViewModel del chat
 * para mantener responsabilidades únicas (MVVM).
 */
export function useChatRealtime({
  conversationId,
  memberId,
  member,
  setMessages,
  setMembers,
  setMember,
  setConversation,
  setShowRegistrationPrompt,
}: UseChatRealtimeArgs) {
  const [typingUsers, setTypingUsers] = useState<TypingUser[]>([]);
  const [recordingUsers, setRecordingUsers] = useState<TypingUser[]>([]);

  const conversationIdRef = useRef(conversationId);
  const memberIdRef = useRef(memberId);
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);
  const typingTimeoutsRef = useRef<Map<string, ReturnType<typeof setTimeout>>>(
    new Map()
  );
  const recordingTimeoutsRef = useRef<
    Map<string, ReturnType<typeof setTimeout>>
  >(new Map());
  const lastTypingSentRef = useRef(0);

  useEffect(() => {
    conversationIdRef.current = conversationId;
  }, [conversationId]);

  useEffect(() => {
    const cid = conversationId;
    const mid = memberId;

    const channel = supabase
      .channel(`${REALTIME_CHANNEL_CONVERSATION}:${cid}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `conversation_id=eq.${cid}`,
        },
        (payload) => {
          const msg = payload.new as Message;
          setMessages((prev) =>
            prev.some((m) => m.id === msg.id) ? prev : [...prev, msg]
          );
          void ensureTranslationsForNewMessage(supabase, cid, msg).then(
            async () => {
              if (conversationIdRef.current !== cid) return;
              setMessages(await fetchMessagesByConversation(supabase, cid));
            }
          );
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'message_translations',
        },
        () => {
          void fetchMessagesByConversation(supabase, cid).then(setMessages);
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'messages',
          filter: `conversation_id=eq.${cid}`,
        },
        (payload) => {
          const msg = payload.new as Message;
          void ensureTranslationsForNewMessage(supabase, cid, msg).then(
            async () => {
              if (conversationIdRef.current !== cid) return;
              setMessages(await fetchMessagesByConversation(supabase, cid));
            }
          );
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'voice_messages',
        },
        async (payload) => {
          if (payload.eventType === 'UPDATE' && payload.new) {
            const voiceRow = payload.new as VoiceMessage;
            await applyTranscriptionFallbackIfNeeded(
              supabase,
              cid,
              voiceRow.message_id,
              voiceRow
            );
          }
          setMessages(await fetchMessagesByConversation(supabase, cid));
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'conversations',
          filter: `id=eq.${cid}`,
        },
        (payload) => {
          const conv = payload.new as Conversation;
          setConversation(conv);
          if (conv.status === 'closed') {
            clearActiveConversationSession();
            setMember((prev) => {
              if (!prev || prev.left_at) return prev;
              return {
                ...prev,
                left_at: conv.closed_at ?? new Date().toISOString(),
              };
            });
          }
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'conversation_members',
          filter: `conversation_id=eq.${cid}`,
        },
        async (payload) => {
          const updatedMembers = await fetchActiveMembersByConversation(
            supabase,
            cid
          );
          setMembers(updatedMembers);

          if (payload.eventType !== 'UPDATE' || !payload.new) return;

          const updated = payload.new as ConversationMember;
          if (updated.id !== memberIdRef.current) return;

          if (updated.left_at) {
            setMember(updated);
            clearActiveConversationSession();
            if (!updated.user_id) setShowRegistrationPrompt(true);
          }
        }
      )
      .on('broadcast', { event: 'recording' }, ({ payload }) => {
        const p = payload as RecordingPayload;
        if (p.conversation_id !== cid || p.member_id === mid) return;

        if (p.active === false) {
          setRecordingUsers((prev) =>
            prev.filter((u) => u.memberId !== p.member_id)
          );
          const t = recordingTimeoutsRef.current.get(p.member_id);
          if (t) {
            clearTimeout(t);
            recordingTimeoutsRef.current.delete(p.member_id);
          }
          return;
        }

        const displayName = p.display_name?.trim() || 'Alguien';
        setRecordingUsers((prev) => {
          const without = prev.filter((u) => u.memberId !== p.member_id);
          return [...without, { memberId: p.member_id, displayName }];
        });

        const existing = recordingTimeoutsRef.current.get(p.member_id);
        if (existing) clearTimeout(existing);
        recordingTimeoutsRef.current.set(
          p.member_id,
          setTimeout(() => {
            setRecordingUsers((prev) =>
              prev.filter((u) => u.memberId !== p.member_id)
            );
            recordingTimeoutsRef.current.delete(p.member_id);
          }, 5000)
        );
      })
      .on('broadcast', { event: 'typing' }, ({ payload }) => {
        const p = payload as TypingPayload;
        if (p.conversation_id !== cid || p.member_id === mid) return;

        if (p.active === false) {
          setTypingUsers((prev) =>
            prev.filter((u) => u.memberId !== p.member_id)
          );
          const t = typingTimeoutsRef.current.get(p.member_id);
          if (t) {
            clearTimeout(t);
            typingTimeoutsRef.current.delete(p.member_id);
          }
          return;
        }

        const displayName = p.display_name?.trim() || 'Alguien';
        setTypingUsers((prev) => {
          const without = prev.filter((u) => u.memberId !== p.member_id);
          return [...without, { memberId: p.member_id, displayName }];
        });

        const existing = typingTimeoutsRef.current.get(p.member_id);
        if (existing) clearTimeout(existing);
        typingTimeoutsRef.current.set(
          p.member_id,
          setTimeout(() => {
            setTypingUsers((prev) =>
              prev.filter((u) => u.memberId !== p.member_id)
            );
            typingTimeoutsRef.current.delete(p.member_id);
          }, 3500)
        );
      })
      .subscribe();

    channelRef.current = channel;
    return () => {
      typingTimeoutsRef.current.forEach((t) => clearTimeout(t));
      typingTimeoutsRef.current.clear();
      recordingTimeoutsRef.current.forEach((t) => clearTimeout(t));
      recordingTimeoutsRef.current.clear();
      void supabase.removeChannel(channel);
      channelRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [conversationId, memberId]);

  const broadcastRecording = useCallback(
    (active: boolean) => {
      const ch = channelRef.current;
      if (!ch || !member) return;
      void ch.send({
        type: 'broadcast',
        event: 'recording',
        payload: {
          conversation_id: conversationId,
          member_id: memberId,
          display_name: member.display_name?.trim() || 'Participante',
          active,
        },
      });
    },
    [conversationId, memberId, member]
  );

  const broadcastTyping = useCallback(
    (active: boolean) => {
      const ch = channelRef.current;
      if (!ch || !member) return;
      void ch.send({
        type: 'broadcast',
        event: 'typing',
        payload: {
          conversation_id: conversationId,
          member_id: memberId,
          display_name: member.display_name?.trim() || 'Participante',
          active,
        },
      });
    },
    [conversationId, memberId, member]
  );

  const notifyTyping = useCallback(() => {
    const now = Date.now();
    if (now - lastTypingSentRef.current < 1200) return;
    lastTypingSentRef.current = now;
    broadcastTyping(true);
  }, [broadcastTyping]);

  const notifyTypingStop = useCallback(() => {
    broadcastTyping(false);
  }, [broadcastTyping]);

  const typingLabel = useMemo(() => {
    if (typingUsers.length === 0) return null;
    if (typingUsers.length === 1) {
      return `${typingUsers[0].displayName} está escribiendo…`;
    }
    return `${typingUsers.length} personas están escribiendo…`;
  }, [typingUsers]);

  const recordingLabel = useMemo(() => {
    if (recordingUsers.length === 0) return null;
    if (recordingUsers.length === 1) {
      return `${recordingUsers[0].displayName} está grabando un mensaje de voz…`;
    }
    return `${recordingUsers.length} personas están grabando un mensaje de voz…`;
  }, [recordingUsers]);

  return {
    typingLabel,
    recordingLabel,
    notifyTyping,
    notifyTypingStop,
    broadcastRecording,
  };
}
