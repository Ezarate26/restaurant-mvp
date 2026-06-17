import type { PlanTier } from '@/lib/billing/types';

export type ActiveRoomPassInfo = {
  conversationId: string;
  expiresAt: string;
  purchasedAt: string;
};

/** Respuesta canónica del backend — única fuente de verdad para el cliente */
export type UserBillingSnapshot = {
  tier: PlanTier;
  isAuthenticated: boolean;
  subscriptionStatus: string | null;
  proExpiresAt: string | null;
  stripeCustomerId: string | null;
  trialUsed: boolean;
  trialUsedAt: string | null;
  /** Pase activo en la conversación consultada (query ?conversationId=) */
  roomPassActive: boolean;
  roomPassExpiresAt: string | null;
  roomPassConversationId: string | null;
  /** Todos los pases activos del usuario */
  activeRoomPasses: ActiveRoomPassInfo[];
};

export type BillingUiMode = 'free' | 'pro' | 'room_pass';

export const EMPTY_BILLING_SNAPSHOT: UserBillingSnapshot = {
  tier: 'free',
  isAuthenticated: false,
  subscriptionStatus: null,
  proExpiresAt: null,
  stripeCustomerId: null,
  trialUsed: false,
  trialUsedAt: null,
  roomPassActive: false,
  roomPassExpiresAt: null,
  roomPassConversationId: null,
  activeRoomPasses: [],
};

export function resolveBillingUiMode(
  snapshot: UserBillingSnapshot
): BillingUiMode {
  if (snapshot.tier === 'pro') return 'pro';
  if (snapshot.roomPassActive) return 'room_pass';
  return 'free';
}

export function canShowPricingUpgrade(snapshot: UserBillingSnapshot): boolean {
  return snapshot.tier === 'free';
}

export function canShowRoomPassPurchase(snapshot: UserBillingSnapshot): boolean {
  return snapshot.tier === 'free' && !snapshot.roomPassActive;
}

export function canShowStripeTrial(snapshot: UserBillingSnapshot): boolean {
  return snapshot.tier === 'free' && !snapshot.trialUsed;
}
