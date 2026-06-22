'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { type ReactNode } from 'react';
import { ConversaBrand } from '@/components/brand/ConversaBrand';
import { ChatLanguageSelect } from '@/components/chat/ChatLanguageSelect';
import { JoinByCodeModal } from '@/components/conversation/JoinByCodeModal';
import { SwitchConversationModal } from '@/components/conversation/SwitchConversationModal';
import { type ActiveConversationSession } from '@/lib/utils/active-conversation-session';
import { useAppSidebarViewModel } from '@/lib/viewmodels/useAppSidebarViewModel';
import { ThemeToggle } from '@/components/ui/ThemeToggle';
import { IconHitboxButton } from '@/components/ui/IconHitboxButton';
import { uiNavItem } from '@/components/ui/ui-classes';
import { BillingStatusBadge } from '@/components/billing/BillingStatusBadge';
import { usePlanOptional } from '@/lib/billing/PlanProvider';
import { AUTH_HOME_PATH } from '@/lib/constants/routes';
import { useAppLanguage } from '@/lib/i18n/AppLanguageProvider';

type AppSidebarProps = {
  inviteCode?: string | null;
  shareUrl?: string | null;
  onShare?: () => void;
  onOpenQr?: () => void;
  composerDisabled?: boolean;
  chatLanguage?: string;
  chatLanguageOptions?: { code: string; name: string }[];
  onChatLanguageChange?: (code: string) => void;
  chatLanguageBusy?: boolean;
  activeSession?: ActiveConversationSession | null;
};

type SidebarNavProps = {
  session: ActiveConversationSession | null;
  conversationHref: string | false | null | undefined;
  inviteCode: string | null;
  onShare?: () => void;
  onOpenQr?: () => void;
  composerDisabled: boolean;
  authLoading: boolean;
  isAuthenticated: boolean;
  onNavigate?: () => void;
  onQrClick: () => void;
  onShareClick: () => void;
  onJoinClick: () => void;
  onRegisterClick: () => void;
  onLoginClick: () => void;
  onLogoutClick: () => void;
  chatLanguage?: string;
  chatLanguageOptions?: { code: string; name: string }[];
  onChatLanguageChange?: (code: string) => void;
  chatLanguageBusy?: boolean;
};

function SidebarShell({
  children,
  className = '',
}: {
  children: ReactNode;
  className?: string;
}) {
  const { t } = useAppLanguage();
  return (
    <aside
      className={`flex w-[min(280px,88vw)] shrink-0 flex-col bg-[var(--app-sidebar)] ${className}`}
    >
      <div className="flex h-14 shrink-0 items-center border-b border-[var(--app-border)] px-4 hover:bg-[var(--app-hover-bg)]">
        <ConversaBrand
          href="/app/home"
          size={32}
          subtitle={t.sidebar.brandSubtitle}
          className="w-full"
        />
      </div>
      {children}
    </aside>
  );
}

