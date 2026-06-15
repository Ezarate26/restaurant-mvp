'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { use, useCallback } from 'react';
import { ConversationChatView } from '@/components/conversation/ConversationChatView';
import { PostConversationRegistration } from '@/components/conversation/PostConversationRegistration';
import { useConversationChatViewModel } from '@/lib/viewmodels/useConversationChatViewModel';
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
  const vm = useConversationChatViewModel({
    conversationId,
    memberId,
    preferredLanguage,
  });

  // Al salir/finalizar: cerrar sesión si está logeado y volver al landing.
  const resetToLanding = useCallback(async () => {
    try {
      const { data } = await supabase.auth.getSession();
      if (data.session) await supabase.auth.signOut();
    } catch {
      /* noop */
    } finally {
      router.replace('/');
    }
  }, [router]);

  const handleLeave = useCallback(async () => {
    await vm.leaveConversation();
    await resetToLanding();
  }, [vm, resetToLanding]);

  const handleCloseForEveryone = useCallback(async () => {
    await vm.closeConversationForEveryone();
    await resetToLanding();
  }, [vm, resetToLanding]);

  if (vm.isLoading) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-[var(--app-bg)] text-sm text-[var(--app-muted)]">
        <span className="inline-block h-6 w-6 animate-spin rounded-full border-2 border-[var(--app-accent)] border-t-transparent" />
        <span className="mt-3">Cargando conversación…</span>
      </div>
    );
  }

  if (vm.error) {
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
        onCloseConversation={handleCloseForEveryone}
        leaveBusy={vm.leaveBusy}
        isOwner={vm.isOwner}
        showStartNewSession={vm.showStartNewSession}
        onStartNewSession={() => void vm.startNewSessionAfterClose()}
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
      />
      <PostConversationRegistration
        open={vm.showRegistrationPrompt}
        onOpenChange={vm.setShowRegistrationPrompt}
      />
    </>
  );
}
