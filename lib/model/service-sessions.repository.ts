import type { SupabaseClient } from '@supabase/supabase-js';
import type { ServiceSession, ServicePoint } from './types';

export async function fetchActiveSessionsByRestaurant(
  client: SupabaseClient,
  restaurantId: string
): Promise<ServiceSession[]> {
  const { data, error } = await client
    .from('service_sessions')
    .select('*')
    .eq('restaurant_id', restaurantId)
    .eq('status', 'active')
    .order('last_activity_at', { ascending: false });

  if (error) {
    console.error('fetchActiveSessionsByRestaurant', error);
    return [];
  }
  return (data as ServiceSession[]) ?? [];
}

export async function fetchServiceSessionById(
  client: SupabaseClient,
  sessionId: string
): Promise<ServiceSession | null> {
  const { data, error } = await client
    .from('service_sessions')
    .select('*')
    .eq('id', sessionId)
    .maybeSingle();

  if (error) {
    console.error('fetchServiceSessionById', error);
    return null;
  }
  return (data as ServiceSession) ?? null;
}

/**
 * Devuelve la sesión activa del punto si existe; si no, crea una nueva.
 * El primer cliente que entra abre la sesión; los siguientes se suman como session_users.
 */
export async function getOrCreateActiveSessionForPoint(
  client: SupabaseClient,
  point: ServicePoint,
  language?: string | null
): Promise<ServiceSession> {
  const { data: existing, error: fetchErr } = await client
    .from('service_sessions')
    .select('*')
    .eq('service_point_id', point.id)
    .eq('status', 'active')
    .order('started_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (fetchErr) {
    console.error('getOrCreateActiveSessionForPoint:fetch', fetchErr);
    throw fetchErr;
  }
  if (existing) return existing as ServiceSession;

  const nowIso = new Date().toISOString();
  const insertRow = {
    restaurant_id: point.restaurant_id,
    service_point_id: point.id,
    type: point.type ?? 'table',
    status: 'active',
    language: language ?? null,
    channel: 'qr',
    customer_count: 1,
    started_at: nowIso,
    last_activity_at: nowIso,
  };

  const { data: inserted, error: insErr } = await client
    .from('service_sessions')
    .insert([insertRow])
    .select('*')
    .single();

  if (insErr) {
    console.error('getOrCreateActiveSessionForPoint:insert', insErr);
    throw insErr;
  }
  return inserted as ServiceSession;
}

export async function assignWaiterToSession(
  client: SupabaseClient,
  sessionId: string,
  userId: string
): Promise<void> {
  const { error } = await client
    .from('service_sessions')
    .update({
      assigned_to: userId,
      last_activity_at: new Date().toISOString(),
    })
    .eq('id', sessionId);

  if (error) {
    console.error('assignWaiterToSession', error);
    throw error;
  }
}

export async function closeServiceSession(
  client: SupabaseClient,
  sessionId: string,
  reason?: string | null
): Promise<void> {
  const { error } = await client
    .from('service_sessions')
    .update({
      status: 'closed',
      ended_at: new Date().toISOString(),
      closed_reason: reason ?? null,
    })
    .eq('id', sessionId);

  if (error) {
    console.error('closeServiceSession', error);
    throw error;
  }
}

export async function touchSessionActivity(
  client: SupabaseClient,
  sessionId: string
): Promise<void> {
  await client
    .from('service_sessions')
    .update({ last_activity_at: new Date().toISOString() })
    .eq('id', sessionId);
}
