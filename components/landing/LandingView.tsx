'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { SessionEndedNotice } from '@/components/conversation/SessionEndedNotice';
import { ConversaBrand } from '@/components/brand/ConversaBrand';
import { ConversaIcon } from '@/components/brand/ConversaIcon';
import { PricingTable } from '@/components/billing/PricingTable';
import { JoinByCodeModal } from '@/components/conversation/JoinByCodeModal';
import { LandingLanguageToggle } from '@/components/landing/LandingLanguageToggle';
import { ThemeToggle } from '@/components/ui/ThemeToggle';
import { FormSubmitLabel } from '@/components/ui/FormSubmitLabel';
import { uiBtnPrimary, uiInput } from '@/components/ui/ui-classes';
import { AUTH_HOME_PATH } from '@/lib/constants/routes';
import { useLandingLanguage } from '@/lib/hooks/useLandingLanguage';
import { useAppLanguage } from '@/lib/i18n/AppLanguageProvider';
import { useSupabaseAuth } from '@/lib/hooks/useSupabaseAuth';
import { usePlan } from '@/lib/billing/PlanProvider';
import type { PlanDefinition } from '@/lib/billing/types';

const DEMO_FLAGS = ['🇺🇸', '🇲🇽', '🇫🇷'] as const;
const DEMO_LANGS = ['EN', 'ES', 'FR'] as const;

