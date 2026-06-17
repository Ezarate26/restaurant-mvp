import { NextResponse } from 'next/server';
import { getConversationRoomLimits } from '@/lib/billing/get-conversation-room-limits';

/** Límites de sala (duración, voz) según el plan del propietario. */
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
    const limits = await getConversationRoomLimits(conversationId);
    return NextResponse.json(limits);
  } catch (e) {
    console.error('GET /api/conversations/room-limits', e);
    return NextResponse.json(
      { error: 'No se pudieron cargar los límites de la sala' },
      { status: 500 }
    );
  }
}
