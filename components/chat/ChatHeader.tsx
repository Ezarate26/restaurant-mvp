'use client';

import Link from 'next/link';
import type { ConversationMember } from '@/lib/model/types';
import { ParticipantAvatarStack } from '@/components/ui/ParticipantAvatarStack';
import { ThemeToggle } from '@/components/ui/ThemeToggle';
import { IconHitboxButton } from '@/components/ui/IconHitboxButton';
import { TapButton } from '@/components/ui/TapButton';
import { MobileNavButton } from '@/components/layout/MobileNavContext';
import { uiIconBtn } from '@/components/ui/ui-classes';

type ChatHeaderProps = {
  conversationId: string;
  headerLabel?: string;
  members?: ConversationMember[];
  currentMemberId?: string | null;
  participantCount?: number;
  isActive?: boolean;
  inviteCode?: string | null;
  isOwner?: boolean;
  composerDisabled?: boolean;
  onOpenParticipants?: () => void;
  onOpenInvite?: () => void;
  onShare?: () => void;
  onLeave?: () => void;
  onCloseConversation?: () => void;
  showProfileChip?: boolean;
  showCompleteLink?: boolean;
  completeProfileHref?: string | null;
  profileChipLabel?: string;
  completeProfileLinkShortLabel?: string;
  completeProfileLinkBannerLabel?: string;
  onOpenOptionalProfile?: () => void;
};

export function ChatHeader({
  members = [],
  currentMemberId = null,
  participantCount = 0,
  isActive = true,
  isOwner = false,
  composerDisabled = false,
  onOpenParticipants,
  onOpenInvite,
  onShare,
  onLeave,
  onCloseConversation,
  showProfileChip = false,
  showCompleteLink = false,
  completeProfileHref = null,
  profileChipLabel = '',
  completeProfileLinkShortLabel = '',
  completeProfileLinkBannerLabel = '',
  onOpenOptionalProfile,
}: ChatHeaderProps) {
  const currentMember = members.find((m) => m.id === currentMemberId);
  const myName =
    currentMember?.display_name?.trim() || 'Tu conversación';
  const count =
    participantCount > 0
      ? participantCount
      : members.filter((m) => !m.left_at).length;

  return (
    <>
      <header className="z-app-header relative flex shrink-0 items-center justify-between gap-2 border-b border-[var(--app-border)] bg-[var(--app-sidebar)] px-2 py-2.5 shadow-sm sm:gap-3 sm:px-4 sm:py-3">
        <div className="flex min-w-0 flex-1 items-center gap-2 sm:gap-3">
          <MobileNavButton />
          <ParticipantAvatarStack members={members} size="md" />
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5">
              <h1 className="truncate text-sm font-bold text-[var(--app-text)] sm:text-base">
                {myName}
              </h1>
              {isActive && !composerDisabled ? (
                <span className="inline-flex items-center gap-1 rounded-full bg-[var(--app-success)]/15 px-2 py-0.5 text-[10px] font-semibold text-[var(--app-success)]">
                  <span aria-hidden>🟢</span> Activa
                </span>
              ) : (
                <span className="inline-flex items-center rounded-full bg-[var(--app-muted)]/15 px-2 py-0.5 text-[10px] font-semibold text-[var(--app-muted)]">
                  Finalizada
                </span>
              )}
            </div>
            {count > 0 ? (
              <p className="mt-0.5 text-xs text-[var(--app-muted)]">
                {count} participante{count === 1 ? '' : 's'} conectado
                {count === 1 ? '' : 's'}
              </p>
            ) : null}
          </div>
        </div>

        <div className="flex shrink-0 items-center gap-0 sm:gap-1">
          <span className="max-md:hidden">
            <ThemeToggle compact />
          </span>
          {onOpenParticipants ? (
            <IconHitboxButton
              className={`${uiIconBtn} md:hidden`}
              aria-label="Ver participantes"
              title="Participantes"
              onAction={() => onOpenParticipants()}
            >
              <UsersIcon />
            </IconHitboxButton>
          ) : null}
          {onOpenInvite ? (
            <IconHitboxButton
              disabled={composerDisabled}
              className="btn-gradient rounded-xl text-white disabled:opacity-40 max-md:hidden"
              aria-label="Invitar con QR"
              title="Invitar con QR"
              onAction={() => onOpenInvite()}
            >
              <QrIcon />
            </IconHitboxButton>
          ) : null}
          {onShare ? (
            <IconHitboxButton
              disabled={composerDisabled}
              className={`${uiIconBtn} max-md:hidden`}
              aria-label="Compartir enlace"
              title="Compartir enlace"
              onAction={() => onShare()}
            >
              <ShareIcon />
            </IconHitboxButton>
          ) : null}
          {onLeave && !composerDisabled ? (
            <IconHitboxButton
              className={uiIconBtn}
              aria-label="Salir"
              title="Salir"
              onAction={() => onLeave()}
            >
              <LeaveIcon />
            </IconHitboxButton>
          ) : null}
          {isOwner && onCloseConversation && !composerDisabled ? (
            <IconHitboxButton
              className="rounded-xl text-[var(--app-danger)] hover:bg-[var(--app-danger)]/15"
              aria-label="Finalizar conversación"
              title="Finalizar"
              onAction={() => onCloseConversation()}
            >
              <CloseIcon />
            </IconHitboxButton>
          ) : null}
        </div>
      </header>

      {showCompleteLink && completeProfileHref ? (
        <div className="shrink-0 border-b border-[var(--app-border)] bg-[var(--app-sidebar)] px-3 py-3 sm:px-4">
          <Link
            href={completeProfileHref}
            className="btn-gradient touch-target block min-h-[44px] rounded-xl px-4 py-2.5 text-center text-sm font-semibold leading-[44px]"
          >
            {completeProfileLinkBannerLabel || completeProfileLinkShortLabel}
          </Link>
        </div>
      ) : null}

      {showProfileChip && onOpenOptionalProfile ? (
        <div className="shrink-0 border-b border-[var(--app-border)] px-3 py-2 sm:px-4">
          <TapButton
            onTap={onOpenOptionalProfile}
            className="btn-gradient w-full min-h-[44px] rounded-xl px-3 py-2 text-xs font-semibold"
          >
            {profileChipLabel}
          </TapButton>
        </div>
      ) : null}
    </>
  );
}

