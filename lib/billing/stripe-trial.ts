import type Stripe from 'stripe';
import type { SupabaseClient } from '@supabase/supabase-js';
import {
  fetchUserBillingByCustomerId,
  isTrialUsedForUser,
  markTrialUsed,
} from '@/lib/billing/billing.repository';
import { getStripe } from '@/lib/billing/stripe-server';

/** Stripe: ¿este customer ya tuvo suscripción con trial? */
export async function stripeCustomerHasUsedTrial(
  customerId: string
): Promise<boolean> {
  const stripe = getStripe();
  const subs = await stripe.subscriptions.list({
    customer: customerId,
    status: 'all',
    limit: 100,
  });

  return subs.data.some(
    (sub) => sub.trial_start != null || sub.status === 'trialing'
  );
}

export async function resolveTrialEligibility(
  supabase: SupabaseClient,
  userId: string,
  stripeCustomerId: string | null
): Promise<boolean> {
  if (await isTrialUsedForUser(supabase, userId)) return false;

  if (stripeCustomerId && (await stripeCustomerHasUsedTrial(stripeCustomerId))) {
    await markTrialUsed(supabase, userId);
    return false;
  }

  return true;
}

export async function syncTrialUsedFromSubscription(
  supabase: SupabaseClient,
  userId: string,
  subscription: Stripe.Subscription
): Promise<void> {
  if (subscription.trial_start != null || subscription.status === 'trialing') {
    await markTrialUsed(supabase, userId);
  }
}

export async function syncTrialUsedFromCustomerId(
  supabase: SupabaseClient,
  customerId: string
): Promise<void> {
  const billing = await fetchUserBillingByCustomerId(supabase, customerId);
  if (!billing || billing.trial_used_at) return;

  if (await stripeCustomerHasUsedTrial(customerId)) {
    await markTrialUsed(supabase, billing.user_id);
  }
}
