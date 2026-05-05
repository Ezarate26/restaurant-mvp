import type { SessionUser } from '@/lib/model/types';

export type CompleteProfileLinkOpts = {
  servicePointId?: string | null;
  sessionId?: string | null;
};

/**
 * Cliente con cuenta en `customers` vinculada (login, reconocimiento por correo o registro terminado).
 * En el chat no deben mostrarse CTAs de registro.
 */
export function isChatRegisteredCustomer(
  sessionUser: SessionUser | null | undefined
): boolean {
  return Boolean(sessionUser?.customer_id?.trim());
}

/**
 * Textos del header/banner según flujo: invitación por correo vs correo nuevo sin cuenta.
 */
export function chatProfileRegistrationCopy(
  sessionUser: SessionUser | null | undefined
): {
  chipLabel: string;
  linkShort: string;
  linkBanner: string;
} {
  const invited = sessionUser?.registration_invited === true;
  return {
    chipLabel: 'Completar tu registro',
    linkShort: invited ? 'Completar usuario' : 'Completar registro',
    linkBanner: invited
      ? 'Completar usuario — nombre, teléfono y contraseña'
      : 'Completar registro — nombre, teléfono y contraseña',
  };
}

/**
 * Enlace "Completar registro" solo si falta completar y hay correo en la sesión.
 * Incluye `return_point` / `return_session` para volver al mismo chat con la conversación.
 */
export function completeProfileHrefForSessionUser(
  sessionUser: SessionUser | null | undefined,
  /** Si el servidor aún no devolvió email en la fila pero el usuario lo escribió en el borrador. */
  fallbackEmail?: string | null,
  opts?: CompleteProfileLinkOpts | null
): string | null {
  if (!sessionUser) return null;
  if (isChatRegisteredCustomer(sessionUser)) return null;
  if (sessionUser.is_profile_completed === true) return null;
  const email =
    sessionUser.email?.trim() ||
    (fallbackEmail?.trim() ? fallbackEmail.trim() : '');
  if (!email) return null;
  const q = new URLSearchParams();
  q.set('email', email);
  const pid = opts?.servicePointId?.trim();
  const sid = opts?.sessionId?.trim();
  if (pid) q.set('return_point', pid);
  if (sid) q.set('return_session', sid);
  return `/complete-profile?${q.toString()}`;
}

/**
 * Muestra chip "Agrega tu nombre" + modal opcional en el chat.
 * Si ya enviamos invitación por correo (`registration_invited`), no mostrar ese chip:
 * el cliente usa solo "Completar registro".
 */
export function shouldPromptOptionalProfile(
  sessionUser: SessionUser | null | undefined
): boolean {
  if (!sessionUser) return false;
  if (isChatRegisteredCustomer(sessionUser)) return false;
  if (sessionUser.registration_invited === true) return false;

  const hasIdentity =
    Boolean(sessionUser.display_name?.trim()) ||
    Boolean(sessionUser.username?.trim()) ||
    Boolean(sessionUser.email?.trim());

  const markedDone = sessionUser.is_profile_completed === true;

  if (markedDone && hasIdentity) return false;
  return true;
}
