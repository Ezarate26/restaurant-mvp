import type { SupabaseClient } from '@supabase/supabase-js';
import type { ServicePoint, ServicePointModeOverride } from './types';

export async function fetchServicePointsByRestaurant(
  client: SupabaseClient,
  restaurantId: string
): Promise<ServicePoint[]> {
  const { data, error } = await client
    .from('service_points')
    .select('*')
    .eq('restaurant_id', restaurantId)
    .eq('is_active', true)
    .order('name', { ascending: true });

  if (error) {
    console.error('fetchServicePointsByRestaurant', error);
    return [];
  }
  return (data as ServicePoint[]) ?? [];
}

export async function fetchServicePointById(
  client: SupabaseClient,
  pointId: string
): Promise<ServicePoint | null> {
  const { data, error } = await client
    .from('service_points')
    .select('*')
    .eq('id', pointId)
    .maybeSingle();

  if (error) {
    console.error('fetchServicePointById', error);
    return null;
  }
  return (data as ServicePoint) ?? null;
}

export async function fetchServicePointByQrCode(
  client: SupabaseClient,
  qrCode: string
): Promise<ServicePoint | null> {
  const { data, error } = await client
    .from('service_points')
    .select('*')
    .eq('qr_code', qrCode)
    .maybeSingle();

  if (error) {
    console.error('fetchServicePointByQrCode', error);
    return null;
  }
  return (data as ServicePoint) ?? null;
}

export interface NewServicePointInput {
  restaurant_id: string;
  name: string;
  type?: string;
  qr_code?: string | null;
  capacity?: number;
  location_note?: string | null;
  mode_override?: ServicePointModeOverride;
}

export async function insertServicePoints(
  client: SupabaseClient,
  rows: NewServicePointInput[]
): Promise<ServicePoint[]> {
  if (rows.length === 0) return [];

  const payload = rows.map((r) => ({
    restaurant_id: r.restaurant_id,
    name: r.name,
    type: r.type ?? 'table',
    qr_code: r.qr_code ?? null,
    capacity: r.capacity ?? 1,
    location_note: r.location_note ?? null,
    mode_override: r.mode_override ?? 'inherit',
    is_active: true,
  }));

  const { data, error } = await client
    .from('service_points')
    .insert(payload)
    .select('*');

  if (error) {
    console.error('insertServicePoints', error);
    throw error;
  }
  return (data as ServicePoint[]) ?? [];
}
