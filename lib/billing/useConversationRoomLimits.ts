'use client';

import { useEffect, useState } from 'react';
import type { ConversationRoomLimits } from '@/lib/billing/get-conversation-room-limits';
import { fetchConversationRoomLimits } from '@/lib/billing/conversation-room-limits-client';

export function useConversationRoomLimits(
  conversationId: string,
  refreshKey?: number
) {
  const [limits, setLimits] = useState<ConversationRoomLimits | null>(null);

  useEffect(() => {
    let cancelled = false;
    void fetchConversationRoomLimits(conversationId).then((next) => {
      if (!cancelled) setLimits(next);
    });
    return () => {
      cancelled = true;
    };
  }, [conversationId, refreshKey]);

  return limits;
}
