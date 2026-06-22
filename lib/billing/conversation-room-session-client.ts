import type { ConversationRoomSession } from '@/lib/billing/room-timer.server';

export async function fetchConversationRoomSession(
  conversationId: string
): Promise<ConversationRoomSession | null> {
  const qs = new URLSearchParams({ conversationId });
  const res = await fetch(`/api/conversations/room-timer?${qs.toString()}`, {
    cache: 'no-store',
  });
  if (!res.ok) return null;
  return res.json() as Promise<ConversationRoomSession>;
}

export async function enforceConversationRoomTimer(
  conversationId: string
): Promise<'ok' | 'closed' | 'already_closed'> {
  const res = await fetch('/api/conversations/room-timer', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ conversationId }),
  });
  if (!res.ok) return 'ok';
  const data = (await res.json()) as { status?: string };
  if (data.status === 'closed' || data.status === 'already_closed') {
    return data.status;
  }
  return 'ok';
}
