import type { Message, SessionUser } from '@/lib/model/types';
import { isTechnicalUserIdentifier } from '@/lib/utils/user-identifier';

type JoinRow = {
  user_identifier: string | null;
  display_name: string | null;
  username: string | null;
  email: string | null;
};

function normalizeJoin(message: Message): JoinRow | null {
  const nested = message.session_users;
  const row = Array.isArray(nested) ? nested[0] : nested;
  if (!row) return null;
  return {
    user_identifier: row.user_identifier ?? null,
    display_name: row.display_name ?? null,
    username: row.username ?? null,
    email: row.email ?? null,
  };
}

export function orderedSessionUsers(users: SessionUser[]): SessionUser[] {
  return [...users].sort((a, b) => {
    const aTs = Date.parse(a.joined_at ?? '');
    const bTs = Date.parse(b.joined_at ?? '');
    if (Number.isFinite(aTs) && Number.isFinite(bTs)) return aTs - bTs;
    return 0;
  });
}

function sessionUserOrderIndex(users: SessionUser[]): Map<string, number> {
  const m = new Map<string, number>();
  orderedSessionUsers(users).forEach((u, i) => m.set(u.id, i + 1));
  return m;
}

function truncate(s: string, max: number): string {
  if (s.length <= max) return s;
  return `${s.slice(0, max)}…`;
}

/**
 * Etiqueta corta en burbuja + nombre y alias para modal (sin tooltip nativo).
 */
export function customerPeerHeaderLabels(
  message: Message,
  sessionUsers: SessionUser[]
): {
  shortLabel: string;
  displayName: string;
  username: string;
} {
  const join = normalizeJoin(message);
  const sid = message.session_user_id;
  const su = sid ? sessionUsers.find((u) => u.id === sid) : undefined;

  const displayName =
    su?.display_name?.trim() || join?.display_name?.trim() || '';
  const username =
    su?.username?.trim() || join?.username?.trim() || '';
  const userIdent =
    su?.user_identifier?.trim() || join?.user_identifier?.trim() || '';
  const indexMap = sessionUserOrderIndex(sessionUsers);
  const index = sid ? (indexMap.get(sid) ?? null) : null;

  let shortLabel = '';
  if (username) {
    shortLabel = truncate(username, 22);
  } else if (displayName) {
    shortLabel = truncate(displayName, 22);
  } else if (userIdent && !isTechnicalUserIdentifier(userIdent)) {
    shortLabel = truncate(userIdent, 22);
  } else if (index != null) {
    shortLabel = `Usuario ${index}`;
  } else {
    shortLabel = 'Cliente';
  }

  return { shortLabel, displayName, username };
}
