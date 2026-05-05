/**
 * View-model para tarjetas de mesa en dashboard de mesero.
 */
export interface TableView {
  /** Identificador navegable: en el modelo actual es `service_session.id`. */
  id: string;
  restaurant_id: string;
  /** Nombre legible del punto físico (`service_point.name`). */
  name: string;
  /** Mesero asignado (`service_session.assigned_to`). */
  assigned_to: string | null;
  /** Nombre del mesero (resuelto por join con `profiles`). */
  assigned_to_name: string | null;
  /** Estado textual para UI. */
  status: string;
}