function UsersIcon() {
  return (
    <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5c-1.66 0-3 1.34-3 3s1.34 3 3 3zm-8 0c1.66 0 2.99-1.34 2.99-3S9.66 5 8 5C6.34 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5C15 14.17 10.33 13 8 13zm8 0c-.29 0-.62.02-.97.05 1.16.84 1.97 1.97 1.97 3.45V19h6v-2.5c0-2.33-4.67-3.5-7-3.5z" />
    </svg>
  );
}

function QrIcon() {
  return (
    <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M3 3h8v8H3V3zm2 2v4h4V5H5zm8-2h8v8h-8V3zm2 2v4h4V5h-4zM3 13h8v8H3v-8zm2 2v4h4v-4H5zm13-2h3v3h-3v-3zm-3 0h3v3h-3v-3zm3 3h3v3h-3v-3zm-3 3h3v3h-3v-3zm3 0h3v3h-3v-3z" />
    </svg>
  );
}

function ShareIcon() {
  return (
    <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M18 16.08c-.76 0-1.44.3-1.96.77L8.91 12.7c.05-.23.09-.46.09-.7s-.04-.47-.09-.7l7.05-4.11c.54.5 1.25.81 2.04.81 1.66 0 3-1.34 3-3s-1.34-3-3-3-3 1.34-3 3c0 .24.04.47.09.7L8.04 9.81C7.5 9.31 6.79 9 6 9c-1.66 0-3 1.34-3 3s1.34 3 3 3c.79 0 1.5-.31 2.04-.81l7.12 4.16c-.05.21-.08.43-.08.65 0 1.61 1.31 2.92 2.92 2.92s2.92-1.31 2.92-2.92-1.31-2.92-2.92-2.92z" />
    </svg>
  );
}

function LeaveIcon() {
  return (
    <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M17 7l-1.41 1.41L18.17 11H8v2h10.17l-2.58 2.58L17 17l5-5-5-5zM4 5h8V3H4c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h8v-2H4V5z" />
    </svg>
  );
}

function CloseIcon() {
  return (
    <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12 19 6.41z" />
    </svg>
  );
}

/** @deprecated Usar conversationId */
export type LegacyChatHeaderProps = ChatHeaderProps & { tableId?: string };
