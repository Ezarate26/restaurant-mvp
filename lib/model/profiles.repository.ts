import type { SupabaseClient } from '@supabase/supabase-js';
import type { Profile } from './types';

export async function fetchProfileByUserId(
  client: SupabaseClient,
  userId: string
): Promise<Profile | null> {
  const { data } = await client
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single();

  return (data as Profile) ?? null;
}

export async function fetchProfileRestaurantId(
  client: SupabaseClient,
  userId: string
): Promise<string | null> {
  const { data } = await client
    .from('profiles')
    .select('restaurant_id')
    .eq('id', userId)
    .single();

  return data?.restaurant_id ?? null;
}

export async function insertWaiterProfile(
  client: SupabaseClient,
  row: {
    id: string;
    email: string;
    full_name: string;
    employee_number: string | null;
    restaurant_id: string;
  }
) {
  return client.from('profiles').insert([row]);
}
