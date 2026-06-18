'use client';

import { useAppLanguage } from '@/lib/i18n/AppLanguageProvider';
import { TapButton } from '@/components/ui/TapButton';

type SoloOwnerInvitePromptProps = {
  inviteCode?: string | null;
  onOpenQr?: () => void;
  onShare?: () => void;
  composerDisabled?: boolean;
};

export function SoloOwnerInvitePrompt({
  inviteCode,
  onOpenQr,
  onShare,
  composerDisabled = false,
}: SoloOwnerInvitePromptProps) {
  const { t } = useAppLanguage();

  if (!onOpenQr && !onShare) return null;

  return (
    <div className="flex flex-1 flex-col items-center justify-center px-6 py-10 text-center">
      <p className="text-sm font-semibold text-[var(--app-text)]">
        {t.chat.soloOwnerTitle}
      </p>
      <p className="mt-2 max-w-xs text-sm text-[var(--app-muted)]">
        {t.chat.soloOwnerHint}
      </p>
      {inviteCode ? (
        <p className="mt-4 break-all font-mono text-xs tracking-widest text-[var(--app-muted)]">
          {inviteCode}
        </p>
      ) : null}
      <div className="mt-5 flex w-full max-w-xs flex-col gap-2">
        {onOpenQr ? (
          <TapButton
            onTap={onOpenQr}
            disabled={composerDisabled && !inviteCode}
            className="app-touchable touch-target app-hover rounded btn-gradient px-4 py-3 text-sm font-semibold disabled:opacity-40"
          >
            {t.sidebar.inviteQr}
          </TapButton>
        ) : null}
        {onShare ? (
          <TapButton
            onTap={onShare}
            disabled={composerDisabled}
            className="app-touchable touch-target app-hover rounded border border-[var(--app-border)] bg-[var(--app-hover-bg)] px-4 py-3 text-sm font-semibold text-[var(--app-text)] hover:bg-[var(--app-card)] disabled:opacity-40"
          >
            {t.sidebar.shareLink}
          </TapButton>
        ) : null}
      </div>
    </div>
  );
}
