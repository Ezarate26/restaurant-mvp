import type { SessionUser } from '@/lib/model/types';

/**
 * Participante contable en dashboards: solo `session_users.status === 'active'`.
 * OWNER / WAITER / CUSTOMER (auth) son roles globales; la identidad en chat es **por sesión**
 * (`session_user`), independiente por mesa.
 */
export function isPresentSessionUser(u: SessionUser | null | undefined): boolean {
  return Boolean(u && u.status === 'active');
}
