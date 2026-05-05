'use client';

import Link from 'next/link';

type ChatHeaderProps = {
  tableId: string;
  headerLabel?: string;
  showProfileChip: boolean;
  showCompleteLink: boolean;
  completeProfileHref?: string | null;
  profileChipLabel: string;
  completeProfileLinkShortLabel: string;
  completeProfileLinkBannerLabel: string;
  onOpenOptionalProfile?: () => void;
};

export function ChatHeader({
  tableId,
  headerLabel,
  showProfileChip,
  showCompleteLink,
  completeProfileHref = null,
  profileChipLabel,
  completeProfileLinkShortLabel,
  completeProfileLinkBannerLabel,
  onOpenOptionalProfile,
}: ChatHeaderProps) {
  const showHeaderActions = showProfileChip || showCompleteLink;
  return (
    <>
      <header className="flex shrink-0 items-start justify-between gap-3 rounded-2xl border border-[#E5E7EB] bg-white px-5 py-4 shadow-sm">
        <div className="min-w-0 flex-1">
          <p className="text-xs font-medium uppercase tracking-wide text-[#6B7280]">
            Mesa
          </p>
          <h1 className="mt-1 truncate text-xl font-semibold text-[#1F2937]">
            {headerLabel ?? tableId}
          </h1>
        </div>
        {showHeaderActions ? (
          <div className="flex shrink-0 flex-col items-end gap-1.5">
            {showProfileChip ? (
              <button
                type="button"
                onClick={onOpenOptionalProfile}
                className="profile-chip-bounce rounded-lg bg-[#229ED9] px-3 py-2 text-center text-[11px] font-semibold leading-snug text-white shadow-sm transition hover:brightness-110 active:brightness-95"
              >
                {profileChipLabel}
              </button>
            ) : null}
            {showCompleteLink && completeProfileHref ? (
              <Link
                href={completeProfileHref}
                className="rounded-lg border border-[#229ED9] bg-[#E3F2FD] px-3 py-2 text-center text-[11px] font-semibold leading-snug text-[#0D47A1] shadow-sm transition hover:bg-[#BBDEFB]"
              >
                {completeProfileLinkShortLabel}
              </Link>
            ) : null}
          </div>
        ) : null}
      </header>

      {showCompleteLink && completeProfileHref ? (
        <div className="mt-3 shrink-0 rounded-xl border border-[#229ED9]/35 bg-[#E3F2FD]/90 px-4 py-3 shadow-sm">
          <p className="text-[11px] font-medium uppercase tracking-wide text-[#0D47A1]">
            Tu cuenta
          </p>
          <Link
            href={completeProfileHref}
            className="mt-1 inline-flex w-full items-center justify-center rounded-lg bg-[#229ED9] px-4 py-3 text-center text-sm font-semibold text-white shadow-sm transition hover:brightness-105"
          >
            {completeProfileLinkBannerLabel}
          </Link>
        </div>
      ) : null}
    </>
  );
}

