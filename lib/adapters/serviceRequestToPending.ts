import type { ServiceRequest } from '@/lib/model/types';
import type { PendingTableRequestView } from './pending-table-request.types';

/**
 * Agrupa solicitudes pendientes por `service_session_id` y produce una fila por sesión.
 * `table_id` (campo legado del view-shape) ahora es el id de la sesión: así el handler
 * existente `onTakeTable(id)` puede operar contra la sesión sin cambiar la firma.
 */
export function groupServiceRequestsBySession(
  requests: ServiceRequest[]
): PendingTableRequestView[] {
  const agg = new Map<
    string,
    { count: number; oldest: string }
  >();

  for (const r of requests) {
    if (r.status !== 'pending') continue;
    const sessionId = r.service_session_id;
    if (!sessionId) continue;

    const created = r.created_at ?? '';
    const cur = agg.get(sessionId);
    if (!cur) {
      agg.set(sessionId, { count: 1, oldest: created });
    } else {
      cur.count += 1;
      if (created && (!cur.oldest || created < cur.oldest)) {
        cur.oldest = created;
      }
    }
  }

  const out: PendingTableRequestView[] = [];
  for (const [sessionId, v] of agg.entries()) {
    out.push({
      table_id: sessionId,
      request_count: v.count,
      created_at: v.oldest || new Date(0).toISOString(),
    });
  }
  out.sort(
    (a, b) =>
      new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
  );
  return out;
}
