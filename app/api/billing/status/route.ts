import { NextResponse } from 'next/server';
import { getUserBillingState } from '@/lib/billing/get-user-billing-state';
import { getUserIdFromRequest } from '@/lib/billing/server-auth';

/** @deprecated Usar GET /api/user/billing — mantiene compatibilidad */
export async function GET(request: Request) {
  const userId = await getUserIdFromRequest(request);
  const url = new URL(request.url);
  const conversationId = url.searchParams.get('conversationId');

  try {
    const state = await getUserBillingState(userId, conversationId);
    return NextResponse.json({
      tier: state.tier,
      isAuthenticated: state.isAuthenticated,
      proExpiresAt: state.proExpiresAt,
      subscriptionStatus: state.subscriptionStatus,
      roomPassActive: state.roomPassActive,
      roomPassExpiresAt: state.roomPassExpiresAt,
      trialUsed: state.trialUsed,
    });
  } catch (e) {
    console.error('billing/status', e);
    return NextResponse.json(
      { error: 'No se pudo cargar billing' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  return GET(request);
}
