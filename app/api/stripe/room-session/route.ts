import { NextResponse } from 'next/server';
import {
  ensureStripeCustomer,
  getOrCreateBillingRow,
} from '@/lib/billing/billing.repository';
import { ROOM_PASS_DURATION_MINUTES } from '@/lib/billing/constants';
import { appUrl, getUserIdFromRequest } from '@/lib/billing/server-auth';
import {
  getRoomPassPriceId,
  getStripe,
  isStripeConfigured,
} from '@/lib/billing/stripe-server';
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
      { error: 'Debes iniciar sesión para comprar un pase' },
      { status: 401 }
    );
  }

  const body = (await request.json().catch(() => ({}))) as {
    conversationId?: string;
    returnUrl?: string;
  };

  if (!body.conversationId) {
    return NextResponse.json({ error: 'conversationId requerido' }, { status: 400 });
  }

  const returnPath = body.returnUrl ?? `/c/${body.conversationId}`;

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

    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      customer: customerId,
      line_items: [{ price: getRoomPassPriceId(), quantity: 1 }],
      success_url: `${appUrl(returnPath)}?room_pass=success`,
      cancel_url: `${appUrl(returnPath)}?room_pass=cancel`,
      metadata: {
        userId,
        type: 'room_pass',
        conversationId: body.conversationId,
        durationMinutes: String(ROOM_PASS_DURATION_MINUTES),
      },
    });

    return NextResponse.json({ url: session.url });
  } catch (e) {
    console.error('room-session', e);
    return NextResponse.json(
      { error: e instanceof Error ? e.message : 'Error al crear checkout' },
      { status: 500 }
    );
  }
}
