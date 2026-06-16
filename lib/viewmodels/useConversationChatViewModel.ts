'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { supabase } from '@/lib/supabase';
import {
  closeConversationRecord,
  fetchConversationById,
} from '@/lib/model/conversations-table.repository';
import { fetchMessagesByConversation } from '@/lib/model/messages.repository';
import {
  expelMemberByOwner,
  fetchActiveMembersByConversation,
  fetchMemberById,
  markAllMembersLeft,
  markMemberLeft,
  updateMemberLanguage,
} from '@/lib/model/conversation-members.repository';
import { REALTIME_CHANNEL_CONVERSATION } from '@/lib/model/realtime.constants';
import { ensureTranslationsForNewMessage } from '@/lib/model/message-translations.repository';
import {
  applyTranscriptionFallbackIfNeeded,
  applyTranscriptionFallbacksForMessages,
} from '@/lib/model/voice-transcription-fallback';
import {
  clearActiveConversationSession,
  setActiveConversationSession,
} from '@/lib/utils/active-conversation-session';
import { normalizeLanguageCode } from '@/constants/languages';
import { useConversationLanguages } from '@/lib/hooks/useConversationLanguages';
import { useMessageSender } from '@/lib/hooks/useMessageSender';
import { useVoiceRecorder } from '@/lib/hooks/useVoiceRecorder';
import type { Conversation, ConversationMember, Message, VoiceMessage } from '@/lib/model/types';

export interface UseConversationChatViewModelArgs {
  conversationId: string;
  memberId: string;
  preferredLanguage: string;
}

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

