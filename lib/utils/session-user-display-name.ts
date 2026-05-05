import type { SessionUser } from '@/lib/model/types';
import { orderedSessionUsers } from '@/lib/utils/chat-peer-label';
import {
  isTechnicalUserIdentifier,
  paddedUsuarioOrder,
} from '@/lib/utils/user-identifier';

/**
 * Orden de llegada (1-based) dentro de la sesión, para fallback "Usuario N".
 */
export function sessionUserArrivalIndex(
  users: SessionUser[],
  userId: string
): number | null {
  const ordered = orderedSessionUsers(users);
  const idx = ordered.findIndex((u) => u.id === userId);
  if (idx < 0) return null;
  return idx + 1;
}

/**
 * Nombre visible en chips/listas: username (alias) → display_name → user_identifier legible → Usuario NN.
 */
export function sessionUserDisplayLabel(
  u: SessionUser,
  arrivalIndex: number
): string {
  const un = u.username?.trim();
  if (un) return un;
  const d = u.display_name?.trim();
  if (d) return d;
  const idf = u.user_identifier?.trim();
  if (idf && !isTechnicalUserIdentifier(idf)) return idf;
  return paddedUsuarioOrder(arrivalIndex);
}

/**
 * Encabezado en burbuja del mesero (vista cliente): nombre del perfil + rol corto.
 */
export function staffBubbleHeaderFromFullName(
  fullName: string | null | undefined
): string {
  const n = fullName?.trim();
  if (!n) return 'Personal del restaurante';
  const short = n.length <= 20 ? n : `${n.slice(0, 18)}…`;
  return `${short} · Personal`;
}
