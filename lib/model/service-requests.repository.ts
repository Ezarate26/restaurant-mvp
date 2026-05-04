import type { SupabaseClient } from '@supabase/supabase-js';
import type { ServiceRequest } from './types';

export async function fetchPendingServiceRequestsByRestaurant(
  client: SupabaseClient,
  restaurantId: string
): Promise<ServiceRequest[]> {
  const { data, error } = await client
    .from('service_requests')
    .select('*')
    .eq('restaurant_id', restaurantId)
    .eq('status', 'pending')
    .order('created_at', { ascending: true });

  if (error) {
    console.error('fetchPendingServiceRequestsByRestaurant', error);
    return [];
  }
  return (data as ServiceRequest[]) ?? [];
}

export async function insertServiceRequest(
  client: SupabaseClient,
  args: {
    restaurant_id: string;
    service_session_id: string;
    type: string;
    message?: string | null;
  }
): Promise<ServiceRequest | null> {
  const nowIso = new Date().toISOString();
  const { data, error } = await client
    .from('service_requests')
    .insert([
      {
        restaurant_id: args.restaurant_id,
        service_session_id: args.service_session_id,
        type: args.type,
        message: args.message ?? null,
        status: 'pending',
        created_at: nowIso,
        last_request_at: nowIso,
      },
    ])
    .select('*')
    .single();

  if (error) {
    console.error('insertServiceRequest', error);
    throw error;
  }
  return (data as ServiceRequest) ?? null;
}

/** Marca todas las solicitudes pendientes de la sesión como asignadas al mesero. */
export async function claimAllPendingForSession(
  client: SupabaseClient,
  sessionId: string,
  waiterId: string
): Promise<void> {
  const { error } = await client
    .from('service_requests')
    .update({ status: 'assigned', assigned_to: waiterId })
    .eq('service_session_id', sessionId)
    .eq('status', 'pending');

  if (error) {
    console.error('claimAllPendingForSession', error);
    throw error;
  }
}
