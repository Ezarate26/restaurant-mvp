'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { supabase } from '@/lib/supabase';
import {
  addConversationSessionExtraMs,
  closeConversationRecord,
  fetchConversationById,
  grantConversationFreeSessionBonus,
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
import { applyTranscriptionFallbacksForMessages } from '@/lib/model/voice-transcription-fallback';
import { requestProJoinRoomBoost } from '@/lib/billing/conversation-boost-client';
import { joinInviteUrl } from '@/lib/brand/site-url';
import {
  clearActiveConversationSession,
  setActiveConversationSession,
} from '@/lib/utils/active-conversation-session';
import { normalizeLanguageCode } from '@/constants/languages';
import { useConversationLanguages } from '@/lib/hooks/useConversationLanguages';
import { useMessageSender } from '@/lib/hooks/useMessageSender';
import { useVoiceRecorder } from '@/lib/hooks/useVoiceRecorder';
import { useChatRealtime } from '@/lib/viewmodels/chat/useChatRealtime';
import type { Conversation, ConversationMember, Message } from '@/lib/model/types';
import {
  resolveMemberDisplayName,
  resolveOwnerDisplayName,
} from '@/lib/utils/conversation-owner';

export interface UseConversationChatViewModelArgs {
  conversationId: string;
  memberId: string;
  preferredLanguage: string;
}

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
  const [showAnonymousProInvite, setShowAnonymousProInvite] = useState(false);
  const [lastReadAt, setLastReadAt] = useState<string | null>(null);
  const [voiceBusy, setVoiceBusy] = useState(false);
  const [participantsOpen, setParticipantsOpen] = useState(false);

  const latestLanguagesRef = useRef<string[]>([]);
  const sendingMessageRef = useRef(false);

  const { languages: conversationLanguages } =
    useConversationLanguages(conversationId);
  const { handleSendMessage, handleSendVoiceMessage, hydrateViewerMessages } =
    useMessageSender();
  const voiceRecorder = useVoiceRecorder();

  const {
    typingLabel,
    recordingLabel,
    notifyTyping,
    notifyTypingStop,
    broadcastRecording,
  } = useChatRealtime({
    conversationId,
    memberId,
    member,
    setMessages,
    setMembers,
    setMember,
    setConversation,
    setShowAnonymousProInvite,
  });

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
        if (!conv || !mem || mem.left_at || conv.status === 'closed') {
          clearActiveConversationSession();
          setError('SESSION_ENDED');
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

        if (mem.user_id) {
          void requestProJoinRoomBoost(conversationId)
            .then((result) => {
              if (cancelled || !result.applied || result.sessionExtraMs == null) {
                return;
              }
              setConversation((prev) =>
                prev
                  ? { ...prev, session_extra_ms: result.sessionExtraMs ?? prev.session_extra_ms }
                  : prev
              );
            })
            .catch((e) => {
              console.error('useConversationChatViewModel:proJoinBoost', e);
            });
        }

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

  const sendMessage = useCallback(async () => {
    const body = text.trim();
    if (!body || !conversation || !member) return;
    if (conversation.status === 'closed' || member.left_at) return;
    if (sendingMessageRef.current) return;

    sendingMessageRef.current = true;
    setText('');
    notifyTypingStop();

    const original = normalizeLanguageCode(
      member.preferred_language?.trim() || preferredLanguage || 'es'
    );

    try {
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
    } catch (e) {
      setText((prev) => (prev.trim().length > 0 ? prev : body));
      setError(e instanceof Error ? e.message : 'No se pudo enviar el mensaje');
    } finally {
      sendingMessageRef.current = false;
    }
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
    if (!member.user_id) setShowAnonymousProInvite(true);
  }, [conversation?.id, member]);

  const leaveConversation = useCallback(async () => {
    if (!member?.id || !conversation?.id) return;

    if (member.left_at || conversation.status === 'closed') {
      clearActiveConversationSession();
      return;
    }

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
      if (!member.user_id) setShowAnonymousProInvite(true);
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
    if (!conversation?.invite_code) return null;
    return joinInviteUrl(conversation.invite_code);
  }, [conversation?.invite_code]);

  const chatComposerDisabled =
    conversation?.status === 'closed' || Boolean(member?.left_at);

  const closureBanner = useMemo(() => {
    if (conversation?.status === 'closed') {
      const closedBy = conversation.closed_by_member_id;
      if (closedBy && closedBy !== member?.id) {
        const name = resolveMemberDisplayName(members, closedBy, 'El propietario');
        return `${name} cerró esta sala.`;
      }
      if (closedBy === member?.id) {
        return 'Finalizaste esta conversación.';
      }
      return 'Esta conversación ha finalizado.';
    }
    if (member?.left_at) return 'Saliste de esta conversación.';
    return null;
  }, [
    conversation?.status,
    conversation?.closed_by_member_id,
    member?.id,
    member?.left_at,
    members,
  ]);

  const ownerDisplayName = useMemo(
    () => resolveOwnerDisplayName(members, conversation?.owner_member_id),
    [members, conversation?.owner_member_id]
  );

  const closerDisplayName = useMemo(
    () =>
      resolveMemberDisplayName(
        members,
        conversation?.closed_by_member_id,
        ownerDisplayName
      ),
    [members, conversation?.closed_by_member_id, ownerDisplayName]
  );

  const extendSession = useCallback(
    async (extraMs: number) => {
      if (!conversation?.id || !isOwner) return;
      const updated = await addConversationSessionExtraMs(
        supabase,
        conversation.id,
        extraMs
      );
      if (updated) setConversation(updated);
    },
    [conversation?.id, isOwner]
  );

  const grantFreeSessionBonus = useCallback(async () => {
    if (!conversation?.id || !isOwner) return;
    const updated = await grantConversationFreeSessionBonus(
      supabase,
      conversation.id
    );
    if (updated) setConversation(updated);
  }, [conversation?.id, isOwner]);

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
    showAnonymousProInvite,
    setShowAnonymousProInvite,
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
    sessionExtraMs: conversation?.session_extra_ms ?? 0,
    sessionFreeBonusUsed: Boolean(conversation?.session_free_bonus_used),
    ownerDisplayName,
    closerDisplayName,
    extendSession,
    grantFreeSessionBonus,
    showStartNewSession: conversation?.status === 'closed',
    newSessionBusy: false,
  };
}
