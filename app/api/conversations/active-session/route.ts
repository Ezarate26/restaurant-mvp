import { NextResponse } from 'next/server';
import { resolveActiveSession } from '@/lib/conversations/active-session.server';
import { getUserIdFromRequest } from '@/lib/billing/server-auth';
import { createSupabaseServiceRole } from '@/lib/supabase/service';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const deviceId = searchParams.get('deviceId')?.trim() || null;

  if (!deviceId) {
    return NextResponse.json(
      { error: 'deviceId es obligatorio' },
      { status: 400 }
    );
  }

  const userId = (await getUserIdFromRequest(request)) ?? null;
  const service = createSupabaseServiceRole();

  try {
    const session = await resolveActiveSession(service, { userId, deviceId });
    if (!session) {
      return NextResponse.json({ active: false });
    }

    return NextResponse.json({
      active: true,
      conversationId: session.conversationId,
      memberId: session.memberId,
      inviteCode: session.inviteCode,
      isOwner: session.isOwner,
      deviceId: session.deviceId,
      sameDevice: session.deviceId === deviceId,
    });
  } catch (e) {
    console.error('GET /api/conversations/active-session', e);
    return NextResponse.json(
      { error: 'No se pudo consultar la sesión activa' },
      { status: 500 }
    );
  }
}
