import { NextResponse } from 'next/server';
import {
  ensureStripeCustomer,
  getOrCreateBillingRow,
} from '@/lib/billing/billing.repository';
import { appUrl, getUserIdFromRequest } from '@/lib/billing/server-auth';
import { resolveTrialEligibility } from '@/lib/billing/stripe-trial';
import { getProPriceId, getStripe, isStripeConfigured } from '@/lib/billing/stripe-server';
import { createSupabaseServiceRole } from '@/lib/supabase/service';

export async function POST(request: Request) {
  if (!isStripeConfigured()) {
    return NextResponse.json(
      { error: 'STRIPE_SECRET_KEY no configurada. Ver .env.example' },
      { status: 503 }
    );
  }

  const userId = await getUserIdFromRequest(request);
  if (!userId) {
    return NextResponse.json(
      { error: 'Debes iniciar sesión para hacerte Pro' },
      { status: 401 }
    );
  }

  const body = (await request.json().catch(() => ({}))) as { returnUrl?: string };
  const returnPath = body.returnUrl ?? '/app/billing';

  try {
    const stripe = getStripe();
    const supabase = createSupabaseServiceRole();
    const billing = await getOrCreateBillingRow(supabase, userId);
    if (!billing) {
      return NextResponse.json({ error: 'No se pudo cargar billing' }, { status: 500 });
    }

    let customerId = billing.stripe_customer_id;
    if (!customerId) {
      const { data: authUser } = await supabase.auth.admin.getUserById(userId);
      const customer = await stripe.customers.create({
        email: authUser.user?.email ?? undefined,
        metadata: { userId },
      });
      customerId = customer.id;
      await ensureStripeCustomer(
        supabase,
        userId,
        authUser.user?.email ?? null,
        customerId
      );
    }

    const trialEligible = await resolveTrialEligibility(
      supabase,
      userId,
      customerId
    );

    const trialDays = Number(process.env.STRIPE_TRIAL_DAYS ?? 0);
    const subscriptionData: {
      metadata: { userId: string };
      trial_period_days?: number;
    } = { metadata: { userId } };

    if (trialEligible && trialDays > 0) {
      subscriptionData.trial_period_days = trialDays;
    }

    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      customer: customerId,
      line_items: [{ price: getProPriceId(), quantity: 1 }],
      success_url: `${appUrl(returnPath)}?checkout=success`,
      cancel_url: `${appUrl(returnPath)}?checkout=cancel`,
      metadata: { userId, type: 'pro_subscription' },
      subscription_data: subscriptionData,
    });

    return NextResponse.json({ url: session.url });
  } catch (e) {
    console.error('checkout-session', e);
    return NextResponse.json(
      { error: e instanceof Error ? e.message : 'Error al crear checkout' },
      { status: 500 }
    );
  }
}
