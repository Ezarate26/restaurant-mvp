import {
  fetchActiveRoomPassForConversation,
  getOrCreateBillingRow,
  resolveEffectiveTier,
} from '@/lib/billing/billing.repository';
import {
  canUseVoice,
  getEffectiveLimits,
  getRoomDurationMs,
} from '@/lib/billing/plan-capabilities';
import type { PlanTier } from '@/lib/billing/types';
import type { BillingUiMode } from '@/lib/billing/billing-state';
import { FREE_LIMITS } from '@/lib/billing/constants';
import { fetchConversationById } from '@/lib/model/conversations-table.repository';
import { fetchMemberById } from '@/lib/model/conversation-members.repository';
import { createSupabaseServiceRole } from '@/lib/supabase/service';

const FREE_ROOM_MS = FREE_LIMITS.roomDurationMinutes * 60_000;

export type ConversationRoomLimits = {
  durationMs: number;
  voiceEnabled: boolean;
  tier: PlanTier;
  uiMode: BillingUiMode;
  maxParticipants: number;
  allowAllLanguages: boolean;
};

/** Límites de la sala según el plan del propietario (no del invitado). */
export async function getConversationRoomLimits(
  conversationId: string
): Promise<ConversationRoomLimits> {
  const service = createSupabaseServiceRole();
  const conversation = await fetchConversationById(service, conversationId);

  if (!conversation?.owner_member_id) {
    return {
      durationMs: FREE_ROOM_MS,
      voiceEnabled: false,
      tier: 'free',
      uiMode: 'free',
      maxParticipants: FREE_LIMITS.maxParticipants,
      allowAllLanguages: false,
    };
  }

  const owner = await fetchMemberById(service, conversation.owner_member_id);
  const ownerUserId = owner?.user_id ?? null;

  if (!ownerUserId) {
    return {
      durationMs: FREE_ROOM_MS,
      voiceEnabled: false,
      tier: 'free',
      uiMode: 'free',
      maxParticipants: FREE_LIMITS.maxParticipants,
      allowAllLanguages: false,
    };
  }

  const billing = await getOrCreateBillingRow(service, ownerUserId);
  const tier = resolveEffectiveTier(billing);
  const pass = await fetchActiveRoomPassForConversation(service, conversationId);
  const hasRoomPass = Boolean(pass);
  const effective = getEffectiveLimits(tier, hasRoomPass);

  return {
    durationMs: getRoomDurationMs(tier, hasRoomPass),
    voiceEnabled: canUseVoice(tier, hasRoomPass),
    tier,
    uiMode: tier === 'pro' ? 'pro' : hasRoomPass ? 'room_pass' : 'free',
    maxParticipants: effective.maxParticipants,
    allowAllLanguages: effective.languages === 'all',
  };
}
