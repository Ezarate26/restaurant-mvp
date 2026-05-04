import type { SupabaseClient } from '@supabase/supabase-js';
import type { Profile, ProfileRole } from './types';

export async function fetchProfileByUserId(
  client: SupabaseClient,
  userId: string
): Promise<Profile | null> {
  const { data } = await client
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .maybeSingle();

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
    .maybeSingle();

  return (data?.restaurant_id as string | null | undefined) ?? null;
}

export async function fetchProfilesByIds(
  client: SupabaseClient,
  ids: string[]
): Promise<Profile[]> {
  if (ids.length === 0) return [];
  const { data, error } = await client
    .from('profiles')
    .select('*')
    .in('id', ids);

  if (error) {
    console.error('fetchProfilesByIds', error);
    return [];
  }
  return (data as Profile[]) ?? [];
}

export async function countProfilesByRestaurant(
  client: SupabaseClient,
  restaurantId: string
): Promise<number> {
  const { count, error } = await client
    .from('profiles')
    .select('id', { count: 'exact', head: true })
    .eq('restaurant_id', restaurantId);

  if (error) {
    console.error('countProfilesByRestaurant', error);
    return 0;
  }
  return count ?? 0;
}

export async function insertWaiterProfile(
  client: SupabaseClient,
  row: {
    id: string;
    email: string;
    full_name: string;
    employee_number: string | null;
    restaurant_id: string;
    role: ProfileRole;
  }
) {
  return client.from('profiles').insert([
    {
      id: row.id,
      email: row.email,
      full_name: row.full_name,
      employee_number: row.employee_number,
      restaurant_id: row.restaurant_id,
      role: row.role,
      is_active: true,
    },
  ]);
}
