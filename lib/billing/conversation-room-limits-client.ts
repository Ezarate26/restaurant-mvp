import type { ConversationRoomLimits } from '@/lib/billing/get-conversation-room-limits';

import { FREE_LIMITS } from '@/lib/billing/constants';

const FALLBACK: ConversationRoomLimits = {
  durationMs: FREE_LIMITS.roomDurationMinutes * 60_000,
  voiceEnabled: false,
  tier: 'free',
  uiMode: 'free',
  maxParticipants: FREE_LIMITS.maxParticipants,
  allowAllLanguages: false,
};

export async function fetchConversationRoomLimits(
  conversationId: string
): Promise<ConversationRoomLimits> {
  const qs = new URLSearchParams({ conversationId });
  const res = await fetch(`/api/conversations/room-limits?${qs.toString()}`, {
    cache: 'no-store',
  });

  if (!res.ok) return FALLBACK;
  return res.json() as Promise<ConversationRoomLimits>;
}
