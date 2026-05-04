import type { SupabaseClient } from '@supabase/supabase-js';
import type { SessionUser } from './types';

export async function fetchActiveSessionUsersBySession(
  client: SupabaseClient,
  sessionId: string
): Promise<SessionUser[]> {
  const { data, error } = await client
    .from('session_users')
    .select('*')
    .eq('session_id', sessionId)
    .neq('status', 'left')
    .order('joined_at', { ascending: true });

  if (error) {
    console.error('fetchActiveSessionUsersBySession', error);
    return [];
  }
  return (data as SessionUser[]) ?? [];
}

export async function fetchSessionUsersByRestaurant(
  client: SupabaseClient,
  restaurantId: string
): Promise<SessionUser[]> {
  // No tenemos restaurant_id en session_users; vamos via service_sessions.
  const { data: sessions, error: sessErr } = await client
    .from('service_sessions')
    .select('id')
    .eq('restaurant_id', restaurantId)
    .eq('status', 'active');

  if (sessErr || !sessions || sessions.length === 0) return [];

  const ids = (sessions as { id: string }[]).map((s) => s.id);
  const { data, error } = await client
    .from('session_users')
    .select('*')
    .in('session_id', ids)
    .neq('status', 'left');

  if (error) {
    console.error('fetchSessionUsersByRestaurant', error);
    return [];
  }
  return (data as SessionUser[]) ?? [];
}

/**
 * Upsert por (session_id, user_identifier). Sin constraint UNIQUE en DB,
 * lo emulamos con select-then-insert.
 */
export async function upsertSessionUserByIdentifier(
  client: SupabaseClient,
  args: {
    sessionId: string;
    userIdentifier: string;
    language?: string | null;
  }
): Promise<SessionUser> {
  const { data: existing, error: fetchErr } = await client
    .from('session_users')
    .select('*')
    .eq('session_id', args.sessionId)
    .eq('user_identifier', args.userIdentifier)
    .maybeSingle();

  if (fetchErr) {
    console.error('upsertSessionUserByIdentifier:fetch', fetchErr);
    throw fetchErr;
  }

  if (existing) {
    const row = existing as SessionUser;
    if (row.status === 'left') {
      const { data: revived, error: revErr } = await client
        .from('session_users')
        .update({ status: 'active', left_at: null })
        .eq('id', row.id)
        .select('*')
        .single();
      if (revErr) {
        console.error('upsertSessionUserByIdentifier:revive', revErr);
        throw revErr;
      }
      return revived as SessionUser;
    }
    return row;
  }

  const { data: inserted, error: insErr } = await client
    .from('session_users')
    .insert([
      {
        session_id: args.sessionId,
        user_identifier: args.userIdentifier,
        language: args.language ?? null,
        status: 'active',
      },
    ])
    .select('*')
    .single();

  if (insErr) {
    console.error('upsertSessionUserByIdentifier:insert', insErr);
    throw insErr;
  }
  return inserted as SessionUser;
}

export async function updateSessionUserLanguage(
  client: SupabaseClient,
  sessionUserId: string,
  language: string | null
): Promise<SessionUser> {
  const { data, error } = await client
    .from('session_users')
    .update({ language })
    .eq('id', sessionUserId)
    .select('*')
    .single();

  if (error) {
    console.error('updateSessionUserLanguage', error);
    throw error;
  }
  return data as SessionUser;
}

export async function markSessionUserLeft(
  client: SupabaseClient,
  sessionUserId: string
): Promise<void> {
  await client
    .from('session_users')
    .update({ status: 'left', left_at: new Date().toISOString() })
    .eq('id', sessionUserId);
}
