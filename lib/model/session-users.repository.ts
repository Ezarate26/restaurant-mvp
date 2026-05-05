import type { SupabaseClient } from '@supabase/supabase-js';
import type { SessionUser } from './types';

export async function fetchSessionUserById(
  client: SupabaseClient,
  sessionUserId: string
): Promise<SessionUser | null> {
  const { data, error } = await client
    .from('session_users')
    .select('*')
    .eq('id', sessionUserId)
    .maybeSingle();

  if (error) {
    console.error('fetchSessionUserById', error);
    return null;
  }
  return (data as SessionUser) ?? null;
}

export async function fetchActiveSessionUsersBySession(
  client: SupabaseClient,
  sessionId: string
): Promise<SessionUser[]> {
  const { data, error } = await client
    .from('session_users')
    .select('*')
    .eq('session_id', sessionId)
    .eq('status', 'active')
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
    .eq('status', 'active');

  if (error) {
    console.error('fetchSessionUsersByRestaurant', error);
    return [];
  }
  return (data as SessionUser[]) ?? [];
}

function isUniqueViolation(err: { code?: string } | null): boolean {
  return err?.code === '23505';
}

/**
 * Participante del cliente en una sesión de mesa: `device_id` + `user_identifier`
 * suelen coincidir con el id estable del navegador. Si el usuario ya salió (`left`),
 * no revivimos la fila: archivamos identidad y creamos **otra** fila (reconexión limpia).
 */
export async function upsertSessionUserByIdentifier(
  client: SupabaseClient,
  args: {
    sessionId: string;
    userIdentifier: string;
    language?: string | null;
  }
): Promise<SessionUser> {
  const sid = args.sessionId;
  const ident = args.userIdentifier;

  const { data: byDevice, error: devErr } = await client
    .from('session_users')
    .select('*')
    .eq('session_id', sid)
    .eq('device_id', ident)
    .maybeSingle();

  if (devErr) {
    console.error('upsertSessionUserByIdentifier:fetch-device', devErr);
    throw devErr;
  }

  let existing = byDevice as SessionUser | null;

  if (!existing) {
    const { data: byIdent, error: identErr } = await client
      .from('session_users')
      .select('*')
      .eq('session_id', sid)
      .eq('user_identifier', ident)
      .maybeSingle();

    if (identErr) {
      console.error('upsertSessionUserByIdentifier:fetch-ident', identErr);
      throw identErr;
    }
    existing = byIdent as SessionUser | null;

    if (existing?.id && !existing.device_id) {
      const { data: patched, error: patchErr } = await client
        .from('session_users')
        .update({ device_id: ident })
        .eq('id', existing.id)
        .select('*')
        .single();
      if (!patchErr && patched) {
        existing = patched as SessionUser;
      }
    }
  }

  if (existing) {
    const row = existing as SessionUser;
    if (row.status === 'left') {
      const { error: archErr } = await client
        .from('session_users')
        .update({
          device_id: null,
          user_identifier: `dep:${row.id}`,
        })
        .eq('id', row.id);
      if (archErr) {
        console.error('upsertSessionUserByIdentifier:archive-left', archErr);
        throw archErr;
      }
      existing = null;
    } else {
      return row;
    }
  }

  const { data: inserted, error: insErr } = await client
    .from('session_users')
    .insert([
      {
        session_id: sid,
        user_identifier: ident,
        device_id: ident,
        language: args.language ?? null,
        status: 'active',
      },
    ])
    .select('*')
    .single();

  if (!insErr && inserted) {
    return inserted as SessionUser;
  }

  if (insErr && isUniqueViolation(insErr)) {
    const { data: raced, error: raceErr } = await client
      .from('session_users')
      .select('*')
      .eq('session_id', sid)
      .eq('device_id', ident)
      .eq('status', 'active')
      .maybeSingle();
    if (!raceErr && raced) return raced as SessionUser;

    const { data: raced2, error: raceErr2 } = await client
      .from('session_users')
      .select('*')
      .eq('session_id', sid)
      .eq('user_identifier', ident)
      .eq('status', 'active')
      .maybeSingle();
    if (!raceErr2 && raced2) return raced2 as SessionUser;
  }

  if (insErr) {
    console.error('upsertSessionUserByIdentifier:insert', insErr);
    throw insErr;
  }
  throw new Error('upsertSessionUserByIdentifier: no row');
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

export type SessionUserProfileInput = {
  display_name: string | null;
  username: string | null;
  email: string | null;
  is_profile_completed: boolean;
};

export type SessionUserProfileUpdateResult =
  | { ok: true; sessionUser: SessionUser }
  | {
      ok: false;
      reason: 'username_taken' | 'email_taken' | 'unknown';
      message: string;
    };

export async function updateSessionUserProfile(
  client: SupabaseClient,
  sessionUserId: string,
  input: SessionUserProfileInput
): Promise<SessionUserProfileUpdateResult> {
  const payload = {
    display_name: input.display_name,
    username: input.username,
    email: input.email,
    is_profile_completed: input.is_profile_completed,
  };

  const { data, error } = await client
    .from('session_users')
    .update(payload)
    .eq('id', sessionUserId)
    .select('*')
    .single();

  if (!error) {
    return { ok: true, sessionUser: data as SessionUser };
  }

  const hint = `${error.code ?? ''} ${error.message ?? ''} ${error.details ?? ''}`
    .toLowerCase()
    .trim();
  const isUnique = error.code === '23505' || hint.includes('duplicate');
  if (isUnique && hint.includes('username')) {
    return {
      ok: false,
      reason: 'username_taken',
      message: 'Ese username ya se esta usando. Puedes continuar sin guardarlo.',
    };
  }
  if (isUnique && hint.includes('email')) {
    return {
      ok: false,
      reason: 'email_taken',
      message: 'Ese email ya se esta usando. Puedes continuar sin guardarlo.',
    };
  }

  console.error('updateSessionUserProfile', error);
  return {
    ok: false,
    reason: 'unknown',
    message: 'No pudimos guardar tus datos ahora. Puedes continuar sin problema.',
  };
}

export async function markSessionUserLeft(
  client: SupabaseClient,
  sessionUserId: string
): Promise<void> {
  const now = new Date().toISOString();
  const { error } = await client
    .from('session_users')
    .update({
      status: 'left',
      left_at: now,
      device_id: null,
      user_identifier: `dep:${sessionUserId}`,
    })
    .eq('id', sessionUserId);
  if (error) {
    console.error('markSessionUserLeft', error);
    throw error;
  }
}

/**
 * Marca como `left` todos los participantes activos de la sesión y libera `device_id` /
 * `user_identifier` para que no choquen con UNIQUE globales al abrir otra sesión con el mismo dispositivo.
 */
export async function markAllActiveSessionUsersLeft(
  client: SupabaseClient,
  sessionId: string
): Promise<void> {
  const rows = await fetchActiveSessionUsersBySession(client, sessionId);
  if (rows.length === 0) return;

  const now = new Date().toISOString();
  const results = await Promise.all(
    rows.map((row) =>
      client
        .from('session_users')
        .update({
          status: 'left',
          left_at: now,
          device_id: null,
          user_identifier: `dep:${row.id}`,
        })
        .eq('id', row.id)
    )
  );

  const firstErr = results.find((r) => r.error)?.error;
  if (firstErr) {
    console.error('markAllActiveSessionUsersLeft', firstErr);
    throw firstErr;
  }
}
