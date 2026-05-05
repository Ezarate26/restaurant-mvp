'use client';

import { useEffect, useState, type ReactNode, type UIEvent } from 'react';
import type { Message, SessionUser } from '@/lib/model/types';
import { ChatHeader } from '@/components/table/ChatHeader';
import { ChatMessagesPane } from '@/components/table/ChatMessagesPane';
import { ChatComposer } from '@/components/table/ChatComposer';
import { LeaveSessionModal } from '@/components/table/LeaveSessionModal';

export interface TableChatViewProps {
  tableId: string;
  messages: Message[];
  message: string;
  onMessageChange: (value: string) => void;
  onSend: () => void;
  onCallWaiter: () => void;
  composerDisabled?: boolean;
  closureBanner?: string | null;
  onLeaveChat?: () => void | Promise<void>;
  leaveChatBusy?: boolean;
  showStartNewSession?: boolean;
  newSessionBusy?: boolean;
  onStartNewSession?: () => void | Promise<void>;
  headerLabel?: string;
  usersSlot?: ReactNode;
  currentSessionUserId?: string | null;
  viewerLanguage?: string | null;
  lastReadAt?: string | null;
  typingIndicator?: string | null;
  onMessagesScroll?: (e: UIEvent<HTMLDivElement>) => void;
  sessionUsers?: SessionUser[];
  /** Vista cliente: encabezado sobre mensajes del mesero (nombre · Personal). */
  waiterIncomingBubbleLabel?: string | null;
}

export function TableChatView({
  tableId,
  messages,
  message,
  onMessageChange,
  onSend,
  onCallWaiter,
  composerDisabled = false,
  closureBanner = null,
  onLeaveChat,
  leaveChatBusy = false,
  showStartNewSession = false,
  newSessionBusy = false,
  onStartNewSession,
  headerLabel,
  usersSlot,
  currentSessionUserId = null,
  viewerLanguage = null,
  lastReadAt = null,
  typingIndicator = null,
  onMessagesScroll,
  sessionUsers = [],
  waiterIncomingBubbleLabel = null,
}: TableChatViewProps) {
  const [leaveModalOpen, setLeaveModalOpen] = useState(false);

  const showProfileChip = false;
  const showCompleteLink = false;
  const showHeaderActions = showProfileChip || showCompleteLink;

  return (
    <div className="flex h-screen min-h-0 flex-col bg-[#F4F6F8]">
      <div className="mx-auto flex h-full min-h-0 w-full max-w-lg flex-1 flex-col px-4 pt-6 pb-4 sm:px-6">
        <ChatHeader
          tableId={tableId}
          headerLabel={headerLabel}
          showProfileChip={showProfileChip}
          showCompleteLink={showCompleteLink}
          completeProfileHref={null}
          profileChipLabel=""
          completeProfileLinkShortLabel=""
          completeProfileLinkBannerLabel=""
          onOpenOptionalProfile={undefined}
        />

        {usersSlot && <div className="mt-3 shrink-0">{usersSlot}</div>}

        <div className="mt-4 grid grid-cols-1 gap-2 sm:grid-cols-2">
          <button
            type="button"
            onClick={onCallWaiter}
            disabled={composerDisabled}
            className="w-full shrink-0 rounded-xl border border-[#E5E7EB] bg-white px-4 py-3 text-sm font-semibold text-[#1F2937] shadow-sm transition hover:bg-[#F1F5F9] hover:brightness-[0.98] active:brightness-95 disabled:cursor-not-allowed disabled:opacity-45"
          >
            Llamar mesero
          </button>
          {onLeaveChat && !composerDisabled ? (
            <button
              type="button"
              onClick={() => setLeaveModalOpen(true)}
              disabled={leaveChatBusy}
              className="w-full shrink-0 rounded-xl border border-[#FECACA] bg-[#FEF2F2] px-4 py-3 text-sm font-semibold text-[#B91C1C] shadow-sm transition hover:bg-[#FEE2E2] active:brightness-95 disabled:opacity-50"
            >
              Cerrar sesión de la mesa
            </button>
          ) : null}
        </div>

        <div className="mt-4 flex min-h-0 flex-1 flex-col rounded-2xl border border-[#E5E7EB] bg-white shadow-sm">
          {closureBanner ? (
            <div className="shrink-0 border-b border-amber-200 bg-amber-50 px-4 py-3 text-center">
              <p className="text-sm font-medium text-amber-950">{closureBanner}</p>
              {showStartNewSession && onStartNewSession ? (
                <button
                  type="button"
                  onClick={() => void onStartNewSession()}
                  disabled={newSessionBusy}
                  className="mt-2 rounded-lg bg-[#229ED9] px-4 py-2 text-xs font-semibold text-white shadow-sm transition hover:brightness-95 disabled:opacity-50"
                >
                  {newSessionBusy ? 'Abriendo…' : 'Iniciar nueva sesión'}
                </button>
              ) : null}
            </div>
          ) : null}
          <ChatMessagesPane
            messages={messages}
            currentSessionUserId={currentSessionUserId}
            viewerLanguage={viewerLanguage}
            lastReadAt={lastReadAt}
            sessionUsers={sessionUsers}
            waiterIncomingBubbleLabel={waiterIncomingBubbleLabel}
            typingIndicator={typingIndicator}
            onMessagesScroll={onMessagesScroll}
          />

          <ChatComposer
            message={message}
            disabled={composerDisabled}
            onMessageChange={onMessageChange}
            onSend={onSend}
          />
        </div>
      </div>

      <LeaveSessionModal
        open={leaveModalOpen}
        busy={leaveChatBusy}
        onCancel={() => setLeaveModalOpen(false)}
        onConfirm={async () => {
          try {
            await onLeaveChat?.();
            setLeaveModalOpen(false);
          } catch {
            /* reintentar */
          }
        }}
      />
    </div>
  );
}
