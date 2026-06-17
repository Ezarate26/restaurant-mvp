export type PlanTier = 'free' | 'pro';

export interface UserBillingRow {
  user_id: string;
  stripe_customer_id: string | null;
  plan_tier: PlanTier;
  pro_expires_at: string | null;
  stripe_subscription_id: string | null;
  subscription_status: string | null;
  trial_used_at: string | null;
}

export interface RoomPassRow {
  id: string;
  user_id: string;
  conversation_id: string;
  expires_at: string;
  purchased_at: string;
}

export type ActiveRoomPassInfo = {
  conversationId: string;
  expiresAt: string;
  purchasedAt: string;
};

/** Respuesta canónica del backend — única fuente de verdad para el cliente. */
export type UserBillingSnapshot = {
  tier: PlanTier;
  isAuthenticated: boolean;
  subscriptionStatus: string | null;
  proExpiresAt: string | null;
  stripeCustomerId: string | null;
  trialUsed: boolean;
  trialUsedAt: string | null;
  roomPassActive: boolean;
  roomPassExpiresAt: string | null;
  roomPassConversationId: string | null;
  activeRoomPasses: ActiveRoomPassInfo[];
};

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