export function LandingView() {
  const router = useRouter();
  const plan = usePlan();
  const { isAuthenticated, isLoading: authLoading } = useSupabaseAuth();
  const { lang, setLang, t } = useLandingLanguage();
  const { t: appT } = useAppLanguage();
  const [inviteCode, setInviteCode] = useState('');
  const [joinOpen, setJoinOpen] = useState(false);

  useEffect(() => {
    if (authLoading) return;
    if (isAuthenticated) {
      router.replace(AUTH_HOME_PATH);
    }
  }, [isAuthenticated, authLoading, router]);

  if (authLoading || isAuthenticated) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-3 bg-[var(--app-bg)] text-sm text-[var(--app-muted)]">
        <ConversaIcon size={48} className="rounded-2xl" />
        {appT.common.loading}
      </div>
    );
  }

  const handleJoin = () => {
    const code = inviteCode.trim().toUpperCase();
    if (!code) {
      setJoinOpen(true);
      return;
    }
    router.push(`/join/${encodeURIComponent(code)}`);
  };

  const handleJoinNavClick = () => {
    if (window.location.hash === '#join-panel') {
      setJoinOpen(true);
      return;
    }
    document.getElementById('join-panel')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    window.history.replaceState(null, '', '#join-panel');
  };

  const handlePricingSelect = async (planId: PlanDefinition['id']) => {
    if (planId === 'free') {
      router.push('/create');
      return;
    }
    if (!plan.isAuthenticated) {
      router.push('/auth/register?redirect=/app/billing');
      return;
    }
    if (planId === 'pro') {
      await plan.upgradeToPro('/app/billing');
      return;
    }
    router.push('/app/billing');
  };

  return (
    <div className="min-h-screen overflow-x-hidden bg-[var(--app-bg)] text-[var(--app-text)]">
      <SessionEndedNotice />

      <section className="landing-nebula-bg relative min-h-[92vh] overflow-hidden">
        <div className="touch-decorative absolute inset-0 overflow-hidden">
          <div className="landing-nebula-blob landing-nebula-blob-1" />
          <div className="landing-nebula-blob landing-nebula-blob-2" />
          <div className="landing-nebula-blob landing-nebula-blob-3" />
          <video
            className="pointer-events-none h-full w-full object-cover opacity-25"
            autoPlay
            muted
            loop
            playsInline
            aria-hidden
          >
            <source src="/hero.mp4" type="video/mp4" />
            <source src="/hero.webm" type="video/webm" />
          </video>
          <div
            className="pointer-events-none absolute inset-0 backdrop-blur-[2px]"
            style={{ background: 'var(--landing-overlay)' }}
          />
          <div
            className="hero-gradient-animate pointer-events-none absolute inset-0 opacity-50"
            style={{ background: 'var(--app-gradient)' }}
          />
        </div>

        <header className="relative z-10 mx-auto max-w-6xl px-4 py-4 sm:px-6 sm:py-6">
          <div className="flex items-start justify-between gap-3">
            <LandingLanguageToggle lang={lang} onChange={setLang} embedded />
            <div className="flex min-w-0 flex-1 items-center gap-2.5 pl-1">
              <ConversaBrand
                size={40}
                subtitle={t.tagline}
                iconClassName="rounded-2xl glow-purple shrink-0"
                className="min-w-0 flex-1"
              />
            </div>
            <div className="hidden shrink-0 sm:block">
              <ThemeToggle compact />
            </div>
          </div>

          <div className="mt-3 flex items-center gap-2 sm:mt-4 sm:justify-end">
            <div className="shrink-0 sm:hidden">
              <ThemeToggle compact />
            </div>
            <Link
              href="/login"
              className="app-hover touch-target inline-flex min-h-[44px] flex-1 items-center justify-center rounded-xl px-3 py-2 text-sm font-medium text-[var(--app-text)] ring-1 ring-[var(--app-border)] hover:bg-[var(--app-hover-bg)] sm:flex-none sm:px-4"
            >
              {t.login}
            </Link>
            <Link
              href="/register"
              className="app-hover touch-target inline-flex min-h-[44px] flex-1 items-center justify-center rounded-xl bg-[var(--app-card)] px-3 py-2 text-sm font-medium ring-1 ring-[var(--app-border)] hover:bg-[var(--app-hover-bg)] sm:flex-none sm:px-4"
            >
              {t.register}
            </Link>
          </div>
        </header>

        <div className="relative z-10 mx-auto flex max-w-6xl flex-col items-start px-4 pb-20 pt-8 sm:px-6 sm:pb-24 sm:pt-10 lg:pt-20">
          <p
            className="animate-fade-in-up rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-widest text-[var(--app-primary)] ring-1 ring-[var(--app-primary)]/30"
            style={{ background: 'var(--app-hover-bg)' }}
          >
            {t.badge}
          </p>
          <h1 className="animate-fade-in-up mt-6 max-w-4xl text-3xl font-bold leading-[1.1] tracking-tight sm:text-5xl lg:text-6xl">
            {t.heroTitle}
          </h1>
          <p className="animate-fade-in-up mt-5 max-w-xl text-base leading-relaxed text-[var(--app-muted)] sm:text-lg">
            {t.heroSubtitle}
          </p>
          <div className="animate-fade-in-up mt-8 flex w-full flex-col gap-3 sm:mt-10 sm:flex-row sm:flex-wrap">
            <Link
              href="/create"
              className="app-hover touch-target btn-gradient inline-flex min-h-[44px] items-center justify-center rounded-xl px-6 py-3.5 text-center text-sm font-semibold glow-purple sm:px-8"
            >
              {t.createConversation}
            </Link>
            <button
              type="button"
              onClick={handleJoinNavClick}
              className="app-hover touch-target inline-flex min-h-[44px] items-center justify-center rounded-xl bg-[var(--app-card)] px-6 py-3.5 text-sm font-semibold ring-1 ring-[var(--app-border)] hover:bg-[var(--app-hover-bg)] sm:px-8"
            >
              {t.joinConversation}
            </button>
          </div>
        </div>
      </section>

      <section className="border-t border-[var(--app-border)] bg-[var(--app-bg)] px-4 py-16 sm:px-6 sm:py-20">
        <div className="mx-auto max-w-3xl text-center">
          <h2 className="text-xl font-bold tracking-tight sm:text-3xl">{t.liveTitle}</h2>
          <p className="mx-auto mt-3 max-w-lg text-[var(--app-muted)]">{t.liveSubtitle}</p>
        </div>

        <div className="mx-auto mt-12 max-w-md space-y-0">
          {t.demoUsers.map((step, i) => (
            <div key={DEMO_LANGS[i]}>
              <div className="app-hover rounded-2xl border border-[var(--app-border)] bg-[var(--app-card)] p-4 transition duration-200 hover:shadow-lg sm:p-5">
                <div className="flex items-center gap-3">
                  <span className="text-2xl" aria-hidden>
                    {DEMO_FLAGS[i]}
                  </span>
                  <div className="min-w-0 flex-1 text-left">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold">{step.name}</span>
                      <span className="badge-lang rounded-md px-1.5 py-0.5 text-[10px] font-bold">
                        {DEMO_LANGS[i]}
                      </span>
                    </div>
                    <p className="mt-1.5 text-[15px] leading-relaxed text-[var(--app-text)]">
                      {step.text}
                    </p>
                  </div>
                </div>
              </div>
              {i < t.demoUsers.length - 1 ? (
                <div
                  className="flex justify-center py-3 text-[var(--app-primary)]"
                  aria-hidden
                >
                  <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 16l-6-6h12l-6 6z" />
                  </svg>
                </div>
              ) : null}
            </div>
          ))}
        </div>
      </section>

      <section className="border-t border-[var(--app-border)] bg-[var(--app-card)] px-4 py-14 sm:px-6 sm:py-16">
        <div className="mx-auto grid max-w-6xl gap-10 lg:grid-cols-2 lg:items-center">
          <div>
            <h2 className="text-xl font-bold tracking-tight sm:text-2xl">{t.featuresTitle}</h2>
            <p className="mt-3 text-[var(--app-muted)]">{t.featuresSubtitle}</p>
            <ul className="mt-6 space-y-3 text-sm text-[var(--app-muted)]">
              {t.features.map((item) => (
                <li key={item} className="flex items-start gap-2">
                  <span
                    className="mt-0.5 inline-block h-1.5 w-1.5 shrink-0 rounded-full"
                    style={{ background: 'var(--app-gradient)' }}
                  />
                  {item}
                </li>
              ))}
            </ul>
          </div>
          <div className="rounded-2xl border border-[var(--app-border)] bg-[var(--app-bg)] p-4 glow-purple sm:p-6">
            <div className="space-y-5">
              <div className="flex gap-3">
                <div
                  className="h-9 w-9 shrink-0 rounded-full"
                  style={{ background: 'var(--app-gradient)' }}
                />
                <div className="min-w-0">
                  <p className="text-xs font-semibold">
                    John <span className="text-[var(--app-muted)]">· 12:35</span>{' '}
                    <span className="badge-lang ml-1 rounded px-1 py-0.5 text-[10px]">
                      EN
                    </span>
                  </p>
                  <p className="mt-1 text-sm">{t.chatTranslated}</p>
                  <p className="mt-2 border-l-2 border-[var(--app-primary)]/40 pl-2 text-xs text-[var(--app-muted)]">
                    <span className="font-semibold text-[var(--app-text)]">
                      {t.chatOriginal}
                    </span>
                    <br />
                    Hello, how are you?
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section
        id="pricing"
        className="border-t border-[var(--app-border)] bg-[var(--app-bg)] px-4 py-16 sm:px-6 sm:py-20"
      >
        <div className="mx-auto max-w-5xl">
          <PricingTable
            locale={lang}
            onSelectPlan={handlePricingSelect}
          />
        </div>
      </section>

      <section
        id="join-panel"
        className="border-t border-[var(--app-border)] bg-[var(--app-bg)] px-4 py-12 sm:px-6 sm:py-14"
      >
        <div className="mx-auto max-w-md min-w-0">
          <h2 className="text-xl font-bold">{t.joinTitle}</h2>
          <p className="mt-2 text-sm text-[var(--app-muted)]">{t.joinSubtitle}</p>
          <form
            className="mt-5 flex min-w-0 flex-col gap-2 sm:flex-row"
            onSubmit={(e) => {
              e.preventDefault();
              handleJoin();
            }}
          >
            <input
              type="text"
              value={inviteCode}
              onChange={(e) => setInviteCode(e.target.value.toUpperCase())}
              placeholder={t.joinPlaceholder}
              className={`${uiInput} min-w-0 font-mono uppercase tracking-widest`}
            />
            <FormSubmitLabel
              id="landing-join-submit"
              label={t.joinSubmit}
              className={`${uiBtnPrimary} sm:w-auto sm:shrink-0 sm:px-8`}
            />
          </form>
        </div>
      </section>

      <JoinByCodeModal open={joinOpen} onClose={() => setJoinOpen(false)} />
    </div>
  );
}
