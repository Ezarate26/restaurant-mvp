export type BusinessMode = 'multi_table' | 'single_point' | 'hybrid';
export type ServicePointType = 'table' | 'counter' | string;
export type ServicePointModeOverride = 'inherit' | 'multi' | 'single';
export type ServiceSessionStatus = 'active' | 'closed' | string;
export type ServiceSessionType = 'table' | 'counter' | string;
export type SessionUserStatus = 'active' | 'waiting' | 'left';
export type ServiceRequestStatus = 'pending' | 'assigned' | 'resolved' | string;
export type ServiceRequestType = 'call' | 'order' | string;
export type MessageSender = 'customer' | 'waiter' | 'system' | string;
export type ProfileRole = 'owner' | 'admin' | 'waiter' | string;

export interface Restaurant {
  id: string;
  name: string | null;
  invite_code: string | null;
  owner_name: string | null;
  phone: string | null;
  email: string | null;
  address: string | null;
  business_mode: BusinessMode;
  owner_id?: string | null;
  created_at?: string | null;
}

export interface RestaurantSettings {
  id: string;
  restaurant_id: string;
  allow_tables: boolean;
  allow_walkins: boolean;
  default_language: string;
  created_at?: string | null;
}

export interface ServicePoint {
  id: string;
  restaurant_id: string;
  name: string | null;
  type: ServicePointType;
  qr_code: string | null;
  is_active: boolean;
  capacity: number;
  location_note: string | null;
  mode_override: ServicePointModeOverride;
  created_at?: string | null;
}

export interface ServiceSession {
  id: string;
  restaurant_id: string;
  type: ServiceSessionType;
  status: ServiceSessionStatus;
  assigned_to: string | null;
  language: string | null;
  service_point_id: string | null;
  customer_count: number | null;
  channel: string | null;
  notes: string | null;
  closed_reason: string | null;
  created_by: string | null;
  created_at?: string | null;
  started_at?: string | null;
  ended_at?: string | null;
  last_activity_at?: string | null;
}

export interface SessionUser {
  id: string;
  session_id: string;
  user_identifier: string | null;
  display_name?: string | null;
  username?: string | null;
  email?: string | null;
  is_profile_completed?: boolean | null;
  language: string | null;
  status: SessionUserStatus;
  joined_at?: string | null;
  left_at?: string | null;
}

export interface ServiceRequest {
  id: string;
  restaurant_id: string | null;
  type: ServiceRequestType | null;
  message: string | null;
  status: ServiceRequestStatus;
  assigned_to: string | null;
  service_session_id: string | null;
  created_at?: string | null;
  last_request_at?: string | null;
}

/** Fila anidada opcional desde `.select('*, session_users(...)')`. */
export interface MessageSessionUserJoin {
  user_identifier: string | null;
  display_name?: string | null;
  username?: string | null;
  email?: string | null;
}

export interface Message {
  id: string;
  sender: MessageSender | null;
  text: string | null;
  restaurant_id: string | null;
  session_id: string | null;
  session_user_id: string | null;
  user_identifier: string | null;
  created_at?: string | null;
  session_users?: MessageSessionUserJoin | MessageSessionUserJoin[] | null;
}

export interface Profile {
  id: string;
  email: string | null;
  full_name: string | null;
  employee_number: string | null;
  restaurant_id: string | null;
  role: ProfileRole;
  is_active: boolean;
  language?: string | null;
  created_at?: string | null;
}

export interface QrEntry {
  id: string;
  restaurant_id: string;
  type: string;
  target_id: string | null;
  service_point_id: string | null;
  session_id: string | null;
  expires_at: string | null;
  created_at?: string | null;
}

export interface Order {
  id: string;
  restaurant_id: string | null;
  status: string;
  assigned_to: string | null;
  language: string | null;
  service_session_id: string | null;
  created_at?: string | null;
}
