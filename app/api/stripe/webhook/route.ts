import { NextResponse } from 'next/server';
import type Stripe from 'stripe';
import {
  activateProSubscription,
  creditHourPackPurchase,
  downgradeToFree,
  fetchUserBillingByCustomerId,
  fetchUserIdByEmail,
  insertRoomPass,
} from '@/lib/billing/billing.repository';
import { HOURS_24_PACK_MS, ROOM_PASS_DURATION_MINUTES } from '@/lib/billing/constants';
import { getStripe } from '@/lib/billing/stripe-server';
import {
  syncTrialUsedFromCustomerId,
  syncTrialUsedFromSubscription,
} from '@/lib/billing/stripe-trial';
import { createSupabaseServiceRole } from '@/lib/supabase/service';

export const runtime = 'nodejs';

type CheckoutContext = {
  userId: string;
  conversationId?: string;
};

function subscriptionPeriodEndIso(subscription: Stripe.Subscription): string | null {
  const end = (subscription as unknown as { current_period_end?: number })
    .current_period_end;
  if (typeof end !== 'number') return null;
  return new Date(end * 1000).toISOString();
}

function parseClientReferenceId(ref: string): CheckoutContext | null {
  const [userId, conversationId] = ref.split(':');
  if (!userId) return null;
  return { userId, conversationId: conversationId || undefined };
}

async function resolveCheckoutContext(
  session: Stripe.Checkout.Session
): Promise<CheckoutContext | null> {
  if (session.metadata?.userId) {
    return {
      userId: session.metadata.userId,
      conversationId: session.metadata.conversationId,
    };
  }

  if (session.client_reference_id) {
    const parsed = parseClientReferenceId(session.client_reference_id);
    if (parsed) return parsed;
  }

  const supabase = createSupabaseServiceRole();
  const customerId =
    typeof session.customer === 'string' ? session.customer : session.customer?.id;

  if (customerId) {
    const billing = await fetchUserBillingByCustomerId(supabase, customerId);
    if (billing) return { userId: billing.user_id };
  }

  const email =
    session.customer_details?.email ??
    (typeof session.customer_email === 'string' ? session.customer_email : null);

  if (email) {
    const userId = await fetchUserIdByEmail(supabase, email);
    if (userId) return { userId };
  }

  return null;
}

async function sessionIncludesHours24Price(
  session: Stripe.Checkout.Session
): Promise<boolean> {
  const hoursPriceId = process.env.STRIPE_PRICE_HOURS_24;
  if (!hoursPriceId) return false;

  if (session.metadata?.type === 'hours_24_pack') return true;

  const stripe = getStripe();
  const lineItems = await stripe.checkout.sessions.listLineItems(session.id, {
    limit: 10,
  });

  return lineItems.data.some((item) => item.price?.id === hoursPriceId);
}

async function sessionIncludesRoomPassPrice(
  session: Stripe.Checkout.Session
): Promise<boolean> {
  const roomPriceId = process.env.STRIPE_PRICE_ROOM_PASS;
  if (!roomPriceId) return false;

  if (session.metadata?.type === 'room_pass') return true;

  const stripe = getStripe();
  const lineItems = await stripe.checkout.sessions.listLineItems(session.id, {
    limit: 10,
  });

  return lineItems.data.some((item) => item.price?.id === roomPriceId);
}

