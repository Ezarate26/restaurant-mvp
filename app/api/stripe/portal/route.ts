import { NextResponse } from 'next/server';
import { fetchUserBilling } from '@/lib/billing/billing.repository';
import { appUrl, getUserIdFromRequest } from '@/lib/billing/server-auth';
import { getStripe, isStripeConfigured } from '@/lib/billing/stripe-server';
import { createSupabaseServiceRole } from '@/lib/supabase/service';

export async function POST(request: Request) {
  if (!isStripeConfigured()) {
    return NextResponse.json(
      { error: 'STRIPE_SECRET_KEY no configurada' },
      { status: 503 }
    );
  }

  const userId = await getUserIdFromRequest(request);
  if (!userId) {
    return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
  }

  const body = (await request.json().catch(() => ({}))) as { returnUrl?: string };
  const returnPath = body.returnUrl ?? '/app/billing';

  try {
    const supabase = createSupabaseServiceRole();
    const billing = await fetchUserBilling(supabase, userId);

    if (!billing?.stripe_customer_id) {
      return NextResponse.json(
        { error: 'Aún no tienes un cliente de Stripe asociado' },
        { status: 400 }
      );
    }

    const stripe = getStripe();
    const portal = await stripe.billingPortal.sessions.create({
      customer: billing.stripe_customer_id,
      return_url: appUrl(returnPath),
    });

    return NextResponse.json({ url: portal.url });
  } catch (e) {
    console.error('portal', e);
    return NextResponse.json(
      { error: e instanceof Error ? e.message : 'Error al abrir portal' },
      { status: 500 }
    );
  }
}
