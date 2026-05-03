export type MessageSender = 'customer' | 'waiter' | 'system';

export interface Message {
  id: string;
  table_id: string;
  restaurant_id: string;
  sender: MessageSender;
  text: string;
  created_at?: string;
}

export interface Table {
  id: string;
  restaurant_id: string;
  name: string;
  assigned_to: string | null;
  assigned_to_name: string | null;
  status: string;
}

export interface Profile {
  id: string;
  email?: string;
  full_name: string;
  employee_number?: string | null;
  restaurant_id: string;
}

export interface Restaurant {
  id: string;
  invite_code?: string;
}

/** Una fila por mesa en la cola de solicitudes (mensaje cliente + llamar mesero). */
export interface PendingTableRequest {
  table_id: string;
  request_count: number;
  /** Primera interacción de la mesa en esta cola (ISO), para ordenar. */
  created_at: string;
}
