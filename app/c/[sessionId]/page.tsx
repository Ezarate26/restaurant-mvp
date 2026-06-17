'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { use, useCallback, useEffect, useRef } from 'react';
import { ConversationChatView } from '@/components/conversation/ConversationChatView';
import { PostConversationRegistration } from '@/components/conversation/PostConversationRegistration';
import { useConversationChatViewModel } from '@/lib/viewmodels/useConversationChatViewModel';
import { AUTH_HOME_PATH } from '@/lib/constants/routes';
import { clearActiveConversationSession } from '@/lib/utils/active-conversation-session';
import { markSessionEndedByTime } from '@/lib/utils/session-ended-flash.storage';
import { fetchMemberById } from '@/lib/model/conversation-members.repository';
import { fetchConversationById } from '@/lib/model/conversations-table.repository';
import { supabase } from '@/lib/supabase';

type PageProps = {
  params: Promise<{ sessionId: string }>;
};

export default function ConversationPage({ params }: PageProps) {
  const { sessionId: conversationId } = use(params);
  const searchParams = useSearchParams();
  const memberId = searchParams.get('member') ?? '';

  if (!memberId) {
    return (
      <div className="grid min-h-screen place-items-center bg-[var(--app-bg)] px-6 text-center">
        <p className="text-sm text-[var(--app-muted)]">
          Participante no identificado.
        </p>
      </div>
    );
  }

  return (
    <ConversationScreen
      conversationId={conversationId}
      memberId={memberId}
      preferredLanguage={searchParams.get('lang') ?? 'es'}
    />
  );
}

function ConversationScreen({
  conversationId,
  memberId,
  preferredLanguage,
}: {
  conversationId: string;
  memberId: string;
  preferredLanguage: string;
}) {
  const router = useRouter();
  const redirectingRef = useRef(false);
  const vm = useConversationChatViewModel({
    conversationId,
    memberId,
    preferredLanguage,
  });

  const redirectAfterLeave = useCallback(
    async (options?: { sessionEndedByTime?: boolean }) => {
      if (redirectingRef.current) return;
      redirectingRef.current = true;
      clearActiveConversationSession();
      if (options?.sessionEndedByTime) {
        markSessionEndedByTime();
      }
      const { data } = await supabase.auth.getSession();
      router.replace(data.session ? AUTH_HOME_PATH : '/');
    },
    [router]
  );

  const redirectIfSessionEnded = useCallback(async () => {
    const [conv, mem] = await Promise.all([
      fetchConversationById(supabase, conversationId),
      fetchMemberById(supabase, memberId),
    ]);
    if (!conv || !mem || mem.left_at || conv.status === 'closed') {
      await redirectAfterLeave({ sessionEndedByTime: true });
      return true;
    }
    return false;
  }, [conversationId, memberId, redirectAfterLeave]);

  const handleLeaveSilent = useCallback(async () => {
    await vm.leaveConversation();
  }, [vm]);

  const handleGoHome = useCallback(
    async (sessionEndedByTime = false) => {
      await vm.leaveConversation();
      await redirectAfterLeave({ sessionEndedByTime });
    },
    [vm, redirectAfterLeave]
  );

  const handleLeave = useCallback(async () => {
    await vm.leaveConversation();
    await redirectAfterLeave();
  }, [vm, redirectAfterLeave]);

  const handleCloseSilent = useCallback(async () => {
    await vm.closeConversationForEveryone();
  }, [vm]);

  const handleCloseForEveryone = useCallback(async () => {
    await vm.closeConversationForEveryone();
    await redirectAfterLeave();
  }, [vm, redirectAfterLeave]);

  const sessionUnavailable =
    !vm.isLoading &&
    (vm.error === 'SESSION_ENDED' ||
      vm.conversation?.status === 'closed' ||
      Boolean(vm.member?.left_at));

  useEffect(() => {
    if (!sessionUnavailable) return;
    void redirectAfterLeave({ sessionEndedByTime: true });
  }, [sessionUnavailable, redirectAfterLeave]);

  useEffect(() => {
    const onPageShow = (event: PageTransitionEvent) => {
      if (!event.persisted) return;
      void redirectIfSessionEnded();
    };
    window.addEventListener('pageshow', onPageShow);
    return () => window.removeEventListener('pageshow', onPageShow);
  }, [redirectIfSessionEnded]);

  if (vm.isLoading || sessionUnavailable) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-[var(--app-bg)] text-sm text-[var(--app-muted)]">
        <span className="inline-block h-6 w-6 animate-spin rounded-full border-2 border-[var(--app-accent)] border-t-transparent" />
        <span className="mt-3">
          {sessionUnavailable ? 'Redirigiendo…' : 'Cargando conversación…'}
        </span>
      </div>
    );
  }

  if (vm.error && vm.error !== 'SESSION_ENDED') {
    return (
      <div className="grid min-h-screen place-items-center bg-[var(--app-bg)] px-6 text-center">
        <p className="font-semibold text-[var(--app-text)]">{vm.error}</p>
      </div>
    );
  }

  return (
    <>
      <ConversationChatView
        conversationId={conversationId}
        headerLabel={vm.headerLabel}
        messages={vm.messages}
        message={vm.text}
        onMessageChange={(v) => {
          vm.setText(v);
          vm.notifyTyping();
        }}
        onSend={() => void vm.sendMessage()}
        composerDisabled={vm.chatComposerDisabled}
        closureBanner={vm.closureBanner}
        onLeaveConversation={handleLeave}
        onLeaveConversationSilent={handleLeaveSilent}
        onCloseConversation={handleCloseForEveryone}
        onCloseConversationSilent={handleCloseSilent}
        leaveBusy={vm.leaveBusy}
        isOwner={vm.isOwner}
        showStartNewSession={vm.showStartNewSession}
        onStartNewSession={() => void handleGoHome(false)}
        onGoHome={(sessionEndedByTime = false) => void handleGoHome(sessionEndedByTime)}
        currentMemberId={vm.member?.id ?? null}
        viewerLanguage={vm.member?.preferred_language ?? preferredLanguage}
        lastReadAt={vm.lastReadAt}
        typingLabel={vm.typingLabel}
        recordingLabel={vm.recordingLabel}
        onMessagesScroll={vm.handleMessagesScroll}
        members={vm.members}
        inviteCode={vm.inviteCode}
        shareUrl={vm.shareUrl}
        participantsOpen={vm.participantsOpen}
        onParticipantsOpenChange={vm.setParticipantsOpen}
        onExpelMember={vm.expelMember}
        expelBusy={vm.expelBusy}
        isRecordingVoice={vm.isRecordingVoice}
        voiceBusy={vm.voiceBusy}
        waveformLevels={vm.waveformLevels}
        recordingDurationMs={vm.recordingDurationMs}
        micActive={vm.micActive}
        micMuted={vm.micMuted}
        canSendRecording={vm.canSendRecording}
        onStartVoice={vm.startVoiceRecording}
        onStopVoice={vm.sendVoiceMessage}
        onCancelVoice={vm.cancelVoiceRecording}
        conversationCreatedAt={vm.conversation?.created_at ?? null}
        sessionExtraMs={vm.sessionExtraMs}
        ownerDisplayName={vm.ownerDisplayName}
        closerDisplayName={vm.closerDisplayName}
        conversationStatus={vm.conversation?.status ?? null}
        closedByMemberId={vm.conversation?.closed_by_member_id ?? null}
        onExtendSession={vm.extendSession}
      />
      <PostConversationRegistration
        open={vm.showRegistrationPrompt}
        onOpenChange={vm.setShowRegistrationPrompt}
      />
    </>
  );
}
