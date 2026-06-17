import {
  addConversationSessionExtraMs,
  fetchConversationById,
} from '@/lib/model/conversations-table.repository';
import type { SupabaseClient } from '@supabase/supabase-js';
import { PRO_LIMITS } from '@/lib/billing/constants';
import { getConversationRoomLimits } from '@/lib/billing/get-conversation-room-limits';
import type { Conversation } from '@/lib/model/types';

/**
 * Cuando un usuario Pro entra a una sala con menos de 60 min totales,
 * extiende la sesión hasta 60 min desde la creación (el tiempo ya transcurrido cuenta).
 */
export async function applyProJoinRoomBoost(
  client: SupabaseClient,
  conversationId: string
): Promise<Conversation | null> {
  const conversation = await fetchConversationById(client, conversationId);
  if (!conversation || conversation.status !== 'active') return null;

  const limits = await getConversationRoomLimits(conversationId);
  const proTotalMs = PRO_LIMITS.roomDurationMinutes * 60_000;
  const currentExtra = conversation.session_extra_ms ?? 0;
  const currentTotalMs = limits.durationMs + currentExtra;

  if (currentTotalMs >= proTotalMs) return null;

  const addMs = proTotalMs - currentTotalMs;
  return addConversationSessionExtraMs(client, conversationId, addMs);
}
