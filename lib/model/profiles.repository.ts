import type { SupabaseClient } from '@supabase/supabase-js';
import type { AppUser } from './types';

export const AVATAR_STORAGE_BUCKET = 'avatars';

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

export async function updateUserProfile(
  client: SupabaseClient,
  userId: string,
  patch: {
    display_name?: string | null;
    phone?: string | null;
    native_language?: string | null;
    bio?: string | null;
    avatar_url?: string | null;
  }
): Promise<AppUser | null> {
  const { data, error } = await client
    .from('users')
    .update(patch)
    .eq('id', userId)
    .select('*')
    .single();

  if (error) {
    console.error('updateUserProfile', error);
    throw error;
  }
  return (data as AppUser) ?? null;
}

export async function upsertUserProfile(
  client: SupabaseClient,
  row: {
    id: string;
    email?: string | null;
    display_name?: string | null;
    phone?: string | null;
    native_language?: string | null;
    bio?: string | null;
    avatar_url?: string | null;
  }
): Promise<void> {
  const { error } = await client.from('users').upsert(row, { onConflict: 'id' });
  if (error) {
    console.error('upsertUserProfile', error);
    throw error;
  }
}
