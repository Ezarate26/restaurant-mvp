'use client';

import { useState, type UIEvent } from 'react';
import type { ConversationMember, Message } from '@/lib/model/types';
import { ChatHeader } from '@/components/chat/ChatHeader';
import { ChatMessagesPane } from '@/components/chat/ChatMessagesPane';
import { ChatComposer } from '@/components/chat/ChatComposer';
import { LeaveConversationModal } from '@/components/chat/LeaveConversationModal';
import { InvitePanel } from '@/components/conversation/InvitePanel';
import { ParticipantsSidebar } from '@/components/conversation/ParticipantsSidebar';
import { AppSidebar } from '@/components/layout/AppSidebar';
import { MobileNavProvider } from '@/components/layout/MobileNavContext';
import { TapButton } from '@/components/ui/TapButton';

export interface ConversationChatViewProps {
  conversationId: string;
  messages: Message[];
  message: string;
  onMessageChange: (value: string) => void;
  onSend: () => void;
  composerDisabled?: boolean;
  closureBanner?: string | null;
  onLeaveConversation?: () => void | Promise<void>;
  onCloseConversation?: () => void | Promise<void>;
  leaveBusy?: boolean;
  isOwner?: boolean;
  showStartNewSession?: boolean;
  newSessionBusy?: boolean;
  onStartNewSession?: () => void | Promise<void>;
  headerLabel?: string;
  currentMemberId?: string | null;
  viewerLanguage?: string | null;
  lastReadAt?: string | null;
  typingLabel?: string | null;
  recordingLabel?: string | null;
  onMessagesScroll?: (e: UIEvent<HTMLDivElement>) => void;
  members?: ConversationMember[];
  inviteCode?: string | null;
  shareUrl?: string | null;
  participantsOpen?: boolean;
  onParticipantsOpenChange?: (open: boolean) => void;
  onExpelMember?: (memberId: string) => Promise<void>;
  expelBusy?: boolean;
  isRecordingVoice?: boolean;
  voiceBusy?: boolean;
  waveformLevels?: number[];
  recordingDurationMs?: number;
  micActive?: boolean;
  micMuted?: boolean;
  canSendRecording?: boolean;
  onStartVoice?: () => void | Promise<void>;
  onStopVoice?: () => void | Promise<void>;
  onCancelVoice?: () => void;
}

