import { NextResponse } from 'next/server';
import {
  enforceConversationRoomTimer,
  getConversationRoomSession,
  setRoomTimerStartedAtIfNull,
} from '@/lib/billing/room-timer.server';
import { fetchActiveMembersByConversation } from '@/lib/model/conversation-members.repository';
import { createSupabaseServiceRole } from '@/lib/supabase/service';

export async function GET(request: Request) {
  const url = new URL(request.url);
  const conversationId = url.searchParams.get('conversationId')?.trim();

  if (!conversationId) {
    return NextResponse.json(
      { error: 'conversationId requerido' },
      { status: 400 }
    );
  }

  try {
    const service = createSupabaseServiceRole();
    const members = await fetchActiveMembersByConversation(
      service,
      conversationId
    );
    if (members.length >= 2) {
      await setRoomTimerStartedAtIfNull(service, conversationId);
    }

    const session = await getConversationRoomSession(conversationId);
    if (!session) {
      return NextResponse.json(
        { error: 'Conversación no encontrada' },
        { status: 404 }
      );
    }
    return NextResponse.json(session);
  } catch (e) {
    console.error('GET /api/conversations/room-timer', e);
    return NextResponse.json(
      { error: 'No se pudo cargar el temporizador de la sala' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  const body = (await request.json().catch(() => ({}))) as {
    conversationId?: string;
  };
  const conversationId = body.conversationId?.trim();

  if (!conversationId) {
    return NextResponse.json(
      { error: 'conversationId requerido' },
      { status: 400 }
    );
  }

  try {
    const status = await enforceConversationRoomTimer(conversationId);
    return NextResponse.json({ status });
  } catch (e) {
    console.error('POST /api/conversations/room-timer', e);
    return NextResponse.json(
      { error: 'No se pudo aplicar el cierre por tiempo' },
      { status: 500 }
    );
  }
}
