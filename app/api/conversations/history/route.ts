import { NextResponse } from 'next/server';
import {
  getOrCreateBillingRow,
  resolveEffectiveTier,
} from '@/lib/billing/billing.repository';
import { fetchConversationHistoryForUser } from '@/lib/conversations/conversation-history.server';
import { getUserIdFromRequest } from '@/lib/billing/server-auth';
import { createSupabaseServiceRole } from '@/lib/supabase/service';

export async function GET(request: Request) {
  const userId = await getUserIdFromRequest(request);
  if (!userId) {
    return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
  }

  const service = createSupabaseServiceRole();
  const billing = await getOrCreateBillingRow(service, userId);
  if (resolveEffectiveTier(billing) !== 'pro') {
    return NextResponse.json(
      { error: 'pro_required', proOnly: true },
      { status: 403 }
    );
  }

  const url = new URL(request.url);
  const search = url.searchParams.get('search')?.trim() || undefined;
  const from = url.searchParams.get('from')?.trim() || undefined;
  const to = url.searchParams.get('to')?.trim() || undefined;

  try {
    const items = await fetchConversationHistoryForUser(service, userId, {
      search,
      from,
      to,
    });
    return NextResponse.json({ items });
  } catch (e) {
    console.error('GET /api/conversations/history', e);
    return NextResponse.json(
      { error: e instanceof Error ? e.message : 'Error al cargar historial' },
      { status: 500 }
    );
  }
}
