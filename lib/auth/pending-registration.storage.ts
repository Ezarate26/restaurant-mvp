import type { CreateRestaurantInput } from '@/lib/model/restaurants.repository';

export type PendingOwnerRestaurantPayload = Omit<
  CreateRestaurantInput,
  'ownerUserId'
>;
import { normalizeAppLanguage } from '@/lib/model/language-options';

const KEY_CREDENTIALS = 'rmvp_verify_credentials';
const KEY_OWNER_PAYLOAD = 'rmvp_pending_owner_restaurant';
const KEY_OWNER_DRAFT_RESTAURANT_ID = 'rmvp_owner_draft_restaurant_id';
const KEY_WAITER_PAYLOAD = 'rmvp_pending_waiter_register';
const KEY_WAITER_DRAFT_RESTAURANT_ID = 'rmvp_waiter_draft_restaurant_id';

export type PendingVerifyCredentials = {
  email: string;
  password: string;
};

export type PendingWaiterRegistration = {
  restaurantCode: string;
  fullName: string;
  employeeNumber: string | null;
  /** Código `profiles.language` (ej. es, en). */
  language: string;
};

function readJson<T>(key: string): T | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = sessionStorage.getItem(key);
    if (!raw) return null;
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

function writeJson(key: string, value: unknown) {
  if (typeof window === 'undefined') return;
  sessionStorage.setItem(key, JSON.stringify(value));
}

export function savePendingVerifyCredentials(email: string, password: string) {
  writeJson(KEY_CREDENTIALS, { email, password } satisfies PendingVerifyCredentials);
}

export function readPendingVerifyCredentials(): PendingVerifyCredentials | null {
  const v = readJson<PendingVerifyCredentials>(KEY_CREDENTIALS);
  if (!v?.email || !v.password) return null;
  return v;
}

export function clearPendingVerifyCredentials() {
  if (typeof window === 'undefined') return;
  sessionStorage.removeItem(KEY_CREDENTIALS);
}

export function savePendingOwnerRestaurant(input: PendingOwnerRestaurantPayload) {
  writeJson(KEY_OWNER_PAYLOAD, input);
}

export function readPendingOwnerRestaurant(): PendingOwnerRestaurantPayload | null {
  return readJson<PendingOwnerRestaurantPayload>(KEY_OWNER_PAYLOAD);
}

export function clearPendingOwnerRestaurant() {
  if (typeof window === 'undefined') return;
  sessionStorage.removeItem(KEY_OWNER_PAYLOAD);
}

export function saveOwnerDraftRestaurantId(id: string) {
  if (typeof window === 'undefined') return;
  sessionStorage.setItem(KEY_OWNER_DRAFT_RESTAURANT_ID, id);
}

export function readOwnerDraftRestaurantId(): string | null {
  if (typeof window === 'undefined') return null;
  return sessionStorage.getItem(KEY_OWNER_DRAFT_RESTAURANT_ID);
}

export function clearOwnerDraftRestaurantId() {
  if (typeof window === 'undefined') return;
  sessionStorage.removeItem(KEY_OWNER_DRAFT_RESTAURANT_ID);
}

export function savePendingWaiterRegistration(input: PendingWaiterRegistration) {
  writeJson(KEY_WAITER_PAYLOAD, input);
}

export function readPendingWaiterRegistration(): PendingWaiterRegistration | null {
  const v = readJson<PendingWaiterRegistration>(KEY_WAITER_PAYLOAD);
  if (!v?.restaurantCode || !v?.fullName) return null;
  return {
    ...v,
    language: normalizeAppLanguage(v.language),
  };
}

export function clearPendingWaiterRegistration() {
  if (typeof window === 'undefined') return;
  sessionStorage.removeItem(KEY_WAITER_PAYLOAD);
}

export function saveWaiterDraftRestaurantId(id: string) {
  if (typeof window === 'undefined') return;
  sessionStorage.setItem(KEY_WAITER_DRAFT_RESTAURANT_ID, id);
}

export function readWaiterDraftRestaurantId(): string | null {
  if (typeof window === 'undefined') return null;
  return sessionStorage.getItem(KEY_WAITER_DRAFT_RESTAURANT_ID);
}

export function clearWaiterDraftRestaurantId() {
  if (typeof window === 'undefined') return;
  sessionStorage.removeItem(KEY_WAITER_DRAFT_RESTAURANT_ID);
}

export function clearAllPendingRegistration() {
  clearPendingVerifyCredentials();
  clearPendingOwnerRestaurant();
  clearOwnerDraftRestaurantId();
  clearPendingWaiterRegistration();
  clearWaiterDraftRestaurantId();
}
