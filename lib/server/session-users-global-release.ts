import type { SupabaseClient } from '@supabase/supabase-js';

export type ActiveTableResumeTarget = {
  sessionId: string;
  servicePointId: string;
};

type RawSessionJoinRow = {
  id: string;
  session_id: string | null;
  joined_at: string | null;
  service_sessions:
    | {
        id: string;
        status: string | null;
        service_point_id: string | null;
      }
    | Array<{
        id: string;
        status: string | null;
        service_point_id: string | null;
      }>
    | null;
};

function sessionJoin(r: RawSessionJoinRow): {
  id: string;
  status: string | null;
  service_point_id: string | null;
} | null {
  const raw = r.service_sessions;
  if (!raw) return null;
  const one = Array.isArray(raw) ? raw[0] : raw;
  if (!one?.id) return null;
  return {
    id: one.id,
    status: one.status ?? null,
    service_point_id: one.service_point_id ?? null,
  };
}

/**
 * Antes de archivar filas: detecta si este dispositivo estaba en una mesa con sesión activa
 * (para reinsertar un vínculo limpio tras completar registro).
 */
export async function captureActiveTableResumeFromDevice(
  admin: SupabaseClient,
  deviceId: string | null | undefined
): Promise<ActiveTableResumeTarget | null> {
  const did = deviceId?.trim();
  if (!did) return null;

  const { data: rows, error } = await admin
    .from('session_users')
    .select(
      `
      id,
      session_id,
      joined_at,
      service_sessions (
        id,
        status,
        service_point_id
      )
    `
    )
    .eq('device_id', did)
    .order('joined_at', { ascending: false })
    .limit(25);

  if (error) {
    console.error('captureActiveTableResumeFromDevice', error);
    return null;
  }

  for (const raw of (rows ?? []) as RawSessionJoinRow[]) {
    const ss = sessionJoin(raw);
    if (!ss || ss.status !== 'active') continue;
    const spid = ss.service_point_id?.trim();
    const sid = ss.id?.trim();
    if (spid && sid) return { sessionId: sid, servicePointId: spid };
  }
  return null;
}

/** Prioridad al volver desde «completar perfil»: mesa/sesión explícitas en la URL. */
export async function resolveExplicitResumeSessionOnPoint(
  admin: SupabaseClient,
  sessionId: string,
  servicePointId: string
): Promise<ActiveTableResumeTarget | null> {
  const sid = sessionId.trim();
  const pid = servicePointId.trim();
  if (!sid || !pid) return null;

  const { data: sess, error } = await admin
    .from('service_sessions')
    .select('id, status, service_point_id')
    .eq('id', sid)
    .maybeSingle();

  if (error || !sess || sess.status !== 'active') return null;

  const spid = (sess.service_point_id as string)?.trim();
  if (!spid || spid.toLowerCase() !== pid.toLowerCase()) return null;

  return { sessionId: sess.id as string, servicePointId: spid };
}

export async function fetchNonLeftSessionUserIdsByEmail(
  admin: SupabaseClient,
  email: string
): Promise<string[]> {
  const em = email.trim().toLowerCase();
  const { data, error } = await admin
    .from('session_users')
    .select('id')
    .eq('email', em)
    .neq('status', 'left');

  if (error) {
    console.error('fetchNonLeftSessionUserIdsByEmail', error);
    return [];
  }
  return ((data as { id: string }[]) ?? []).map((r) => r.id);
}

export async function fetchNonLeftSessionUserIdsByDevice(
  admin: SupabaseClient,
  deviceId: string
): Promise<string[]> {
  const did = deviceId.trim();
  const { data, error } = await admin
    .from('session_users')
    .select('id')
    .eq('device_id', did)
    .neq('status', 'left');

  if (error) {
    console.error('fetchNonLeftSessionUserIdsByDevice', error);
    return [];
  }
  return ((data as { id: string }[]) ?? []).map((r) => r.id);
}

function isMissingColumnError(msg: string): boolean {
  const m = msg.toLowerCase();
  return m.includes('schema cache') || m.includes('column') || m.includes('is_active');
}

async function archiveSessionUserIds(
  admin: SupabaseClient,
  ids: string[],
  withIsActive: boolean
): Promise<{ message?: string } | null> {
  const unique = [...new Set(ids)];
  if (unique.length === 0) return null;

  const now = new Date().toISOString();
  const results = await Promise.all(
    unique.map((id) => {
      const patch: Record<string, unknown> = {
        status: 'left',
        left_at: now,
        device_id: null,
        user_identifier: `dep:${id}`,
      };
      if (withIsActive) patch.is_active = false;
      return admin.from('session_users').update(patch).eq('id', id);
    })
  );

  const err = results.find((r) => r.error)?.error;
  if (!err) return null;
  if (withIsActive && isMissingColumnError(err.message ?? '')) {
    return archiveSessionUserIds(admin, ids, false);
  }
  return err;
}

function normalizeArchiveError(
  err: { message?: string } | null
): { message: string } | null {
  if (!err?.message?.trim()) return null;
  return { message: err.message };
}

/** Tras completar registro: cierra todas las filas abiertas con ese correo o dispositivo. */
export async function archiveSessionUsersForRegistrationCleanup(
  admin: SupabaseClient,
  args: { email: string; deviceId?: string | null }
): Promise<{ error: { message: string } | null }> {
  const emailIds = await fetchNonLeftSessionUserIdsByEmail(admin, args.email);
  const deviceIds = args.deviceId?.trim()
    ? await fetchNonLeftSessionUserIdsByDevice(admin, args.deviceId.trim())
    : [];
  const merged = [...new Set([...emailIds, ...deviceIds])];
  const err = await archiveSessionUserIds(admin, merged, true);
  return { error: normalizeArchiveError(err) };
}

/** Tras login en mesa: conserva la fila actual y archiva el resto del mismo correo/dispositivo. */
export async function archiveOtherSessionUsersForLinkedCustomer(
  admin: SupabaseClient,
  args: {
    email: string;
    deviceId?: string | null;
    keepSessionUserId: string;
  }
): Promise<{ error: { message: string } | null }> {
  const emailIds = await fetchNonLeftSessionUserIdsByEmail(admin, args.email);
  const deviceIds = args.deviceId?.trim()
    ? await fetchNonLeftSessionUserIdsByDevice(admin, args.deviceId.trim())
    : [];
  const merged = [...new Set([...emailIds, ...deviceIds])].filter(
    (id) => id !== args.keepSessionUserId
  );
  const err = await archiveSessionUserIds(admin, merged, true);
  return { error: normalizeArchiveError(err) };
}
