'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useState, type ReactNode } from 'react';
import { JoinByCodeModal } from '@/components/conversation/JoinByCodeModal';
import {
  SwitchConversationModal,
  type LeaveConversationIntent,
} from '@/components/conversation/SwitchConversationModal';
import { useMobileNavOptional } from '@/components/layout/MobileNavContext';
import {
  markAllMembersLeft,
  markMemberLeft,
} from '@/lib/model/conversation-members.repository';
import { closeConversationRecord } from '@/lib/model/conversations-table.repository';
import { useSupabaseAuth } from '@/lib/hooks/useSupabaseAuth';
import { supabase } from '@/lib/supabase';
import {
  clearActiveConversationSession,
  getActiveConversationSession,
  type ActiveConversationSession,
} from '@/lib/utils/active-conversation-session';
import { ThemeToggle } from '@/components/ui/ThemeToggle';
import { IconHitboxButton } from '@/components/ui/IconHitboxButton';
import { uiNavItem } from '@/components/ui/ui-classes';

type AppSidebarProps = {
  inviteCode?: string | null;
  shareUrl?: string | null;
  onShare?: () => void;
  onOpenQr?: () => void;
  composerDisabled?: boolean;
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
};

function SidebarShell({
  children,
  className = '',
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <aside
      className={`flex w-[min(280px,88vw)] shrink-0 flex-col bg-[var(--app-sidebar)] ${className}`}
    >
      <Link
        href="/"
        className="app-hover flex h-14 shrink-0 items-center gap-2.5 border-b border-[var(--app-border)] px-4 hover:bg-[var(--app-hover-bg)]"
      >
        <span className="btn-gradient grid h-8 w-8 place-items-center rounded-xl text-sm font-bold text-white">
          C
        </span>
        <div className="min-w-0">
          <p className="truncate text-sm font-bold text-[var(--app-text)]">
            Conversa
          </p>
          <p className="truncate text-[10px] text-[var(--app-muted)]">
            Multilingüe
          </p>
        </div>
      </Link>
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
}: SidebarNavProps) {
  const navItemClass = uiNavItem;
  const navBtnClass = `${navItemClass} w-full`;
  const closeOnNav = onNavigate ?? (() => undefined);

  return (
    <>
      <nav className="flex flex-1 flex-col gap-1 overflow-y-auto p-3 app-scrollbar">
        {session && conversationHref ? (
          <>
            <p className="px-2.5 pb-1 text-[10px] font-bold uppercase tracking-wider text-[var(--app-muted)]">
              Conversación actual
            </p>
            <Link
              href={conversationHref}
              className={navItemClass}
              onClick={closeOnNav}
            >
              <NavIcon name="home" />
              <span className="truncate">Inicio</span>
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
                      Invitar con QR
                    </button>
                  ) : null}
                  {onShare ? (
                    <button
                      type="button"
                      disabled={composerDisabled}
                      className="app-touchable touch-target app-hover rounded border border-[var(--app-border)] bg-[var(--app-hover-bg)] px-2.5 py-2.5 text-xs font-semibold text-[var(--app-text)] hover:bg-[var(--app-card)] disabled:opacity-40"
                      onClick={onShareClick}
                    >
                      Compartir enlace
                    </button>
                  ) : null}
                </div>
              </div>
            ) : null}
            <div className="my-2 h-px bg-[var(--app-border)]" />
          </>
        ) : null}

        {!session ? (
          <Link href="/create" className={navItemClass} onClick={closeOnNav}>
            <NavIcon name="plus" />
            Crear conversación
          </Link>
        ) : null}

        {session ? (
          <button type="button" className={navBtnClass} onClick={onJoinClick}>
            <NavIcon name="join" />
            Unirse a conversación
          </button>
        ) : (
          <Link href="/#join-panel" className={navBtnClass} onClick={closeOnNav}>
            <NavIcon name="join" />
            Unirse a conversación
          </Link>
        )}

        <div className="my-2 h-px bg-[var(--app-border)]" />

        {!authLoading && isAuthenticated ? (
          <>
            <Link href="/profile" className={navItemClass} onClick={closeOnNav}>
              <NavIcon name="user" />
              Perfil
            </Link>
            <Link href="/settings" className={navItemClass} onClick={closeOnNav}>
              <NavIcon name="settings" />
              Configuración
            </Link>
          </>
        ) : !authLoading ? (
          session ? (
            <>
              <button type="button" className={navBtnClass} onClick={onRegisterClick}>
                <NavIcon name="register" />
                Registrarse
              </button>
              <button type="button" className={navBtnClass} onClick={onLoginClick}>
                <NavIcon name="login" />
                Iniciar sesión
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
                Registrarse
              </Link>
              <Link href="/login" className={navItemClass} onClick={closeOnNav}>
                <NavIcon name="login" />
                Iniciar sesión
              </Link>
            </>
          )
        ) : null}
      </nav>

      <div className="shrink-0 border-t border-[var(--app-border)] p-3">
        <ThemeToggle showLabel className="justify-between px-1" />
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
  activeSession: activeSessionProp = null,
}: AppSidebarProps) {
  const router = useRouter();
  const mobileNav = useMobileNavOptional();
  const { isAuthenticated, isLoading: authLoading } = useSupabaseAuth();
  const [session, setSession] = useState<ActiveConversationSession | null>(null);
  const [joinOpen, setJoinOpen] = useState(false);
  const [switchOpen, setSwitchOpen] = useState(false);
  const [switchBusy, setSwitchBusy] = useState(false);
  const [switchIntent, setSwitchIntent] = useState<LeaveConversationIntent>('join');
  const [pendingAuthHref, setPendingAuthHref] = useState<string | null>(null);

  const closeMobile = useCallback(() => mobileNav?.closeNav(), [mobileNav]);

  useEffect(() => {
    setSession(activeSessionProp ?? getActiveConversationSession());
  }, [activeSessionProp]);

  const leaveCurrentSession = useCallback(async (s: ActiveConversationSession) => {
    if (s.isOwner) {
      await markAllMembersLeft(supabase, s.conversationId);
      await closeConversationRecord(supabase, s.conversationId, s.memberId);
    } else {
      await markMemberLeft(supabase, s.memberId);
    }
    clearActiveConversationSession();
    setSession(null);
  }, []);

  const openSwitchForIntent = (intent: LeaveConversationIntent) => {
    closeMobile();
    setSwitchIntent(intent);
    setPendingAuthHref(null);
    setSwitchOpen(true);
  };

  const handleAuthNav = (href: string, intent: 'register' | 'login') => {
    const current = session ?? getActiveConversationSession();
    if (current) {
      setSwitchIntent(intent);
      setPendingAuthHref(href);
      setSwitchOpen(true);
      closeMobile();
      return;
    }
    closeMobile();
    router.push(href);
  };

  const handleJoinClick = () => {
    closeMobile();
    const current = session ?? getActiveConversationSession();
    if (current) {
      openSwitchForIntent('join');
      return;
    }
    setJoinOpen(true);
  };

  const handleSwitchConfirm = async () => {
    const current = session ?? getActiveConversationSession();

    if (!current) {
      setSwitchOpen(false);
      if (switchIntent === 'join') setJoinOpen(true);
      else if (pendingAuthHref) router.push(pendingAuthHref);
      return;
    }

    setSwitchBusy(true);
    try {
      await leaveCurrentSession(current);
      setSwitchOpen(false);

      if (switchIntent === 'join') {
        setJoinOpen(true);
      } else if (pendingAuthHref) {
        router.push(pendingAuthHref);
        setPendingAuthHref(null);
      }
    } catch (e) {
      console.error('AppSidebar:leaveSession', e);
    } finally {
      setSwitchBusy(false);
    }
  };

  const conversationHref =
    session &&
    `/c/${session.conversationId}?member=${encodeURIComponent(session.memberId)}${session.lang ? `&lang=${encodeURIComponent(session.lang)}` : ''}`;

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
  };

  return (
    <>
      <SidebarShell className="hidden lg:flex">
        <SidebarNav {...navProps} />
      </SidebarShell>

      {mobileNav?.open ? (
        <>
          <button
            type="button"
            aria-label="Cerrar menú"
            onClick={() => closeMobile()}
            className="z-drawer-backdrop fixed inset-0 block w-full cursor-pointer bg-black/60 lg:hidden"
          />
          <SidebarShell className="drawer-panel z-drawer-panel fixed inset-y-0 left-0 shadow-2xl lg:hidden">
            <div className="flex items-center justify-between border-b border-[var(--app-border)] px-3 py-2 lg:hidden">
              <p className="text-sm font-bold text-[var(--app-text)]">Menú</p>
              <IconHitboxButton
                aria-label="Cerrar"
                className="touch-target rounded-xl px-3 py-2 text-sm text-[var(--app-muted)]"
                onAction={closeMobile}
              >
                Cerrar
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
  name: 'plus' | 'join' | 'user' | 'settings' | 'home' | 'register' | 'login';
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
  }
}
