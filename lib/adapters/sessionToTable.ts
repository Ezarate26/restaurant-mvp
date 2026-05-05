import type {
  Profile,
  ServicePoint,
  ServiceSession,
} from '@/lib/model/types';
import type { TableView } from './table-view.types';

export interface SessionToTableArgs {
  session: ServiceSession;
  point: ServicePoint | null | undefined;
  assignedProfile?: Profile | null;
}

/**
 * Combina una sesión activa + su punto físico + (opcional) el perfil del mesero
 * en la forma que TableCard / WaiterDashboardView esperaban del modelo viejo.
 *
 * `id` es el `service_session.id` para que `onOpenChat(id)` y demás handlers
 * existentes ya operen contra la sesión sin saberlo.
 */
export function sessionToTableView({
  session,
  point,
  assignedProfile,
}: SessionToTableArgs): TableView {
  const name = point?.name?.trim() || 'Sesión';
  return {
    id: session.id,
    restaurant_id: session.restaurant_id,
    name,
    assigned_to: session.assigned_to,
    assigned_to_name: assignedProfile?.full_name ?? null,
    status: session.status,
  };
}
