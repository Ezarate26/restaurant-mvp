'use client';

import Link from 'next/link';
import { uiBtnGhost } from '@/components/ui/ui-classes';

type UpgradeBannerProps = {
  onUpgrade?: () => void;
  variant?: 'inline' | 'compact';
  message?: string;
};

export function UpgradeBanner({
  onUpgrade,
  variant = 'inline',
  message,
}: UpgradeBannerProps) {
  const text =
    message ??
    'Desbloquea voz, todos los idiomas y salas de hasta 60 min con Pro.';

  if (variant === 'compact') {
    return (
      <div className="flex items-center justify-between gap-2 rounded-xl bg-[var(--app-primary)]/10 px-3 py-2 text-xs ring-1 ring-[var(--app-primary)]/20">
        <span className="text-[var(--app-text)]">{text}</span>
        {onUpgrade ? (
          <button
            type="button"
            onClick={onUpgrade}
            className="shrink-0 font-semibold text-[var(--app-primary)] hover:underline"
          >
            Upgrade
          </button>
        ) : (
          <Link href="/app/billing" className="shrink-0 font-semibold text-[var(--app-primary)]">
            Upgrade
          </Link>
        )}
      </div>
    );
  }

  return (
    <div className="nebula-glass shrink-0 border-b border-[var(--app-border)] px-4 py-3 sm:px-5">
      <div className="mx-auto flex max-w-3xl flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-[var(--app-primary)]">
            Plan Free
          </p>
          <p className="mt-1 text-sm text-[var(--app-muted)]">{text}</p>
        </div>
        <div className="flex shrink-0 gap-2">
          {onUpgrade ? (
            <button type="button" onClick={onUpgrade} className={uiBtnGhost}>
              Hazte Pro →
            </button>
          ) : (
            <Link href="/app/billing" className={uiBtnGhost}>
              Hazte Pro →
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}
