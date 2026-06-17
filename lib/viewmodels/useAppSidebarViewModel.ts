'use client';

import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useState } from 'react';
import { type LeaveConversationIntent } from '@/components/conversation/SwitchConversationModal';
import { useMobileNavOptional } from '@/components/layout/MobileNavContext';
import {
  leaveActiveConversationSession,
  logoutAndReturnToLanding,
} from '@/lib/auth/session-logout';
import { useSupabaseAuth } from '@/lib/hooks/useSupabaseAuth';
import {
  getActiveConversationSession,
  type ActiveConversationSession,
} from '@/lib/utils/active-conversation-session';

export interface UseAppSidebarViewModelArgs {
  activeSession?: ActiveConversationSession | null;
}

/**
 * Coordinación del sidebar: sesión activa, modales (unirse / cambiar),
 * logout y navegación a auth. Extraído de `AppSidebar` para que el
 * componente quede puramente presentacional (MVVM).
 */
export function useAppSidebarViewModel({
  activeSession: activeSessionProp = null,
}: UseAppSidebarViewModelArgs) {
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

  const leaveCurrentSession = useCallback(
    async (s: ActiveConversationSession) => {
      await leaveActiveConversationSession(s);
      setSession(null);
    },
    []
  );

  const performLogout = useCallback(async () => {
    setSwitchBusy(true);
    try {
      const current = session ?? getActiveConversationSession();
      if (current) {
        await leaveCurrentSession(current);
      }
      await logoutAndReturnToLanding();
    } catch (e) {
      console.error('AppSidebar:logout', e);
    } finally {
      setSwitchBusy(false);
    }
  }, [session, leaveCurrentSession]);

  const handleLogoutClick = useCallback(() => {
    closeMobile();
    const current = session ?? getActiveConversationSession();
    if (current) {
      setSwitchIntent('logout');
      setPendingAuthHref(null);
      setSwitchOpen(true);
      return;
    }
    void performLogout();
  }, [closeMobile, session, performLogout]);

  const openSwitchForIntent = useCallback(
    (intent: LeaveConversationIntent) => {
      closeMobile();
      setSwitchIntent(intent);
      setPendingAuthHref(null);
      setSwitchOpen(true);
    },
    [closeMobile]
  );

  const handleAuthNav = useCallback(
    (href: string, intent: 'register' | 'login') => {
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
    },
    [session, closeMobile, router]
  );

  const handleJoinClick = useCallback(() => {
    closeMobile();
    const current = session ?? getActiveConversationSession();
    if (current) {
      openSwitchForIntent('join');
      return;
    }
    setJoinOpen(true);
  }, [closeMobile, session, openSwitchForIntent]);

  const handleSwitchConfirm = useCallback(async () => {
    const current = session ?? getActiveConversationSession();

    if (!current) {
      setSwitchOpen(false);
      if (switchIntent === 'join') setJoinOpen(true);
      else if (switchIntent === 'logout') await performLogout();
      else if (pendingAuthHref) router.push(pendingAuthHref);
      return;
    }

    setSwitchBusy(true);
    try {
      await leaveCurrentSession(current);
      setSwitchOpen(false);

      if (switchIntent === 'logout') {
        await logoutAndReturnToLanding();
        return;
      }

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
  }, [session, switchIntent, pendingAuthHref, performLogout, leaveCurrentSession, router]);

  const conversationHref =
    session &&
    `/c/${session.conversationId}?member=${encodeURIComponent(session.memberId)}${session.lang ? `&lang=${encodeURIComponent(session.lang)}` : ''}`;

  return {
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
    mobileNavOpen: Boolean(mobileNav?.open),
    handleJoinClick,
    handleAuthNav,
    handleLogoutClick,
    handleSwitchConfirm,
  };
}
