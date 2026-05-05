import type { SessionUser } from '@/lib/model/types';

/** Orden estable para listas de confirmación (ej. modal mesero). */
export function sortSessionUsersByJoinedAt(users: SessionUser[]): SessionUser[] {
  return [...users].sort((a, b) => {
    const ta = a.joined_at ?? '';
    const tb = b.joined_at ?? '';
    return ta.localeCompare(tb);
  });
}

/**
 * Etiqueta para UI: display_name || username || Usuario N (N = 1-based en lista ya ordenada).
 */
export function sessionUserDisplayLabel(
  user: SessionUser,
  ordinal: number
): string {
  const d = user.display_name?.trim();
  if (d) return d;
  const u = user.username?.trim();
  if (u) return u;
  return `Usuario ${ordinal}`;
}
