/**
 * Tipos "view-shape" usados por componentes existentes (TableCard, RequestCard, etc.).
 * Mantienen la interfaz que esos componentes esperaban antes del nuevo schema,
 * pero ahora son alimentados por adapters que combinan service_sessions /
 * service_points / service_requests.
 */

export interface TableView {
  /** Identificador navegable: en el nuevo modelo es el `service_session.id`. */
  id: string;
  restaurant_id: string;
  /** Nombre legible del punto físico (`service_point.name`). */
  name: string;
  /** Mesero asignado (`service_session.assigned_to`). */
  assigned_to: string | null;
  /** Nombre del mesero (resuelto por join lazy con `profiles`). */
  assigned_to_name: string | null;
  /** Estado de la sesión, mapeado a un texto corto para UI. */
  status: string;
}

export interface PendingTableRequestView {
  /** Mismo contrato de antes: el id que `onTakeTable(id)` usa. Ahora apunta a la sesión. */
  table_id: string;
  request_count: number;
  /** ISO de la solicitud más antigua dentro de la sesión. */
  created_at: string;
}
