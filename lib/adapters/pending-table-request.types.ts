/**
 * View-model para solicitudes agrupadas por sesión/mesa.
 */
export interface PendingTableRequestView {
  /** Id de sesión que se usa en `onTakeTable(id)`. */
  table_id: string;
  request_count: number;
  /** ISO de la solicitud más antigua del grupo. */
  created_at: string;
}

