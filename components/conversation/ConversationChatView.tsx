'use client';

import { useCallback, useEffect, useState, type UIEvent } from 'react';
import type { ConversationMember, Message } from '@/lib/model/types';
import { BillingStatusBadge } from '@/components/billing/BillingStatusBadge';
import { RoomFreeSessionEndedGuestModal } from '@/components/billing/RoomFreeSessionEndedGuestModal';
import { RoomGuestClosedModal } from '@/components/billing/RoomGuestClosedModal';
import { RoomTimeExpiredModal } from '@/components/billing/RoomTimeExpiredModal';
import { RoomTimer } from '@/components/billing/RoomTimer';
import { UpgradeBanner } from '@/components/billing/UpgradeBanner';
import { UpgradeModal } from '@/components/billing/UpgradeModal';
import { ChatHeader } from '@/components/chat/ChatHeader';
import { ChatMessagesPane } from '@/components/chat/ChatMessagesPane';
import { ChatComposer } from '@/components/chat/ChatComposer';
import { LeaveConversationModal } from '@/components/chat/LeaveConversationModal';
import { InvitePanel } from '@/components/conversation/InvitePanel';
import { ParticipantsSidebar } from '@/components/conversation/ParticipantsSidebar';
import { AppSidebar } from '@/components/layout/AppSidebar';
import { MobileNavProvider } from '@/components/layout/MobileNavContext';
import { TapButton } from '@/components/ui/TapButton';
import { usePlan } from '@/lib/billing/PlanProvider';
import { useConversationRoomLimits } from '@/lib/billing/useConversationRoomLimits';
import { markPendingRoomPassExtension } from '@/lib/billing/room-session.storage';
import { useRoomSessionEnforcement } from '@/lib/billing/useRoomSessionEnforcement';
import { resolveJoinShareUrl } from '@/lib/brand/site-url';

