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
