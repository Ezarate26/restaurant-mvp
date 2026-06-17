'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import { useRouter } from 'next/navigation';
import { useSupabaseAuth } from '@/lib/hooks/useSupabaseAuth';
import {
  canUseVoice,
  getEffectiveLimits,
  getRoomDurationMs,
} from '@/lib/billing/plan-capabilities';
import {
  EMPTY_BILLING_SNAPSHOT,
  resolveBillingUiMode,
  type BillingUiMode,
  type UserBillingSnapshot,
} from '@/lib/billing/billing-state';
import {
  fetchUserBilling,
  openBillingPortal,
  startProCheckout,
  startRoomPassCheckout,
} from '@/lib/billing/stripe-client';
import type { PlanLimits, PlanTier } from '@/lib/billing/types';

type PlanContextValue = {
  billing: UserBillingSnapshot;
  tier: PlanTier;
  uiMode: BillingUiMode;
  limits: PlanLimits;
  isAuthenticated: boolean;
  isLoading: boolean;
  hasActiveRoomPass: (conversationId: string) => boolean;
  canUseVoiceInRoom: (conversationId: string) => boolean;
  getRoomDurationMsForRoom: (conversationId: string) => number;
  requireAuthForUpgrade: () => boolean;
  upgradeToPro: (returnUrl?: string) => Promise<void>;
  buyRoomPass: (conversationId: string, returnUrl?: string) => Promise<void>;
  manageBilling: (returnUrl?: string) => Promise<void>;
  refreshPlan: (conversationId?: string) => Promise<UserBillingSnapshot | null>;
  syncForConversation: (conversationId: string) => Promise<void>;
};

const PlanContext = createContext<PlanContextValue | null>(null);

export function PlanProvider({ children }: { children: ReactNode }) {
  const router = useRouter();
  const { user, isAuthenticated, isLoading: authLoading } = useSupabaseAuth();
  const [billing, setBilling] = useState<UserBillingSnapshot>(EMPTY_BILLING_SNAPSHOT);
  const [billingLoading, setBillingLoading] = useState(false);
  const billingRef = useRef(billing);
  billingRef.current = billing;

  const refreshPlan = useCallback(
    async (conversationId?: string): Promise<UserBillingSnapshot | null> => {
      if (!isAuthenticated || !user?.id) {
        setBilling({ ...EMPTY_BILLING_SNAPSHOT });
        return null;
      }

      setBillingLoading(true);
      try {
        const state = await fetchUserBilling(conversationId);
        if (state) {
          setBilling(state);
          return state;
        }
        return billingRef.current;
      } catch {
        return billingRef.current;
      } finally {
        setBillingLoading(false);
      }
    },
    [isAuthenticated, user?.id]
  );

  useEffect(() => {
    void refreshPlan();
  }, [refreshPlan]);

  useEffect(() => {
    const onVisible = () => {
      if (document.visibilityState === 'visible' && isAuthenticated) {
        void refreshPlan();
      }
    };
    document.addEventListener('visibilitychange', onVisible);
    return () => document.removeEventListener('visibilitychange', onVisible);
  }, [isAuthenticated, refreshPlan]);

  const syncForConversation = useCallback(
    async (conversationId: string) => {
      await refreshPlan(conversationId);
    },
    [refreshPlan]
  );

  const requireAuthForUpgrade = useCallback(() => {
    if (isAuthenticated) return false;
    router.push('/auth/register?redirect=/app/billing');
    return true;
  }, [isAuthenticated, router]);

  const upgradeToPro = useCallback(
    async (returnUrl = '/app/billing') => {
      if (requireAuthForUpgrade()) return;
      if (billingRef.current.tier === 'pro') return;
      await startProCheckout(returnUrl);
    },
    [requireAuthForUpgrade]
  );

  const buyRoomPass = useCallback(
    async (conversationId: string, returnUrl?: string) => {
      if (requireAuthForUpgrade()) return;
      if (billingRef.current.tier === 'pro') return;
      await startRoomPassCheckout(conversationId, returnUrl ?? '/app/billing');
    },
    [requireAuthForUpgrade]
  );

  const manageBilling = useCallback(
    async (returnUrl = '/app/billing') => {
      if (requireAuthForUpgrade()) return;
      await openBillingPortal(returnUrl);
    },
    [requireAuthForUpgrade]
  );

  const hasActiveRoomPass = useCallback(
    (conversationId: string) => {
      if (billing.tier === 'pro') return false;
      if (
        billing.roomPassActive &&
        billing.roomPassConversationId === conversationId
      ) {
        return true;
      }
      return billing.activeRoomPasses.some(
        (p) =>
          p.conversationId === conversationId &&
          Date.parse(p.expiresAt) > Date.now()
      );
    },
    [billing]
  );

  const tier = billing.tier;
  const uiMode = resolveBillingUiMode(billing);

  const canUseVoiceInRoom = useCallback(
    (conversationId: string) =>
      canUseVoice(tier, hasActiveRoomPass(conversationId)),
    [tier, hasActiveRoomPass]
  );

  const getRoomDurationMsForRoom = useCallback(
    (conversationId: string) =>
      getRoomDurationMs(tier, hasActiveRoomPass(conversationId)),
    [tier, hasActiveRoomPass]
  );

  const limits = useMemo(
    () => getEffectiveLimits(tier, billing.roomPassActive),
    [tier, billing.roomPassActive]
  );

  const value = useMemo<PlanContextValue>(
    () => ({
      billing,
      tier,
      uiMode,
      limits,
      isAuthenticated,
      isLoading: authLoading || billingLoading,
      hasActiveRoomPass,
      canUseVoiceInRoom,
      getRoomDurationMsForRoom,
      requireAuthForUpgrade,
      upgradeToPro,
      buyRoomPass,
      manageBilling,
      refreshPlan,
      syncForConversation,
    }),
    [
      billing,
      tier,
      uiMode,
      limits,
      isAuthenticated,
      authLoading,
      billingLoading,
      hasActiveRoomPass,
      canUseVoiceInRoom,
      getRoomDurationMsForRoom,
      requireAuthForUpgrade,
      upgradeToPro,
      buyRoomPass,
      manageBilling,
      refreshPlan,
      syncForConversation,
    ]
  );

  return <PlanContext.Provider value={value}>{children}</PlanContext.Provider>;
}

export function usePlan() {
  const ctx = useContext(PlanContext);
  if (!ctx) throw new Error('usePlan must be used within PlanProvider');
  return ctx;
}

export function usePlanOptional() {
  return useContext(PlanContext);
}
