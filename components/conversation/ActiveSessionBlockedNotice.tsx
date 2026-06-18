'use client';

import { useAppLanguage } from '@/lib/i18n/AppLanguageProvider';

type ActiveSessionBlockedNoticeProps = {
  inviteCode?: string | null;
  className?: string;
};

export function ActiveSessionBlockedNotice({
  inviteCode,
  className = '',
}: ActiveSessionBlockedNoticeProps) {
  const { t } = useAppLanguage();

  return (
    <div
      className={`rounded-lg border border-[var(--app-warning)]/40 bg-[var(--app-warning)]/10 px-4 py-3 text-sm text-[var(--app-text)] ${className}`}
      role="alert"
    >
      <p className="font-semibold">{t.activeSession.blockedTitle}</p>
      <p className="mt-1 text-[var(--app-muted)]">{t.activeSession.blockedBody}</p>
      {inviteCode ? (
        <p className="mt-2 font-mono text-xs tracking-widest text-[var(--app-muted)]">
          {t.activeSession.activeCode}: {inviteCode}
        </p>
      ) : null}
    </div>
  );
}