export interface ConversationChatViewProps {
  conversationId: string;
  messages: Message[];
  message: string;
  onMessageChange: (value: string) => void;
  onSend: () => void;
  composerDisabled?: boolean;
  closureBanner?: string | null;
  onLeaveConversation?: () => void | Promise<void>;
  onLeaveConversationSilent?: () => void | Promise<void>;
  onCloseConversation?: () => void | Promise<void>;
  onCloseConversationSilent?: () => void | Promise<void>;
  leaveBusy?: boolean;
  isOwner?: boolean;
  showStartNewSession?: boolean;
  newSessionBusy?: boolean;
  onStartNewSession?: () => void | Promise<void>;
  onGoHome?: (sessionEndedByTime?: boolean) => void | Promise<void>;
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
  conversationCreatedAt?: string | null;
  roomTimerStartedAt?: string | null;
  sessionExtraMs?: number;
  ownerDisplayName?: string;
  closerDisplayName?: string;
  conversationStatus?: string | null;
  closedByMemberId?: string | null;
  onExtendSession?: (extraMs: number) => void | Promise<void>;
  onEnforceRoomTimer?: () => void | Promise<void>;
  showAnonymousProInvite?: boolean;
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
  onLeaveConversationSilent,
  onCloseConversation,
  onCloseConversationSilent,
  leaveBusy = false,
  isOwner = false,
  showStartNewSession = false,
  newSessionBusy = false,
  onStartNewSession,
  onGoHome,
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
  conversationCreatedAt = null,
  roomTimerStartedAt = null,
  sessionExtraMs = 0,
  ownerDisplayName = 'el propietario',
  closerDisplayName = 'El propietario',
  conversationStatus = 'active',
  closedByMemberId = null,
  onExtendSession,
  onEnforceRoomTimer,
  showAnonymousProInvite = false,
}: ConversationChatViewProps) {
  const [leaveModalOpen, setLeaveModalOpen] = useState(false);
  const [closeModalOpen, setCloseModalOpen] = useState(false);
  const [inviteOpen, setInviteOpen] = useState(false);
  const [shareCopied, setShareCopied] = useState(false);
  const [upgradeOpen, setUpgradeOpen] = useState(false);
  const [composerInputFocused, setComposerInputFocused] = useState(false);

  const plan = usePlan();

  useEffect(() => {
    if (!onParticipantsOpenChange) return;
    const mq = window.matchMedia('(min-width: 768px)');
    const closeOnDesktop = () => {
      if (mq.matches) onParticipantsOpenChange(false);
    };
    closeOnDesktop();
    mq.addEventListener('change', closeOnDesktop);
    return () => mq.removeEventListener('change', closeOnDesktop);
  }, [onParticipantsOpenChange]);

  useEffect(() => {
    void plan.syncForConversation(conversationId);
  }, [conversationId, plan.syncForConversation]);
  const hasRoomPass = plan.hasActiveRoomPass(conversationId);
  const roomLimits = useConversationRoomLimits(conversationId, sessionExtraMs);
  const roomDurationMs =
    roomLimits?.durationMs ?? plan.getRoomDurationMsForRoom(conversationId);
  const roomUiMode = roomLimits?.uiMode ?? plan.uiMode;
  const voiceAllowed = plan.canUseVoiceInRoom(conversationId);

  const chatReturnUrl =
    currentMemberId != null
      ? `/c/${conversationId}?member=${encodeURIComponent(currentMemberId)}`
      : `/c/${conversationId}`;

  const baseConversationActive = !composerDisabled;

  const handleRoomSessionEnd = useCallback(async () => {
    if (isOwner) {
      if (roomUiMode === 'free' && onCloseConversationSilent) {
        await onCloseConversationSilent();
        return;
      }
      if (onCloseConversation) {
        await onCloseConversation();
        return;
      }
    }
    if (onLeaveConversation) {
      await onLeaveConversation();
    }
  }, [
    isOwner,
    roomUiMode,
    onCloseConversation,
    onCloseConversationSilent,
    onLeaveConversation,
  ]);

  const handleFreeGuestExpire = useCallback(async () => {
    if (onLeaveConversationSilent) {
      await onLeaveConversationSilent();
    }
  }, [onLeaveConversationSilent]);

  const roomSession = useRoomSessionEnforcement({
    conversationId,
    members,
    roomTimerStartedAt,
    durationMs: roomDurationMs,
    sessionExtraMs,
    uiMode: roomUiMode,
    isOwner,
    isConversationActive: baseConversationActive,
    hasActiveRoomPass: hasRoomPass,
    onEndSession: handleRoomSessionEnd,
    onExtendSession: onExtendSession ?? (async () => undefined),
    onFreeGuestExpire: handleFreeGuestExpire,
    onEnforceExpiry: onEnforceRoomTimer,
  });

  const effectiveComposerDisabled =
    composerDisabled || roomSession.roomTimeBlocked;

  const activeCount = members.filter((m) => !m.left_at).length;
  const isActive = !effectiveComposerDisabled;
  const showFreeUpgrade =
    isOwner &&
    plan.tier === 'free' &&
    !hasRoomPass &&
    isActive &&
    !roomSession.roomTimeBlocked;

  const proGuestBoostActive =
    roomUiMode === 'free' && sessionExtraMs > 0 && isActive;

  const freeOwnerUpgradeOpen =
    roomSession.freeEndedKind === 'owner-upgrade';
  const freeGuestEndedOpen = roomSession.freeEndedKind === 'guest-ended';

  const showGuestClosedModal =
    !isOwner &&
    conversationStatus === 'closed' &&
    Boolean(closedByMemberId) &&
    closedByMemberId !== currentMemberId &&
    !freeGuestEndedOpen;

  const isAnonymous = !plan.isAuthenticated;

  const anonymousExitModalOpen =
    isAnonymous &&
    (freeOwnerUpgradeOpen ||
      freeGuestEndedOpen ||
      showAnonymousProInvite ||
      showGuestClosedModal);

  const anonymousExitVariant: 'free-time-expired' | 'chat-ended' =
    freeOwnerUpgradeOpen || freeGuestEndedOpen
      ? 'free-time-expired'
      : 'chat-ended';

  const proUpsellModalOpen =
    upgradeOpen ||
    anonymousExitModalOpen ||
    (freeOwnerUpgradeOpen && plan.isAuthenticated);

  const proUpsellVariant: 'voice' | 'free-time-expired' | 'chat-ended' =
    anonymousExitModalOpen
      ? anonymousExitVariant
      : freeOwnerUpgradeOpen
        ? 'free-time-expired'
        : 'voice';

  const handleAnonymousExitDismiss = useCallback(() => {
    const endedByTime = freeOwnerUpgradeOpen || freeGuestEndedOpen;
    void onGoHome?.(endedByTime);
  }, [freeOwnerUpgradeOpen, freeGuestEndedOpen, onGoHome]);

  useEffect(() => {
    if (roomSession.roomTimeBlocked && isRecordingVoice && onCancelVoice) {
      onCancelVoice();
    }
  }, [roomSession.roomTimeBlocked, isRecordingVoice, onCancelVoice]);

  const handleShare = async () => {
    const url = resolveJoinShareUrl(inviteCode, shareUrl);
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
        composerDisabled={effectiveComposerDisabled}
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
          composerDisabled={effectiveComposerDisabled}
          onOpenParticipants={
            onParticipantsOpenChange
              ? () => onParticipantsOpenChange(true)
              : undefined
          }
          onOpenInvite={() => setInviteOpen(true)}
          onShare={() => void handleShare()}
          onLeave={
            onLeaveConversation && !effectiveComposerDisabled
              ? () => setLeaveModalOpen(true)
              : undefined
          }
          onCloseConversation={
            isOwner && onCloseConversation && !effectiveComposerDisabled
              ? () => setCloseModalOpen(true)
              : undefined
          }
        />

        {showFreeUpgrade ? (
          <UpgradeBanner
            variant="compact"
            message="Pro: voz, todos los idiomas y salas de 60 min."
            onUpgrade={() => setUpgradeOpen(true)}
          />
        ) : null}

        {proGuestBoostActive ? (
          <div className="shrink-0 border-b border-[var(--app-success)]/30 bg-[var(--app-success)]/10 px-3 py-2 text-center text-xs font-medium text-[var(--app-success)] sm:px-4">
            Un participante Pro extendió esta sala a 60 minutos (el tiempo ya
            transcurrido cuenta).
          </div>
        ) : null}

        <div className="flex shrink-0 items-center justify-between gap-2 border-b border-[var(--app-border)] bg-[var(--app-sidebar)] px-3 py-1.5 sm:px-4">
          <BillingStatusBadge
            tier={plan.tier}
            roomPassActive={hasRoomPass}
            compact
          />
          <RoomTimer
            members={members}
            roomTimerStartedAt={roomTimerStartedAt}
            durationMs={roomDurationMs}
            extraMs={sessionExtraMs}
            compact
          />
        </div>

        {roomSession.roomTimeBlocked && baseConversationActive ? (
          <div className="shrink-0 border-b border-[var(--app-warning)]/30 bg-[var(--app-warning)]/10 px-3 py-2 text-center text-xs font-medium text-[var(--app-warning)] sm:px-4">
            {roomUiMode === 'free' && !isOwner
              ? `Se acabó la sesión de la sala de ${ownerDisplayName}.`
              : isOwner
                ? 'Tiempo de sala agotado — el chat está pausado hasta que elijas una opción.'
                : `Tiempo de sala agotado — esperando nueva sesión de ${ownerDisplayName}.`}
          </div>
        ) : null}

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
          <main className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden">
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
              isOwner={isOwner}
              inviteCode={inviteCode}
              onOpenInvite={() => setInviteOpen(true)}
              onShareInvite={() => void handleShare()}
              composerDisabled={effectiveComposerDisabled}
              suppressAutoScroll={composerInputFocused}
            />

            <ChatComposer
              message={message}
              disabled={effectiveComposerDisabled}
              inputFocused={composerInputFocused}
              onInputFocusChange={setComposerInputFocused}
              isRecording={isRecordingVoice}
              voiceBusy={voiceBusy}
              waveformLevels={waveformLevels}
              recordingDurationMs={recordingDurationMs}
              micActive={micActive}
              micMuted={micMuted}
              canSendRecording={canSendRecording}
              voiceAllowed={voiceAllowed}
              onVoiceUpgrade={() => setUpgradeOpen(true)}
              onMessageChange={onMessageChange}
              onSend={onSend}
              onStartVoice={
                onStartVoice ? () => void onStartVoice() : undefined
              }
              onStopVoice={onStopVoice ? () => void onStopVoice() : undefined}
              onCancelVoice={onCancelVoice}
            />
          </main>

          <aside className="hidden w-[240px] shrink-0 flex-col border-l border-[var(--app-border)] bg-[var(--app-sidebar)] md:flex md:max-w-[240px] md:min-w-[240px]">
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
              canManage={!effectiveComposerDisabled}
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
        canManage={!effectiveComposerDisabled}
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

      <RoomTimeExpiredModal
        open={roomSession.expiredModalOpen}
        isOwner={isOwner}
        ownerDisplayName={ownerDisplayName}
        uiMode={roomUiMode}
        graceRemainingMs={roomSession.graceRemainingMs}
        busy={roomSession.sessionEnding || leaveBusy}
        onContinuePro={roomSession.handleProContinue}
        onBuyRoomPass={() => {
          markPendingRoomPassExtension(conversationId);
          void plan.buyRoomPass(conversationId, `/c/${conversationId}`);
        }}
        onEndSession={() => void roomSession.handleEndSession()}
        onLeave={
          onLeaveConversation
            ? () => void onLeaveConversation()
            : undefined
        }
      />

      <RoomFreeSessionEndedGuestModal
        open={freeGuestEndedOpen && !isAnonymous}
        ownerDisplayName={ownerDisplayName}
        onGoHome={() => void onGoHome?.(true)}
      />

      <RoomGuestClosedModal
        open={showGuestClosedModal && !isAnonymous}
        closerDisplayName={closerDisplayName}
        isAuthenticated={plan.isAuthenticated}
        onUpgrade={() => setUpgradeOpen(true)}
        onGoHome={() => void onGoHome?.(false)}
      />

      <UpgradeModal
        open={proUpsellModalOpen}
        variant={proUpsellVariant}
        onClose={() => {
          if (anonymousExitModalOpen) {
            handleAnonymousExitDismiss();
            return;
          }
          if (freeOwnerUpgradeOpen) {
            void onGoHome?.(true);
            return;
          }
          setUpgradeOpen(false);
        }}
        requiresAuth={!plan.isAuthenticated}
        onRegisterLeave={async () => {
          setUpgradeOpen(false);
          await onLeaveConversationSilent?.();
          window.location.href = '/auth/register?redirect=/app/billing';
        }}
        onUpgrade={() => plan.upgradeToPro(chatReturnUrl)}
        onBuyRoomPass={async () => {
          markPendingRoomPassExtension(conversationId);
          await plan.buyRoomPass(conversationId, chatReturnUrl);
        }}
      />
    </div>
    </MobileNavProvider>
  );
}