async function handleCheckoutCompleted(session: Stripe.Checkout.Session) {
  const ctx = await resolveCheckoutContext(session);
  if (!ctx) return;

  const supabase = createSupabaseServiceRole();
  const customerId =
    typeof session.customer === 'string' ? session.customer : session.customer?.id;

  if (session.mode === 'subscription' && session.subscription && customerId) {
    const stripe = getStripe();
    const subId =
      typeof session.subscription === 'string'
        ? session.subscription
        : session.subscription.id;
    const subscription = (await stripe.subscriptions.retrieve(
      subId
    )) as Stripe.Subscription;
    const periodEnd = subscriptionPeriodEndIso(subscription);

    await activateProSubscription(supabase, {
      userId: ctx.userId,
      stripeCustomerId: customerId,
      stripeSubscriptionId: subscription.id,
      subscriptionStatus: subscription.status,
      proExpiresAt: periodEnd,
    });
    await syncTrialUsedFromSubscription(supabase, ctx.userId, subscription);
    return;
  }

  if (session.mode === 'payment') {
    const isHoursPack =
      session.metadata?.type === 'hours_24_pack' ||
      (await sessionIncludesHours24Price(session));

    if (isHoursPack) {
      const amountMs =
        Number(session.metadata?.amountMs) || HOURS_24_PACK_MS;
      await creditHourPackPurchase(supabase, {
        userId: ctx.userId,
        stripeCheckoutSessionId: session.id,
        amountMs,
      });
      return;
    }

    const isRoomPass =
      session.metadata?.type === 'room_pass' ||
      (await sessionIncludesRoomPassPrice(session));

    if (!isRoomPass) return;

    const conversationId = ctx.conversationId ?? session.metadata?.conversationId;
    if (!conversationId) {
      console.warn(
        'room_pass checkout sin conversationId — abre billing desde una sala (?room=...)'
      );
      return;
    }

    const minutes = Number(session.metadata?.durationMinutes) || ROOM_PASS_DURATION_MINUTES;
    const expiresAt = new Date(Date.now() + minutes * 60_000).toISOString();
    await insertRoomPass(supabase, {
      userId: ctx.userId,
      conversationId,
      expiresAt,
      stripeCheckoutSessionId: session.id,
    });
  }
}

async function resolveUserIdFromSubscription(
  subscription: Stripe.Subscription
): Promise<string | null> {
  if (subscription.metadata?.userId) return subscription.metadata.userId;

  const customerId =
    typeof subscription.customer === 'string'
      ? subscription.customer
      : subscription.customer.id;

  const supabase = createSupabaseServiceRole();
  const billing = await fetchUserBillingByCustomerId(supabase, customerId);
  return billing?.user_id ?? null;
}

async function handleSubscriptionUpdated(subscription: Stripe.Subscription) {
  const userId = await resolveUserIdFromSubscription(subscription);
  if (!userId) return;

  const supabase = createSupabaseServiceRole();
  const customerId =
    typeof subscription.customer === 'string'
      ? subscription.customer
      : subscription.customer.id;

  const active = ['active', 'trialing', 'past_due'].includes(subscription.status);
  const periodEnd = subscriptionPeriodEndIso(subscription);

  if (active) {
    await activateProSubscription(supabase, {
      userId,
      stripeCustomerId: customerId,
      stripeSubscriptionId: subscription.id,
      subscriptionStatus: subscription.status,
      proExpiresAt: periodEnd,
    });
    await syncTrialUsedFromSubscription(supabase, userId, subscription);
  } else {
    await downgradeToFree(supabase, userId, subscription.status);
  }
}

async function handleSubscriptionDeleted(subscription: Stripe.Subscription) {
  const userId = await resolveUserIdFromSubscription(subscription);
  if (!userId) return;

  const supabase = createSupabaseServiceRole();
  await downgradeToFree(supabase, userId, 'canceled');
}

export async function POST(request: Request) {
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!webhookSecret) {
    return NextResponse.json({ error: 'STRIPE_WEBHOOK_SECRET no configurado' }, { status: 503 });
  }

  const body = await request.text();
  const signature = request.headers.get('stripe-signature');
  if (!signature) {
    return NextResponse.json({ error: 'Firma ausente' }, { status: 400 });
  }

  let event: Stripe.Event;
  try {
    event = getStripe().webhooks.constructEvent(body, signature, webhookSecret);
  } catch (e) {
    console.error('webhook signature', e);
    return NextResponse.json({ error: 'Firma inválida' }, { status: 400 });
  }

  try {
    switch (event.type) {
      case 'checkout.session.completed':
        await handleCheckoutCompleted(event.data.object as Stripe.Checkout.Session);
        break;
      case 'customer.subscription.updated':
        await handleSubscriptionUpdated(event.data.object as Stripe.Subscription);
        break;
      case 'customer.subscription.deleted':
        await handleSubscriptionDeleted(event.data.object as Stripe.Subscription);
        break;
      case 'customer.created':
      case 'customer.updated': {
        const customer = event.data.object as Stripe.Customer;
        const customerId = customer.id;
        if (customerId) {
          const supabase = createSupabaseServiceRole();
          await syncTrialUsedFromCustomerId(supabase, customerId);
        }
        break;
      }
      default:
        break;
    }
  } catch (e) {
    console.error('webhook handler', event.type, e);
    return NextResponse.json({ error: 'Handler error' }, { status: 500 });
  }

  return NextResponse.json({ received: true });
}
