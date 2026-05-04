import type { SessionUser } from '@/lib/model/types';

/**
 * True cuando conviene mostrar el CTA de datos opcionales en chat:
 * oculta solo si el perfil está marcado como completo y hay al menos un dato guardado.
 * Así cubrimos DEFAULT true en DB sin datos y filas sin la columna.
 */
export function shouldPromptOptionalProfile(
  sessionUser: SessionUser | null | undefined
): boolean {
  if (!sessionUser) return false;

  const hasIdentity =
    Boolean(sessionUser.display_name?.trim()) ||
    Boolean(sessionUser.username?.trim()) ||
    Boolean(sessionUser.email?.trim());

  const markedDone = sessionUser.is_profile_completed === true;

  if (markedDone && hasIdentity) return false;
  return true;
}
