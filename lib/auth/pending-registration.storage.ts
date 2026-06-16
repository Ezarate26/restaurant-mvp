import { normalizeAppLanguage } from '@/lib/model/language-options';

const KEY_CREDENTIALS = 'rmvp_verify_credentials';

export type PendingVerifyCredentials = {
  email: string;
  password: string;
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
  writeJson(KEY_CREDENTIALS, { email, password });
}

export function readPendingVerifyCredentials(): PendingVerifyCredentials | null {
  return readJson<PendingVerifyCredentials>(KEY_CREDENTIALS);
}

export function clearPendingVerifyCredentials() {
  if (typeof window === 'undefined') return;
  sessionStorage.removeItem(KEY_CREDENTIALS);
}

export function clearAllPendingRegistration() {
  clearPendingVerifyCredentials();
}

/** @deprecated No-op: el producto ya no registra restaurantes. */
export function savePendingOwnerRestaurant(_payload: unknown) {}

/** @deprecated */
export function readPendingOwnerRestaurant(): null {
  return null;
}

/** @deprecated */
export function clearPendingOwnerRestaurant() {}

/** @deprecated */
export function savePendingWaiterRegistration(_payload: unknown) {}

/** @deprecated */
export function readPendingWaiterRegistration(): null {
  return null;
}

/** @deprecated */
export function clearPendingWaiterRegistration() {}

/** @deprecated */
export function saveOwnerDraftRestaurantId(_id: string) {}

/** @deprecated */
export function readOwnerDraftRestaurantId(): null {
  return null;
}

/** @deprecated */
export function clearOwnerDraftRestaurantId() {}

/** @deprecated */
export function saveWaiterDraftRestaurantId(_id: string) {}

/** @deprecated */
export function readWaiterDraftRestaurantId(): null {
  return null;
}

/** @deprecated */
export function clearWaiterDraftRestaurantId() {}
