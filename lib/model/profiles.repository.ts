import type { SupabaseClient } from '@supabase/supabase-js';
import type { AppUser } from './types';

export async function fetchUserById(
  client: SupabaseClient,
  userId: string
): Promise<AppUser | null> {
  const { data } = await client
    .from('users')
    .select('*')
    .eq('id', userId)
    .maybeSingle();

  return (data as AppUser) ?? null;
}

export async function fetchUsersByIds(
  client: SupabaseClient,
  ids: string[]
): Promise<AppUser[]> {
  if (ids.length === 0) return [];
  const { data, error } = await client.from('users').select('*').in('id', ids);

  if (error) {
    console.error('fetchUsersByIds', error);
    return [];
  }
  return (data as AppUser[]) ?? [];
}
