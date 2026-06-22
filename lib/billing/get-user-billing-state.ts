import {
  fetchActiveRoomPassForConversation,
  fetchActiveRoomPassesForUser,
  fetchUserHourBalanceMs,
  getOrCreateBillingRow,
  resolveEffectiveTier,
} from '@/lib/billing/billing.repository';
import {
  EMPTY_BILLING_SNAPSHOT,
  type UserBillingSnapshot,
} from '@/lib/billing/billing-state';
import { createSupabaseServiceRole } from '@/lib/supabase/service';

export async function getUserBillingState(
  userId: string | null,
  conversationId?: string | null
): Promise<UserBillingSnapshot> {
  if (!userId) {
    return { ...EMPTY_BILLING_SNAPSHOT };
  }

  const service = createSupabaseServiceRole();
  const billing = await getOrCreateBillingRow(service, userId);
  const tier = resolveEffectiveTier(billing);
  const [activeRoomPasses, hourBalanceMs] = await Promise.all([
    fetchActiveRoomPassesForUser(service, userId),
    fetchUserHourBalanceMs(service, userId),
  ]);

  let roomPassActive = false;
  let roomPassExpiresAt: string | null = null;
  let roomPassConversationId: string | null = null;

  if (conversationId) {
    const pass = await fetchActiveRoomPassForConversation(service, conversationId);
    if (pass) {
      roomPassActive = true;
      roomPassExpiresAt = pass.expires_at;
      roomPassConversationId = pass.conversation_id;
    }
  } else if (activeRoomPasses.length > 0) {
    const latest = activeRoomPasses[0];
    roomPassActive = true;
    roomPassExpiresAt = latest.expiresAt;
    roomPassConversationId = latest.conversationId;
  }

  return {
    tier,
    isAuthenticated: true,
    subscriptionStatus: billing?.subscription_status ?? null,
    proExpiresAt: billing?.pro_expires_at ?? null,
    stripeCustomerId: billing?.stripe_customer_id ?? null,
    trialUsed: Boolean(billing?.trial_used_at),
    trialUsedAt: billing?.trial_used_at ?? null,
    roomPassActive,
    roomPassExpiresAt,
    roomPassConversationId,
    activeRoomPasses,
    hourBalanceMs,
  };
}
