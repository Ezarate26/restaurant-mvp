import type { SupabaseClient } from '@supabase/supabase-js';
import type { Restaurant } from './types';

export async function fetchRestaurantByInviteCode(
  client: SupabaseClient,
  inviteCode: string
): Promise<Restaurant | null> {
  const { data } = await client
    .from('restaurants')
    .select('*')
    .eq('invite_code', inviteCode)
    .single();

  return (data as Restaurant) ?? null;
}
