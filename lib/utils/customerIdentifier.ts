/**
 * Identificador estable del dispositivo del cliente para mapear a session_users.user_identifier.
 * No usa Supabase Auth; vive solo en localStorage. Si no existe localStorage (SSR),
 * devuelve un id efímero que NO se persiste.
 */

const STORAGE_KEY = 'restaurantMvp.customerIdentifier';

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
    const existing = window.localStorage.getItem(STORAGE_KEY);
    if (existing && existing.length > 0) return existing;
    const fresh = generateUuid();
    window.localStorage.setItem(STORAGE_KEY, fresh);
    return fresh;
  } catch {
    return generateUuid();
  }
}
