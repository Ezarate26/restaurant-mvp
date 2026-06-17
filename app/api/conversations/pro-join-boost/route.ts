import { NextResponse } from 'next/server';
import { applyProJoinRoomBoost } from '@/lib/billing/apply-pro-join-room-boost';
import {
  getOrCreateBillingRow,
  resolveEffectiveTier,
} from '@/lib/billing/billing.repository';
import { getUserIdFromRequest } from '@/lib/billing/server-auth';
import { fetchActiveMembersByConversation } from '@/lib/model/conversation-members.repository';
import { createSupabaseServiceRole } from '@/lib/supabase/service';

export async function POST(request: Request) {
  const userId = await getUserIdFromRequest(request);
  if (!userId) {
    return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
  }

  const body = (await request.json().catch(() => ({}))) as {
    conversationId?: string;
  };

  if (!body.conversationId) {
    return NextResponse.json(
      { error: 'conversationId requerido' },
      { status: 400 }
    );
  }

  try {
    const service = createSupabaseServiceRole();
    const billing = await getOrCreateBillingRow(service, userId);
    if (resolveEffectiveTier(billing) !== 'pro') {
      return NextResponse.json({ applied: false, reason: 'not_pro' });
    }

    const members = await fetchActiveMembersByConversation(
      service,
      body.conversationId
    );
    const isMember = members.some((m) => m.user_id === userId);
    if (!isMember) {
      return NextResponse.json({ error: 'No eres participante' }, { status: 403 });
    }

    const updated = await applyProJoinRoomBoost(service, body.conversationId);
    return NextResponse.json({
      applied: Boolean(updated),
      sessionExtraMs: updated?.session_extra_ms ?? null,
    });
  } catch (e) {
    console.error('POST /api/conversations/pro-join-boost', e);
    return NextResponse.json(
      { error: e instanceof Error ? e.message : 'Error al aplicar beneficio Pro' },
      { status: 500 }
    );
  }
}