export function ConversationChatView({
  conversationId,
  messages,
  message,
  onMessageChange,
  onSend,
  composerDisabled = false,
  closureBanner = null,
  onLeaveConversation,
  onCloseConversation,
  leaveBusy = false,
  isOwner = false,
  showStartNewSession = false,
  newSessionBusy = false,
  onStartNewSession,
  headerLabel,
  currentMemberId = null,
  viewerLanguage = null,
  lastReadAt = null,
  typingLabel = null,
  recordingLabel = null,
  onMessagesScroll,
  members = [],
  inviteCode = null,
  shareUrl = null,
  participantsOpen = false,
  onParticipantsOpenChange,
  onExpelMember,
  expelBusy = false,
  isRecordingVoice = false,
  voiceBusy = false,
  waveformLevels = [],
  recordingDurationMs = 0,
  micActive = false,
  micMuted = false,
  canSendRecording = false,
  onStartVoice,
  onStopVoice,
  onCancelVoice,
}: ConversationChatViewProps) {
  const [leaveModalOpen, setLeaveModalOpen] = useState(false);
  const [closeModalOpen, setCloseModalOpen] = useState(false);
  const [inviteOpen, setInviteOpen] = useState(false);
  const [shareCopied, setShareCopied] = useState(false);

  const activeCount = members.filter((m) => !m.left_at).length;
  const isActive = !composerDisabled;

  const handleShare = async () => {
    const url =
      shareUrl ??
      (inviteCode && typeof window !== 'undefined'
        ? `${window.location.origin}/join/${inviteCode}`
        : null);
    if (!url) {
      setInviteOpen(true);
      return;
    }
    try {
      await navigator.clipboard.writeText(url);
      setShareCopied(true);
      window.setTimeout(() => setShareCopied(false), 2000);
    } catch {
      setInviteOpen(true);
    }
  };

  return (
    <MobileNavProvider>
    <div className="flex h-[100dvh] min-h-0 overflow-x-hidden bg-[var(--app-bg)]">
      <AppSidebar
        inviteCode={inviteCode}
        shareUrl={shareUrl}
        onShare={() => void handleShare()}
        onOpenQr={() => setInviteOpen(true)}
        composerDisabled={composerDisabled}
        activeSession={
          currentMemberId
            ? {
                conversationId,
                memberId: currentMemberId,
                isOwner: isOwner ?? false,
                title: headerLabel ?? null,
              }
            : null
        }
      />

      <div className="flex min-h-0 min-w-0 flex-1 flex-col">
        <ChatHeader
          conversationId={conversationId}
          headerLabel={headerLabel}
          members={members}
          currentMemberId={currentMemberId}
          participantCount={activeCount}
          isActive={isActive}
          isOwner={isOwner}
          composerDisabled={composerDisabled}
          onOpenParticipants={
            onParticipantsOpenChange
              ? () => onParticipantsOpenChange(true)
              : undefined
          }
          onOpenInvite={() => setInviteOpen(true)}
          onShare={() => void handleShare()}
          onLeave={
            onLeaveConversation && !composerDisabled
              ? () => setLeaveModalOpen(true)
              : undefined
          }
          onCloseConversation={
            isOwner && onCloseConversation && !composerDisabled
              ? () => setCloseModalOpen(true)
              : undefined
          }
        />

        {shareCopied ? (
          <div className="shrink-0 bg-[var(--app-success)]/15 px-4 py-1.5 text-center text-xs font-medium text-[var(--app-success)]">
            Enlace copiado al portapapeles
          </div>
        ) : null}

        {closureBanner && showStartNewSession && onStartNewSession ? (
          <div className="shrink-0 border-b border-[var(--app-border)] bg-[var(--app-panel)] px-3 py-3 text-center sm:px-4">
            <TapButton
              onTap={() => void onStartNewSession()}
              disabled={newSessionBusy}
              className="app-hover touch-target rounded-md bg-[var(--app-accent)] px-4 py-2.5 text-xs font-semibold text-white hover:bg-[var(--app-accent-hover)] disabled:opacity-50"
            >
              {newSessionBusy ? 'Abriendo…' : 'Volver al inicio'}
            </TapButton>
          </div>
        ) : null}

        <div className="flex min-h-0 flex-1 overflow-hidden">
          <main className="flex min-h-0 min-w-0 flex-1 flex-col">
            <ChatMessagesPane
              messages={messages}
              currentMemberId={currentMemberId}
              viewerLanguage={viewerLanguage}
              lastReadAt={lastReadAt}
              members={members}
              typingLabel={typingLabel}
              recordingLabel={recordingLabel}
              closureBanner={closureBanner}
              onMessagesScroll={onMessagesScroll}
            />

            <ChatComposer
              message={message}
              disabled={composerDisabled}
              isRecording={isRecordingVoice}
              voiceBusy={voiceBusy}
              waveformLevels={waveformLevels}
              recordingDurationMs={recordingDurationMs}
              micActive={micActive}
              micMuted={micMuted}
              canSendRecording={canSendRecording}
              onMessageChange={onMessageChange}
              onSend={onSend}
              onStartVoice={
                onStartVoice ? () => void onStartVoice() : undefined
              }
              onStopVoice={onStopVoice ? () => void onStopVoice() : undefined}
              onCancelVoice={onCancelVoice}
            />
          </main>

          <aside className="hidden w-[240px] shrink-0 flex-col border-l border-[var(--app-border)] bg-[var(--app-sidebar)] md:flex">
            <div className="shrink-0 border-b border-[var(--app-border)] px-4 py-3">
              <h2 className="text-xs font-bold uppercase tracking-wide text-[var(--app-muted)]">
                Participantes — {activeCount}
              </h2>
            </div>
            <ParticipantsSidebar
              open
              onClose={() => {}}
              members={members}
              currentMemberId={currentMemberId}
              isOwner={isOwner}
              canManage={!composerDisabled}
              expelBusy={expelBusy}
              onExpelMember={onExpelMember}
              embedded
            />
          </aside>
        </div>
      </div>

      <ParticipantsSidebar
        open={participantsOpen}
        onClose={() => onParticipantsOpenChange?.(false)}
        members={members}
        currentMemberId={currentMemberId}
        isOwner={isOwner}
        canManage={!composerDisabled}
        expelBusy={expelBusy}
        onExpelMember={onExpelMember}
      />

      <InvitePanel
        open={inviteOpen}
        onOpenChange={setInviteOpen}
        inviteCode={inviteCode}
        shareUrl={shareUrl}
        title={headerLabel ?? 'Conversación'}
      />

      <LeaveConversationModal
        open={leaveModalOpen}
        busy={leaveBusy}
        mode="leave"
        ownerEndsForAll={isOwner}
        onCancel={() => setLeaveModalOpen(false)}
        onConfirm={async () => {
          try {
            await onLeaveConversation?.();
            setLeaveModalOpen(false);
          } catch {
            /* reintentar */
          }
        }}
      />

      <LeaveConversationModal
        open={closeModalOpen}
        busy={leaveBusy}
        mode="close"
        onCancel={() => setCloseModalOpen(false)}
        onConfirm={async () => {
          try {
            await onCloseConversation?.();
            setCloseModalOpen(false);
          } catch {
            /* reintentar */
          }
        }}
      />
    </div>
    </MobileNavProvider>
  );
}
