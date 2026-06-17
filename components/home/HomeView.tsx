'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { SessionEndedNotice } from '@/components/conversation/SessionEndedNotice';
import { UpgradeInviteModal } from '@/components/billing/UpgradeInviteModal';
import { BillingStatusBadge } from '@/components/billing/BillingStatusBadge';
import { ConversaIcon } from '@/components/brand/ConversaIcon';
import { JoinByCodeModal } from '@/components/conversation/JoinByCodeModal';
import { AppSidebar } from '@/components/layout/AppSidebar';
import {
  MobileNavButton,
  MobileNavProvider,
} from '@/components/layout/MobileNavContext';
import { ThemeToggle } from '@/components/ui/ThemeToggle';
import { consumeShowProInvite } from '@/lib/auth/pro-invite.storage';
import { usePlan } from '@/lib/billing/PlanProvider';
import { useSupabaseAuth } from '@/lib/hooks/useSupabaseAuth';
import { useAppLanguage } from '@/lib/i18n/AppLanguageProvider';
import { formatMessage } from '@/lib/i18n/messages';
import { uiBtnPrimary, uiBtnSecondary } from '@/components/ui/ui-classes';

export function HomeView() {
  const router = useRouter();
  const { tier } = usePlan();
  const { user } = useSupabaseAuth();
  const { t } = useAppLanguage();
  const [joinOpen, setJoinOpen] = useState(false);
  const [proInviteOpen, setProInviteOpen] = useState(false);

  useEffect(() => {
    if (consumeShowProInvite()) setProInviteOpen(true);
  }, []);

  const displayName =
    user?.user_metadata?.full_name?.trim() ||
    user?.email?.split('@')[0] ||
    'Usuario';

  return (
    <MobileNavProvider>
      <div className="flex h-[100dvh] min-h-0 overflow-x-hidden bg-[var(--app-bg)]">
        <AppSidebar />

        <div className="flex min-h-0 min-w-0 flex-1 flex-col">
          <SessionEndedNotice />
          <header className="relative z-app-header grid shrink-0 grid-cols-[auto_1fr_auto] items-center gap-2 border-b border-[var(--app-border)] bg-[var(--app-sidebar)] px-3 py-2.5 lg:hidden">
            <MobileNavButton />
            <div className="flex justify-center">
              <ConversaIcon size={28} className="rounded-lg" />
            </div>
            <div className="flex items-center justify-end gap-2">
              <BillingStatusBadge tier={tier} compact />
              <ThemeToggle compact />
            </div>
          </header>

          <main className="chat-pane-bg flex min-h-0 flex-1 flex-col items-center justify-center px-4 py-10">
            <div className="w-full max-w-md text-center">
              <p className="text-xs font-semibold uppercase tracking-widest text-[var(--app-primary)]">
                {t.home.badge}
              </p>
              <h1 className="mt-3 text-2xl font-bold tracking-tight sm:text-3xl">
                {formatMessage(t.home.greeting, { name: displayName })}
              </h1>
              <p className="mt-3 text-sm leading-relaxed text-[var(--app-muted)]">
                {t.home.subtitle}
              </p>

              <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">
                <Link
                  href="/create"
                  className={`${uiBtnPrimary} sm:w-auto sm:min-w-[200px] sm:px-8`}
                >
                  {t.home.createConversation}
                </Link>
                <button
                  type="button"
                  onClick={() => setJoinOpen(true)}
                  className={`${uiBtnSecondary} sm:w-auto sm:min-w-[200px] sm:px-8`}
                >
                  {t.home.joinConversation}
                </button>
              </div>

              <p className="mt-6 text-xs text-[var(--app-muted)]">
                {t.home.currentPlan}{' '}
                <span className="font-semibold text-[var(--app-text)]">
                  {tier === 'pro' ? t.home.planPro : t.home.planFree}
                </span>
              </p>
            </div>
          </main>
        </div>

        <JoinByCodeModal open={joinOpen} onClose={() => setJoinOpen(false)} />

        <UpgradeInviteModal
          open={proInviteOpen}
          onClose={() => setProInviteOpen(false)}
          onGoPro={() => {
            setProInviteOpen(false);
            router.push('/app/billing');
          }}
        />
      </div>
    </MobileNavProvider>
  );
}
