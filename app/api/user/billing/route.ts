import { NextResponse } from 'next/server';
import { getUserBillingState } from '@/lib/billing/get-user-billing-state';
import { getUserIdFromRequest } from '@/lib/billing/server-auth';

/**
 * Fuente de verdad del plan del usuario.
 * El frontend NUNCA debe inferir el tier desde cache local.
 */
export async function GET(request: Request) {
  const userId = await getUserIdFromRequest(request);
  const url = new URL(request.url);
  const conversationId =
    url.searchParams.get('conversationId') ??
    url.searchParams.get('room') ??
    null;

  try {
    const state = await getUserBillingState(userId, conversationId);
    return NextResponse.json(state);
  } catch (e) {
    console.error('GET /api/user/billing', e);
    return NextResponse.json(
      { error: 'No se pudo cargar el estado de facturación' },
      { status: 500 }
    );
  }
}