export function useConversationChatViewModel({
  conversationId,
  memberId,
  preferredLanguage,
}: UseConversationChatViewModelArgs) {
  const [conversation, setConversation] = useState<Conversation | null>(null);
  const [member, setMember] = useState<ConversationMember | null>(null);
  const [members, setMembers] = useState<ConversationMember[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [text, setText] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [leaveBusy, setLeaveBusy] = useState(false);
  const [expelBusy, setExpelBusy] = useState(false);
  const [showRegistrationPrompt, setShowRegistrationPrompt] = useState(false);
  const [lastReadAt, setLastReadAt] = useState<string | null>(null);
  const [typingUsers, setTypingUsers] = useState<TypingUser[]>([]);
  const [recordingUsers, setRecordingUsers] = useState<TypingUser[]>([]);
  const [voiceBusy, setVoiceBusy] = useState(false);
  const [participantsOpen, setParticipantsOpen] = useState(false);

  const conversationIdRef = useRef(conversationId);
  const memberIdRef = useRef(memberId);
  const latestLanguagesRef = useRef<string[]>([]);
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);
  const typingTimeoutsRef = useRef<Map<string, ReturnType<typeof setTimeout>>>(
    new Map()
  );
  const recordingTimeoutsRef = useRef<
    Map<string, ReturnType<typeof setTimeout>>
  >(new Map());
  const lastTypingSentRef = useRef(0);

  const { languages: conversationLanguages } =
    useConversationLanguages(conversationId);
  const { handleSendMessage, handleSendVoiceMessage, hydrateViewerMessages } =
    useMessageSender();
  const voiceRecorder = useVoiceRecorder();

  useEffect(() => {
    conversationIdRef.current = conversationId;
  }, [conversationId]);

  useEffect(() => {
    latestLanguagesRef.current = conversationLanguages;
  }, [conversationLanguages]);

  useEffect(() => {
    let cancelled = false;
    setIsLoading(true);
    setError(null);

    void (async () => {
      try {
        const [conv, mem, mems, msgs] = await Promise.all([
          fetchConversationById(supabase, conversationId),
          fetchMemberById(supabase, memberId),
          fetchActiveMembersByConversation(supabase, conversationId),
          fetchMessagesByConversation(supabase, conversationId),
        ]);
        if (cancelled) return;
        if (!conv || !mem || mem.left_at) {
          setError('Conversación no encontrada');
          setIsLoading(false);
          return;
        }
        setConversation(conv);
        setMember(mem);
        setMembers(mems);
        setLastReadAt(new Date().toISOString());

        const owner =
          mem.role === 'owner' || conv.owner_member_id === mem.id;
        setActiveConversationSession({
          conversationId: conv.id,
          memberId: mem.id,
          isOwner: owner,
          lang: normalizeLanguageCode(
            mem.preferred_language?.trim() || preferredLanguage || 'es'
          ),
          title: conv.title?.trim() || null,
        });

        await applyTranscriptionFallbacksForMessages(
          supabase,
          conversationId,
          msgs
        );

        const lang = normalizeLanguageCode(
          mem.preferred_language?.trim() || preferredLanguage || 'es'
        );
        const { messages: hydrated } = await hydrateViewerMessages({
          conversationId,
          viewerLanguage: lang,
          latestLanguagesRef,
        });
        if (!cancelled) setMessages(hydrated);
      } catch (e) {
        if (!cancelled) {
          console.error('useConversationChatViewModel:init', e);
          setError('Error cargando la conversación');
        }
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [conversationId, memberId, preferredLanguage, hydrateViewerMessages]);

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
  }, [conversationId, memberId]);

  const selectLanguage = useCallback(
    async (code: string) => {
      if (!member?.id) return;
      const updated = await updateMemberLanguage(supabase, member.id, code);
      setMember(updated);
      const { messages: hydrated } = await hydrateViewerMessages({
        conversationId,
        viewerLanguage: normalizeLanguageCode(code),
        latestLanguagesRef,
      });
      setMessages(hydrated);
    },
    [member?.id, conversationId, hydrateViewerMessages]
  );

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

  const sendMessage = useCallback(async () => {
    if (!text.trim() || !conversation || !member) return;
    if (conversation.status === 'closed' || member.left_at) return;
    const body = text.trim();
    const original = normalizeLanguageCode(
      member.preferred_language?.trim() || preferredLanguage || 'es'
    );
    const { messages: updated } = await handleSendMessage({
      insertRow: {
        conversation_id: conversation.id,
        member_id: member.id,
        content: body,
        original_language: original,
      },
      latestLanguagesRef,
    });
    setMessages(updated);
    setText('');
    notifyTypingStop();
  }, [text, conversation, member, preferredLanguage, handleSendMessage, notifyTypingStop]);

  const sendVoiceMessage = useCallback(async () => {
    if (!conversation || !member) return;
    if (conversation.status === 'closed' || member.left_at) return;
    setVoiceBusy(true);
    try {
      const recorded = await voiceRecorder.stopRecording();
      if (!recorded) {
        if (voiceRecorder.error) setError(voiceRecorder.error);
        return;
      }
      const original = normalizeLanguageCode(
        member.preferred_language?.trim() || preferredLanguage || 'es'
      );
      const { messages: updated } = await handleSendVoiceMessage({
        conversation_id: conversation.id,
        member_id: member.id,
        blob: recorded.blob,
        mimeType: recorded.mimeType,
        original_language: original,
        duration_seconds: recorded.durationSeconds,
      });
      setMessages(updated);
      notifyTypingStop();
      broadcastRecording(false);
    } catch (e) {
      console.error('sendVoiceMessage', e);
      setError('No se pudo enviar el audio');
    } finally {
      setVoiceBusy(false);
      broadcastRecording(false);
    }
  }, [
    conversation,
    member,
    preferredLanguage,
    handleSendVoiceMessage,
    voiceRecorder,
    notifyTypingStop,
    broadcastRecording,
  ]);

  const startVoiceRecording = useCallback(async () => {
    if (!conversation || !member) return;
    if (conversation.status === 'closed' || member.left_at) return;
    const started = await voiceRecorder.startRecording();
    if (started) broadcastRecording(true);
  }, [conversation, member, voiceRecorder, broadcastRecording]);

  const cancelVoiceRecording = useCallback(() => {
    voiceRecorder.cancelRecording();
    broadcastRecording(false);
  }, [voiceRecorder, broadcastRecording]);

  const endConversationForEveryone = useCallback(async () => {
    if (!conversation?.id || !member?.id) return;
    const now = new Date().toISOString();
    await markAllMembersLeft(supabase, conversation.id);
    await closeConversationRecord(supabase, conversation.id, member.id);
    setConversation((prev) =>
      prev ? { ...prev, status: 'closed', closed_at: now } : prev
    );
    setMember((prev) => (prev ? { ...prev, left_at: now } : prev));
    clearActiveConversationSession();
    if (!member.user_id) setShowRegistrationPrompt(true);
  }, [conversation?.id, member]);

  const leaveConversation = useCallback(async () => {
    if (!member?.id || !conversation?.id) return;
    const ownerLeaving =
      member.role === 'owner' ||
      conversation.owner_member_id === member.id;

    setLeaveBusy(true);
    try {
      if (ownerLeaving) {
        await endConversationForEveryone();
        return;
      }

      await markMemberLeft(supabase, member.id);
      setMember((prev) =>
        prev ? { ...prev, left_at: new Date().toISOString() } : prev
      );
      clearActiveConversationSession();
      if (!member.user_id) setShowRegistrationPrompt(true);
    } finally {
      setLeaveBusy(false);
    }
  }, [member, conversation, endConversationForEveryone]);

  const closeConversationForEveryone = useCallback(async () => {
    if (!conversation?.id || !member?.id) return;
    const owner =
      member.role === 'owner' ||
      conversation.owner_member_id === member.id;
    if (!owner) {
      setError('Solo el propietario puede finalizar la conversación');
      return;
    }
    setLeaveBusy(true);
    try {
      await endConversationForEveryone();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error al cerrar');
      throw e;
    } finally {
      setLeaveBusy(false);
    }
  }, [conversation?.id, conversation?.owner_member_id, member, endConversationForEveryone]);

  const expelMember = useCallback(
    async (targetMemberId: string) => {
      if (!conversation?.id || !member?.id) return;
      setExpelBusy(true);
      setError(null);
      try {
        await expelMemberByOwner(supabase, {
          conversationId: conversation.id,
          actorMemberId: member.id,
          targetMemberId,
        });
        setMembers(
          await fetchActiveMembersByConversation(supabase, conversation.id)
        );
      } catch (e) {
        const message =
          e instanceof Error ? e.message : 'No se pudo expulsar al participante';
        setError(message);
        throw e;
      } finally {
        setExpelBusy(false);
      }
    },
    [conversation?.id, member?.id]
  );

  const isOwner = useMemo(
    () =>
      member?.role === 'owner' ||
      conversation?.owner_member_id === member?.id,
    [conversation?.owner_member_id, member?.id, member?.role]
  );

  const shareUrl = useMemo(() => {
    if (typeof window === 'undefined' || !conversation?.invite_code) return null;
    return `${window.location.origin}/join/${conversation.invite_code}`;
  }, [conversation?.invite_code]);

  const chatComposerDisabled =
    conversation?.status === 'closed' || Boolean(member?.left_at);

  const closureBanner = useMemo(() => {
    if (conversation?.status === 'closed')
      return 'Esta conversación ha finalizado';
    if (member?.left_at) return 'Saliste de esta conversación.';
    return null;
  }, [conversation?.status, member?.left_at]);

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

  const headerLabel =
    conversation?.title?.trim() ||
    `Conversación · ${members.length} participante${members.length === 1 ? '' : 's'}`;

  return {
    conversation,
    member,
    members,
    messages,
    text,
    setText,
    sendMessage,
    headerLabel,
    isOwner,
    inviteCode: conversation?.invite_code ?? null,
    shareUrl,
    showRegistrationPrompt,
    setShowRegistrationPrompt,
    leaveConversation,
    expelMember,
    isLoading,
    error,
    selectedLanguage: member?.preferred_language ?? preferredLanguage,
    selectLanguage,
    leaveBusy,
    expelBusy,
    lastReadAt,
    typingLabel,
    recordingLabel,
    notifyTyping,
    sendVoiceMessage,
    startVoiceRecording,
    cancelVoiceRecording,
    isRecordingVoice: voiceRecorder.isRecording,
    voiceBusy,
    waveformLevels: voiceRecorder.waveformLevels,
    recordingDurationMs: voiceRecorder.durationMs,
    micActive: voiceRecorder.micActive,
    micMuted: voiceRecorder.micMuted,
    canSendRecording: voiceRecorder.canSendRecording,
    voiceRecorderError: voiceRecorder.error,
    participantsOpen,
    setParticipantsOpen,
    handleMessagesScroll: () => setLastReadAt(new Date().toISOString()),
    closeConversationForEveryone,
    chatComposerDisabled,
    closureBanner,
    showStartNewSession: conversation?.status === 'closed',
    newSessionBusy: false,
    startNewSessionAfterClose: async () => {
      if (typeof window !== 'undefined') window.location.href = '/';
    },
  };
}