function SidebarNav({
  session,
  conversationHref,
  inviteCode,
  composerDisabled,
  authLoading,
  isAuthenticated,
  onNavigate,
  onOpenQr,
  onShare,
  onQrClick,
  onShareClick,
  onJoinClick,
  onRegisterClick,
  onLoginClick,
  onLogoutClick,
  chatLanguage,
  chatLanguageOptions,
  onChatLanguageChange,
  chatLanguageBusy = false,
}: SidebarNavProps) {
  const { t } = useAppLanguage();
  const navItemClass = uiNavItem;
  const navBtnClass = `${navItemClass} w-full`;
  const closeOnNav = onNavigate ?? (() => undefined);
  const plan = usePlanOptional();
  const pathname = usePathname();
  const onBilling = pathname === '/app/billing';

  return (
    <>
      <nav className="flex flex-1 flex-col gap-1 overflow-y-auto p-3 app-scrollbar">
        {session && conversationHref ? (
          <>
            <p className="px-2.5 pb-1 text-[10px] font-bold uppercase tracking-wider text-[var(--app-muted)]">
              {t.sidebar.currentConversation}
            </p>
            <Link
              href={conversationHref}
              className={navItemClass}
              onClick={closeOnNav}
            >
              <NavIcon name="home" />
              <span className="truncate">{t.sidebar.home}</span>
            </Link>
            {inviteCode ? (
              <div className="mx-0.5 rounded-md bg-[var(--app-bg)] px-3 py-2 ring-1 ring-[var(--app-border)]">
                <p className="break-all font-mono text-xs tracking-widest text-[var(--app-muted)]">
                  {inviteCode}
                </p>
                <div className="mt-2 flex flex-col gap-1.5">
                  {onOpenQr ? (
                    <button
                      type="button"
                      disabled={composerDisabled && !inviteCode}
                      className="app-touchable touch-target app-hover rounded btn-gradient px-2.5 py-2.5 text-xs font-semibold disabled:opacity-40"
                      onClick={onQrClick}
                    >
                      {t.sidebar.inviteQr}
                    </button>
                  ) : null}
                  {onShare ? (
                    <button
                      type="button"
                      disabled={composerDisabled}
                      className="app-touchable touch-target app-hover rounded border border-[var(--app-border)] bg-[var(--app-hover-bg)] px-2.5 py-2.5 text-xs font-semibold text-[var(--app-text)] hover:bg-[var(--app-card)] disabled:opacity-40"
                      onClick={onShareClick}
                    >
                      {t.sidebar.shareLink}
                    </button>
                  ) : null}
                </div>
              </div>
            ) : null}
            {chatLanguage && chatLanguageOptions && onChatLanguageChange ? (
              <ChatLanguageSelect
                className="mx-0.5 mt-2"
                value={chatLanguage}
                options={chatLanguageOptions}
                disabled={composerDisabled}
                busy={chatLanguageBusy}
                label={t.sidebar.chatLanguage}
                onChange={(code) => {
                  onChatLanguageChange(code);
                  closeOnNav();
                }}
              />
            ) : null}
            <div className="my-2 h-px bg-[var(--app-border)]" />
          </>
        ) : null}

        {!session ? (
          <Link href="/create" className={navItemClass} onClick={closeOnNav}>
            <NavIcon name="plus" />
            {t.sidebar.createConversation}
          </Link>
        ) : null}

        <button type="button" className={navBtnClass} onClick={onJoinClick}>
          <NavIcon name="join" />
          {t.sidebar.joinConversation}
        </button>

        <div className="my-2 h-px bg-[var(--app-border)]" />

        {!authLoading && isAuthenticated ? (
          <>
            {onBilling ? (
              <Link
                href={AUTH_HOME_PATH}
                className={`${navItemClass} font-semibold text-[var(--app-primary)]`}
                onClick={closeOnNav}
              >
                <NavIcon name="home" />
                {t.sidebar.home}
              </Link>
            ) : null}
            <Link
              href="/app/billing"
              className={`app-touchable touch-target btn-gradient mb-1 flex min-h-[44px] w-full items-center justify-center gap-2 rounded-xl px-2.5 py-2.5 text-sm font-semibold${onBilling ? ' ring-2 ring-[var(--app-primary)]/40' : ''}`}
              onClick={closeOnNav}
              aria-current={onBilling ? 'page' : undefined}
            >
              <NavIcon name="billing" />
              {t.sidebar.changePlan}
            </Link>
            <Link href="/profile" className={navItemClass} onClick={closeOnNav}>
              <NavIcon name="user" />
              {t.sidebar.profile}
            </Link>
            {!onBilling ? (
              <Link href={AUTH_HOME_PATH} className={navItemClass} onClick={closeOnNav}>
                <NavIcon name="home" />
                {t.sidebar.home}
              </Link>
            ) : null}
            <Link href="/settings" className={navItemClass} onClick={closeOnNav}>
              <NavIcon name="settings" />
              {t.sidebar.settings}
            </Link>
          </>
        ) : !authLoading ? (
          session ? (
            <>
              <button type="button" className={navBtnClass} onClick={onRegisterClick}>
                <NavIcon name="register" />
                {t.sidebar.register}
              </button>
              <button type="button" className={navBtnClass} onClick={onLoginClick}>
                <NavIcon name="login" />
                {t.sidebar.login}
              </button>
            </>
          ) : (
            <>
              <Link
                href="/register"
                className={navItemClass}
                onClick={closeOnNav}
              >
                <NavIcon name="register" />
                {t.sidebar.register}
              </Link>
              <Link href="/login" className={navItemClass} onClick={closeOnNav}>
                <NavIcon name="login" />
                {t.sidebar.login}
              </Link>
            </>
          )
        ) : null}
      </nav>

      <div className="shrink-0 space-y-2 border-t border-[var(--app-border)] p-3">
        {plan ? (
          <div className="flex items-center justify-between gap-2 px-1">
            <BillingStatusBadge
              tier={plan.tier}
              roomPassActive={
                plan.billing.roomPassActive && plan.tier !== 'pro'
              }
              compact
            />
            {plan.tier === 'free' ? (
              <Link
                href="/app/billing"
                className="text-[10px] font-semibold text-[var(--app-primary)] hover:underline"
                onClick={closeOnNav}
              >
                {t.sidebar.changePlan}
              </Link>
            ) : null}
          </div>
        ) : null}
        <ThemeToggle showLabel className="justify-between px-1" />
        {!authLoading && isAuthenticated ? (
          <button
            type="button"
            className={`${navBtnClass} text-[var(--app-danger)] hover:bg-[var(--app-danger)]/10`}
            onClick={onLogoutClick}
          >
            <NavIcon name="logout" />
            {t.sidebar.logout}
          </button>
        ) : null}
      </div>
    </>
  );
}

