/**
 * Identificador estable del dispositivo del participante (localStorage).
 * No usa Supabase Auth.
 */

const STORAGE_KEY = 'conversationPlatform.deviceId';
const LEGACY_STORAGE_KEY = 'restaurantMvp.customerIdentifier';

function generateUuid(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return 'xxxxxxxxxxxx4xxxyxxxxxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

export function getOrCreateCustomerIdentifier(): string {
  if (typeof window === 'undefined') return generateUuid();
  try {
    const existing =
      window.localStorage.getItem(STORAGE_KEY) ??
      window.localStorage.getItem(LEGACY_STORAGE_KEY);
    if (existing && existing.length > 0) {
      if (!window.localStorage.getItem(STORAGE_KEY)) {
        window.localStorage.setItem(STORAGE_KEY, existing);
      }
      return existing;
    }
    const fresh = generateUuid();
    window.localStorage.setItem(STORAGE_KEY, fresh);
    return fresh;
  } catch {
    return generateUuid();
  }
}

/** Alias de dominio para participantes anónimos. */
export const getOrCreateDeviceId = getOrCreateCustomerIdentifier;
