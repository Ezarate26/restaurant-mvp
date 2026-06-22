export type PlanTier = 'free' | 'pro';

export type BillingInterval = 'monthly' | 'one_time';

export interface PlanLimits {
  maxParticipants: number;
  roomDurationMinutes: number;
  voiceEnabled: boolean;
  languages: 'es-en' | 'all';
}

export interface StoredUserPlan {
  userId: string;
  tier: PlanTier;
  /** ISO date — suscripción Pro activa hasta */
  proExpiresAt?: string | null;
  stripeCustomerId?: string | null;
}

export interface StoredRoomPass {
  conversationId: string;
  expiresAt: string;
  purchasedAt: string;
}

export interface PlanDefinition {
  id: PlanTier | 'room_pass' | 'hours_24';
  name: string;
  priceLabel: string;
  priceAmount?: number;
  currency?: string;
  interval?: BillingInterval;
  highlighted?: boolean;
  cta: string;
  features: string[];
}
