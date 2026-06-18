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

async function fetchOwnerMemberIds(
  client: SupabaseClient,
  args: { userId?: string | null; deviceId?: string | null }
): Promise<string[]> {
  const ownerIds = new Set<string>();

  if (args.userId) {
    const { data, error } = await client
      .from('conversation_members')
      .select('id')
      .eq('role', 'owner')
      .eq('user_id', args.userId);
    if (error) {
      console.error('fetchOwnerMemberIds:user', error);
    } else {
      for (const row of data ?? []) {
        ownerIds.add(row.id as string);
      }
    }
  }

  if (args.deviceId) {
    const { data, error } = await client
      .from('conversation_members')
      .select('id')
      .eq('role', 'owner')
      .eq('device_id', args.deviceId);
    if (error) {
      console.error('fetchOwnerMemberIds:device', error);
    } else {
      for (const row of data ?? []) {
        ownerIds.add(row.id as string);
      }
    }
  }

  return [...ownerIds];
}

async function fetchOwnerConversationTimes(
  client: SupabaseClient,
  args: { userId?: string | null; deviceId?: string | null }
): Promise<string[]> {
  const since = new Date(Date.now() - 30 * 24 * 60 * 60_000).toISOString();

  if (!args.userId && !args.deviceId?.trim()) {
    return [];
  }

  const ownerIds = await fetchOwnerMemberIds(client, args);
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

  const times = await fetchOwnerConversationTimes(client, {
    userId: args.userId,
    deviceId: args.deviceId?.trim() || null,
  });
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
  const deviceId = args.deviceId?.trim() || null;
  if (!args.userId && !deviceId) {
    throw new Error(
      'No se pudo identificar tu dispositivo. Activa las cookies o el almacenamiento local e inténtalo de nuevo.'
    );
  }

  const eligibility = await getFreeCreateEligibility(client, {
    userId: args.userId,
    deviceId,
  });
  if (eligibility.unlimited || eligibility.canCreate) return;
  throw new Error(
    eligibility.message || 'Límite diario de conversaciones alcanzado'
  );
}
