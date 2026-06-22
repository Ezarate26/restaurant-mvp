import type { SupabaseClient } from '@supabase/supabase-js';
import type { PlanTier } from '@/lib/billing/types';

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

export async function fetchUserBilling(
  client: SupabaseClient,
  userId: string
): Promise<UserBillingRow | null> {
  const { data, error } = await client
    .from('user_billing')
    .select('*')
    .eq('user_id', userId)
    .maybeSingle();

  if (error) {
    console.error('fetchUserBilling', error);
    return null;
  }
  return data as UserBillingRow | null;
}

export async function fetchUserBillingByCustomerId(
  client: SupabaseClient,
  stripeCustomerId: string
): Promise<UserBillingRow | null> {
  const { data, error } = await client
    .from('user_billing')
    .select('*')
    .eq('stripe_customer_id', stripeCustomerId)
    .maybeSingle();

  if (error) {
    console.error('fetchUserBillingByCustomerId', error);
    return null;
  }
  return data as UserBillingRow | null;
}

export async function fetchUserIdByEmail(
  client: SupabaseClient,
  email: string
): Promise<string | null> {
  const { data, error } = await client
    .from('users')
    .select('id')
    .eq('email', email)
    .maybeSingle();

  if (error) {
    console.error('fetchUserIdByEmail', error);
    return null;
  }
  return (data as { id: string } | null)?.id ?? null;
}

export async function ensureStripeCustomer(
  client: SupabaseClient,
  userId: string,
  email: string | null,
  stripeCustomerId: string
): Promise<void> {
  const { error } = await client.from('user_billing').upsert(
    {
      user_id: userId,
      stripe_customer_id: stripeCustomerId,
      plan_tier: 'free',
    },
    { onConflict: 'user_id' }
  );
  if (error) console.error('ensureStripeCustomer', error);
}

export async function getOrCreateBillingRow(
  client: SupabaseClient,
  userId: string
): Promise<UserBillingRow | null> {
  const existing = await fetchUserBilling(client, userId);
  if (existing) return existing;

  const { data, error } = await client
    .from('user_billing')
    .insert({ user_id: userId, plan_tier: 'free' })
    .select('*')
    .single();

  if (error) {
    console.error('getOrCreateBillingRow', error);
    return null;
  }
  return data as UserBillingRow;
}

export async function activateProSubscription(
  client: SupabaseClient,
  params: {
    userId: string;
    stripeCustomerId: string;
    stripeSubscriptionId: string;
    subscriptionStatus: string;
    proExpiresAt: string | null;
  }
): Promise<void> {
  const { error } = await client.from('user_billing').upsert(
    {
      user_id: params.userId,
      stripe_customer_id: params.stripeCustomerId,
      stripe_subscription_id: params.stripeSubscriptionId,
      subscription_status: params.subscriptionStatus,
      plan_tier: 'pro',
      pro_expires_at: params.proExpiresAt,
    },
    { onConflict: 'user_id' }
  );
  if (error) console.error('activateProSubscription', error);
}

export async function downgradeToFree(
  client: SupabaseClient,
  userId: string,
  subscriptionStatus: string
): Promise<void> {
  const { error } = await client
    .from('user_billing')
    .update({
      plan_tier: 'free',
      subscription_status: subscriptionStatus,
      pro_expires_at: null,
      stripe_subscription_id: null,
    })
    .eq('user_id', userId);
  if (error) console.error('downgradeToFree', error);
}

export async function insertRoomPass(
  client: SupabaseClient,
  params: {
    userId: string;
    conversationId: string;
    expiresAt: string;
    stripeCheckoutSessionId?: string;
  }
): Promise<void> {
  const { error } = await client.from('room_passes').insert({
    user_id: params.userId,
    conversation_id: params.conversationId,
    expires_at: params.expiresAt,
    stripe_checkout_session_id: params.stripeCheckoutSessionId ?? null,
  });
  if (error) console.error('insertRoomPass', error);
}

