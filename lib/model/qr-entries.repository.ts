import type { SupabaseClient } from '@supabase/supabase-js';
import type { QrEntry, ServicePoint } from './types';
import { fetchServicePointById, fetchServicePointByQrCode } from './service-points.repository';

export interface ResolvedQr {
  servicePoint: ServicePoint;
  qrEntry?: QrEntry | null;
  /** Sesión preferida que el QR ya tenía pegada (puede no existir). */
  sessionId?: string | null;
}

/**
 * Resuelve un código QR a un service_point.
 * Prioriza:
 *   1) qr_entries.id == code           → toma service_point_id (o target_id) del entry.
 *   2) service_points.qr_code == code  → match directo por código de punto.
 *   3) service_points.id == code       → fallback: el código es el id del punto (compat /table/[id]).
 */
export async function resolveQrCode(
  client: SupabaseClient,
  code: string
): Promise<ResolvedQr | null> {
  const { data: entryRow } = await client
    .from('qr_entries')
    .select('*')
    .eq('id', code)
    .maybeSingle();

  if (entryRow) {
    const entry = entryRow as QrEntry;
    const pointId = entry.service_point_id ?? entry.target_id;
    if (pointId) {
      const point = await fetchServicePointById(client, pointId);
      if (point) {
        return { servicePoint: point, qrEntry: entry, sessionId: entry.session_id };
      }
    }
  }

  const byQr = await fetchServicePointByQrCode(client, code);
  if (byQr) return { servicePoint: byQr };

  const byId = await fetchServicePointById(client, code);
  if (byId) return { servicePoint: byId };

  return null;
}
