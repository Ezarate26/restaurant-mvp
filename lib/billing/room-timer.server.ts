import { getConversationRoomLimits } from '@/lib/billing/get-conversation-room-limits';
import { isRoomTimerExpired, computeRoomEndsAtMs } from '@/lib/billing/room-timer';
import {
  closeConversationRecord,
  fetchConversationById,
} from '@/lib/model/conversations-table.repository';
import {
  fetchActiveMembersByConversation,
  markAllMembersLeft,
} from '@/lib/model/conversation-members.repository';
import { createSupabaseServiceRole } from '@/lib/supabase/service';
import type { SupabaseClient } from '@supabase/supabase-js';

export type ConversationRoomSession = {
  timerStartedAt: string | null;
  activeParticipantCount: number;
  durationMs: number;
  extraMs: number;
  endsAtMs: number | null;
  expired: boolean;
  uiMode: 'free' | 'pro' | 'room_pass';
};

export async function setRoomTimerStartedAtIfNull(
  client: SupabaseClient,
  conversationId: string
): Promise<string | null> {
  const current = await fetchConversationById(client, conversationId);
  if (!current) return null;
  if (current.room_timer_started_at) return current.room_timer_started_at;

  const now = new Date().toISOString();
  const { data, error } = await client
    .from('conversations')
    .update({ room_timer_started_at: now })
    .eq('id', conversationId)
    .is('room_timer_started_at', null)
    .select('room_timer_started_at')
    .maybeSingle();

  if (error) {
    console.error('setRoomTimerStartedAtIfNull', error);
    return null;
  }

  const startedAt =
    (data as { room_timer_started_at?: string | null } | null)
      ?.room_timer_started_at ?? now;
  return startedAt;
}

export async function getConversationRoomSession(
  conversationId: string
): Promise<ConversationRoomSession | null> {
  const service = createSupabaseServiceRole();
  const conversation = await fetchConversationById(service, conversationId);
  if (!conversation) return null;

  const [limits, members] = await Promise.all([
    getConversationRoomLimits(conversationId),
    fetchActiveMembersByConversation(service, conversationId),
  ]);

  const activeParticipantCount = members.length;
  const extraMs =
    typeof conversation.session_extra_ms === 'number'
      ? conversation.session_extra_ms
      : 0;
  const timerStartedAt = conversation.room_timer_started_at ?? null;
  const endsAtMs = computeRoomEndsAtMs(
    timerStartedAt,
    limits.durationMs,
    extraMs
  );
  const expired = isRoomTimerExpired(
    timerStartedAt,
    limits.durationMs,
    extraMs,
    activeParticipantCount
  );

  return {
    timerStartedAt,
    activeParticipantCount,
    durationMs: limits.durationMs,
    extraMs,
    endsAtMs,
    expired,
    uiMode: limits.uiMode,
  };
}

export async function enforceConversationRoomTimer(
  conversationId: string
): Promise<'ok' | 'closed' | 'already_closed'> {
  const service = createSupabaseServiceRole();
  const conversation = await fetchConversationById(service, conversationId);
  if (!conversation) return 'already_closed';
  if (conversation.status === 'closed') return 'already_closed';

  const session = await getConversationRoomSession(conversationId);
  if (!session?.expired) return 'ok';

  const closedBy =
    conversation.owner_member_id ??
    (
      await fetchActiveMembersByConversation(service, conversationId)
    ).find((m) => m.role === 'owner')?.id ??
    null;

  await markAllMembersLeft(service, conversationId);
  await closeConversationRecord(service, conversationId, closedBy);
  return 'closed';
}