export function AppSidebar({
  inviteCode = null,
  shareUrl = null,
  onShare,
  onOpenQr,
  composerDisabled = false,
  chatLanguage,
  chatLanguageOptions,
  onChatLanguageChange,
  chatLanguageBusy = false,
  activeSession: activeSessionProp = null,
}: AppSidebarProps) {
  const { t } = useAppLanguage();
  const {
    isAuthenticated,
    authLoading,
    session,
    conversationHref,
    joinOpen,
    setJoinOpen,
    switchOpen,
    setSwitchOpen,
    switchBusy,
    switchIntent,
    setPendingAuthHref,
    closeMobile,
    mobileNavOpen,
    handleJoinClick,
    handleAuthNav,
    handleLogoutClick,
    handleSwitchConfirm,
  } = useAppSidebarViewModel({ activeSession: activeSessionProp });

  const wrapNavAction = (fn: () => void) => () => {
    closeMobile();
    fn();
  };

  const navProps: SidebarNavProps = {
    session,
    conversationHref,
    inviteCode,
    onShare,
    onOpenQr,
    composerDisabled,
    authLoading,
    isAuthenticated,
    onNavigate: closeMobile,
    onQrClick: wrapNavAction(() => onOpenQr?.()),
    onShareClick: wrapNavAction(() => onShare?.()),
    onJoinClick: handleJoinClick,
    onRegisterClick: () => handleAuthNav('/register', 'register'),
    onLoginClick: () => handleAuthNav('/login', 'login'),
    onLogoutClick: handleLogoutClick,
    chatLanguage,
    chatLanguageOptions,
    onChatLanguageChange,
    chatLanguageBusy,
  };

  return (
    <>
      <SidebarShell className="hidden lg:flex">
        <SidebarNav {...navProps} />
      </SidebarShell>

      {mobileNavOpen ? (
        <>
          <button
            type="button"
            aria-label="Cerrar menú"
            onClick={() => closeMobile()}
            className="z-drawer-backdrop fixed inset-0 block w-full cursor-pointer bg-black/60 lg:hidden"
          />
          <SidebarShell className="drawer-panel z-drawer-panel fixed inset-y-0 left-0 shadow-2xl lg:hidden">
            <div className="flex items-center justify-between border-b border-[var(--app-border)] px-3 py-2 lg:hidden">
              <p className="text-sm font-bold text-[var(--app-text)]">{t.common.menu}</p>
              <IconHitboxButton
                aria-label="Cerrar"
                className="touch-target rounded-xl px-3 py-2 text-sm text-[var(--app-muted)]"
                onAction={closeMobile}
              >
                {t.common.close}
              </IconHitboxButton>
            </div>
            <SidebarNav {...navProps} />
          </SidebarShell>
        </>
      ) : null}

      <JoinByCodeModal open={joinOpen} onClose={() => setJoinOpen(false)} />

      <SwitchConversationModal
        open={switchOpen}
        busy={switchBusy}
        isOwner={session?.isOwner ?? false}
        intent={switchIntent}
        onCancel={() => {
          setSwitchOpen(false);
          setPendingAuthHref(null);
        }}
        onConfirm={handleSwitchConfirm}
      />
    </>
  );
}

