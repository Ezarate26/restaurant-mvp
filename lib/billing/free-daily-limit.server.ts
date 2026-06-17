import type { SupabaseClient } from '@supabase/supabase-js';
import {
  getOrCreateBillingRow,
  resolveEffectiveTier,
} from '@/lib/billing/billing.repository';
import {
  computeFreeDailyUsage,
  formatFreeDailyLimitMessage,
  type FreeDailyUsageSnapshot,
} from '@/lib/billing/free-daily-limit';

async function fetchOwnerConversationTimes(
  client: SupabaseClient,
  args: { userId?: string | null; deviceId?: string | null }
): Promise<string[]> {
  const since = new Date(Date.now() - 30 * 24 * 60 * 60_000).toISOString();

  let memberQuery = client
    .from('conversation_members')
    .select('id')
    .eq('role', 'owner');

  if (args.userId) {
    memberQuery = memberQuery.eq('user_id', args.userId);
  } else if (args.deviceId) {
    memberQuery = memberQuery.eq('device_id', args.deviceId);
  } else {
    return [];
  }

  const { data: members, error: memberError } = await memberQuery;
  if (memberError) {
    console.error('fetchOwnerConversationTimes:members', memberError);
    return [];
  }

  const ownerIds = (members ?? []).map((m) => m.id as string);
  if (ownerIds.length === 0) return [];

  const { data: conversations, error: convError } = await client
    .from('conversations')
    .select('created_at')
    .in('owner_member_id', ownerIds)
    .gte('created_at', since)
    .order('created_at', { ascending: true });

  if (convError) {
    console.error('fetchOwnerConversationTimes:conversations', convError);
    return [];
  }

  return (conversations ?? [])
    .map((c) => c.created_at as string)
    .filter(Boolean);
}

async function hasActiveRoomPassAny(
  client: SupabaseClient,
  userId: string
): Promise<boolean> {
  const { data, error } = await client
    .from('room_passes')
    .select('id')
    .eq('user_id', userId)
    .gt('expires_at', new Date().toISOString())
    .limit(1);

  if (error) {
    console.error('hasActiveRoomPassAny', error);
    return false;
  }
  return (data?.length ?? 0) > 0;
}

export type FreeCreateEligibility = FreeDailyUsageSnapshot & {
  unlimited: boolean;
  message: string;
};

export async function getFreeCreateEligibility(
  client: SupabaseClient,
  args: { userId?: string | null; deviceId?: string | null }
): Promise<FreeCreateEligibility> {
  if (args.userId) {
    const billing = await getOrCreateBillingRow(client, args.userId);
    if (billing && resolveEffectiveTier(billing) === 'pro') {
      return {
        count: 0,
        limit: 0,
        canCreate: true,
        windowEndsAt: null,
        remaining: 0,
        unlimited: true,
        message: '',
      };
    }

    if (await hasActiveRoomPassAny(client, args.userId)) {
      return {
        count: 0,
        limit: 0,
        canCreate: true,
        windowEndsAt: null,
        remaining: 0,
        unlimited: true,
        message: '',
      };
    }
  }

  const times = await fetchOwnerConversationTimes(client, args);
  const usage = computeFreeDailyUsage(times);

  return {
    ...usage,
    unlimited: false,
    message: formatFreeDailyLimitMessage(usage),
  };
}

export async function assertCanCreateFreeConversation(
  client: SupabaseClient,
  args: { userId?: string | null; deviceId?: string | null }
): Promise<void> {
  const eligibility = await getFreeCreateEligibility(client, args);
  if (eligibility.unlimited || eligibility.canCreate) return;
  throw new Error(
    eligibility.message || 'Límite diario de conversaciones alcanzado'
  );
}