export async function fetchActiveRoomPassForConversation(
  client: SupabaseClient,
  conversationId: string
): Promise<RoomPassRow | null> {
  const { data, error } = await client
    .from('room_passes')
    .select('*')
    .eq('conversation_id', conversationId)
    .gt('expires_at', new Date().toISOString())
    .order('expires_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) {
    console.error('fetchActiveRoomPassForConversation', error);
    return null;
  }
  return data as RoomPassRow | null;
}

export async function fetchActiveRoomPassesForUser(
  client: SupabaseClient,
  userId: string
): Promise<
  { conversationId: string; expiresAt: string; purchasedAt: string }[]
> {
  const { data, error } = await client
    .from('room_passes')
    .select('conversation_id, expires_at, purchased_at')
    .eq('user_id', userId)
    .gt('expires_at', new Date().toISOString())
    .order('expires_at', { ascending: false });

  if (error) {
    console.error('fetchActiveRoomPassesForUser', error);
    return [];
  }

  return (data ?? []).map((row) => ({
    conversationId: row.conversation_id as string,
    expiresAt: row.expires_at as string,
    purchasedAt: row.purchased_at as string,
  }));
}

export async function markTrialUsed(
  client: SupabaseClient,
  userId: string
): Promise<void> {
  const { error } = await client
    .from('user_billing')
    .update({ trial_used_at: new Date().toISOString() })
    .eq('user_id', userId)
    .is('trial_used_at', null);

  if (error) console.error('markTrialUsed', error);
}

export async function fetchUserHourBalanceMs(
  client: SupabaseClient,
  userId: string
): Promise<number> {
  const { data, error } = await client
    .from('user_hour_balance')
    .select('balance_ms')
    .eq('user_id', userId)
    .maybeSingle();

  if (error) {
    console.error('fetchUserHourBalanceMs', error);
    return 0;
  }
  return Number((data as { balance_ms: number } | null)?.balance_ms ?? 0);
}

export async function creditHourPackPurchase(
  client: SupabaseClient,
  params: {
    userId: string;
    stripeCheckoutSessionId: string;
    amountMs: number;
  }
): Promise<void> {
  const { data: existing } = await client
    .from('hour_pack_purchases')
    .select('id')
    .eq('stripe_checkout_session_id', params.stripeCheckoutSessionId)
    .maybeSingle();

  if (existing) return;

  const { error: purchaseError } = await client.from('hour_pack_purchases').insert({
    user_id: params.userId,
    stripe_checkout_session_id: params.stripeCheckoutSessionId,
    amount_ms: params.amountMs,
  });

  if (purchaseError) {
    console.error('creditHourPackPurchase:insert', purchaseError);
    throw purchaseError;
  }

  const current = await fetchUserHourBalanceMs(client, params.userId);
  const { error: balanceError } = await client.from('user_hour_balance').upsert(
    {
      user_id: params.userId,
      balance_ms: current + params.amountMs,
      updated_at: new Date().toISOString(),
    },
    { onConflict: 'user_id' }
  );

  if (balanceError) {
    console.error('creditHourPackPurchase:balance', balanceError);
    throw balanceError;
  }
}

export async function isTrialUsedForUser(
  client: SupabaseClient,
  userId: string
): Promise<boolean> {
  const billing = await fetchUserBilling(client, userId);
  return Boolean(billing?.trial_used_at);
}

export function resolveEffectiveTier(billing: UserBillingRow | null): PlanTier {
  if (!billing || billing.plan_tier !== 'pro') return 'free';
  if (billing.pro_expires_at && Date.parse(billing.pro_expires_at) <= Date.now()) {
    return 'free';
  }
  const activeStatuses = new Set(['active', 'trialing', 'past_due']);
  if (
    billing.stripe_subscription_id &&
    billing.subscription_status &&
    !activeStatuses.has(billing.subscription_status)
  ) {
    return 'free';
  }
  return 'pro';
}