function NavIcon({
  name,
}: {
  name: 'plus' | 'join' | 'user' | 'settings' | 'home' | 'register' | 'login' | 'billing' | 'logout';
}) {
  const cls = 'h-4 w-4 shrink-0 opacity-80';
  switch (name) {
    case 'home':
      return (
        <svg className={cls} viewBox="0 0 24 24" fill="currentColor" aria-hidden>
          <path d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z" />
        </svg>
      );
    case 'plus':
      return (
        <svg className={cls} viewBox="0 0 24 24" fill="currentColor" aria-hidden>
          <path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z" />
        </svg>
      );
    case 'join':
      return (
        <svg className={cls} viewBox="0 0 24 24" fill="currentColor" aria-hidden>
          <path d="M15 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm-9-2V7H4v3H1v2h3v3h2v-3h3v-2H6zm9 4c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
        </svg>
      );
    case 'user':
      return (
        <svg className={cls} viewBox="0 0 24 24" fill="currentColor" aria-hidden>
          <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
        </svg>
      );
    case 'settings':
      return (
        <svg className={cls} viewBox="0 0 24 24" fill="currentColor" aria-hidden>
          <path d="M19.14 12.94c.04-.31.06-.63.06-.94 0-.31-.02-.63-.06-.94l2.03-1.58a.49.49 0 00.12-.61l-1.92-3.32a.488.488 0 00-.59-.22l-2.39.96c-.5-.38-1.03-.7-1.62-.94l-.36-2.54a.484.484 0 00-.48-.41h-3.84c-.24 0-.43.17-.47.41l-.36 2.54c-.59.24-1.13.57-1.62.94l-2.39-.96c-.22-.08-.47 0-.59.22L2.74 8.87c-.12.21-.08.47.12.61l2.03 1.58c-.04.31-.06.63-.06.94s.02.63.06.94l-2.03 1.58a.49.49 0 00-.12.61l1.92 3.32c.12.22.37.29.59.22l2.39-.96c.5.38 1.03.7 1.62.94l.36 2.54c.05.24.24.41.48.41h3.84c.24 0 .44-.17.47-.41l.36-2.54c.59-.24 1.13-.56 1.62-.94l2.39.96c.22.08.47 0 .59-.22l1.92-3.32c.12-.22.07-.47-.12-.61l-2.01-1.58zM12 15.6A3.6 3.6 0 1112 8.4a3.6 3.6 0 010 7.2z" />
        </svg>
      );
    case 'billing':
      return (
        <svg className={cls} viewBox="0 0 24 24" fill="currentColor" aria-hidden>
          <path d="M20 4H4c-1.11 0-1.99.89-1.99 2L2 18c0 1.11.89 2 2 2h16c1.11 0 2-.89 2-2V6c0-1.11-.89-2-2-2zm0 14H4v-6h16v6zm0-10H4V6h16v2z" />
        </svg>
      );
    case 'register':
      return (
        <svg className={cls} viewBox="0 0 24 24" fill="currentColor" aria-hidden>
          <path d="M15 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm-9 2v-2H4v-2H6V8h2v4h4v2H8zm9 4c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
        </svg>
      );
    case 'login':
      return (
        <svg className={cls} viewBox="0 0 24 24" fill="currentColor" aria-hidden>
          <path d="M11 7L9.6 8.4l2.6 2.6H2v2h10.2l-2.6 2.6L11 17l5-5-5-5zm9 12h-8v2h8c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2h-8v2h8v14z" />
        </svg>
      );
    case 'logout':
      return (
        <svg className={cls} viewBox="0 0 24 24" fill="currentColor" aria-hidden>
          <path d="M17 7l-1.41 1.41L18.17 11H8v2h10.17l-2.58 2.58L17 17l5-5-5-5zM4 5h8V3H4c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h8v-2H4V5z" />
        </svg>
      );
  }
}
