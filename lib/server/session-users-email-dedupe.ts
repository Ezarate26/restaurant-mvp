import type { SupabaseClient } from '@supabase/supabase-js';

/** Correo normalizado para comparaciones en BD (minúsculas). */
export function normEmailForDedupe(v: string | null | undefined): string {
  return (v ?? '').trim().toLowerCase();
}

/**
 * Una sesión de mesa no debe tener dos `session_users` con el mismo email.
 * Libera el correo en las demás filas de la misma `session_id` antes de vincular login/enriquecer.
 */
export async function releaseDuplicateEmailsInSameSession(
  admin: SupabaseClient,
  sessionId: string,
  keepSessionUserId: string,
  emailNorm: string
): Promise<{ error: Error | null }> {
  const { error } = await admin
    .from('session_users')
    .update({
      email: null,
      customer_id: null,
      is_profile_completed: false,
      registration_invited: false,
    })
    .eq('session_id', sessionId)
    .neq('id', keepSessionUserId)
    .eq('email', emailNorm);

  if (error) {
    return { error: new Error(error.message) };
  }
  return { error: null };
}

/**
 * Quita el mismo correo en **todas** las filas de la sesión (p. ej. antes de un INSERT bootstrap).
 */
export async function clearEmailBindingsForAllSessionUsersInSession(
  admin: SupabaseClient,
  sessionId: string,
  emailNorm: string
): Promise<{ error: Error | null }> {
  const em = normEmailForDedupe(emailNorm);
  if (!em) return { error: null };

  const { error } = await admin
    .from('session_users')
    .update({
      email: null,
      customer_id: null,
      is_profile_completed: false,
      registration_invited: false,
    })
    .eq('session_id', sessionId)
    .eq('email', em);

  if (error) {
    return { error: new Error(error.message) };
  }
  return { error: null };
}

/**
 * `session_users.username` es único globalmente cuando no es null.
 * Libera colisiones antes de asignar el usuario del cliente a una fila.
 */
export async function releaseUsernameCollisionGlobally(
  admin: SupabaseClient,
  username: string,
  keepSessionUserId?: string | null
): Promise<{ error: Error | null }> {
  const u = username.trim();
  if (!u) return { error: null };

  let q = admin
    .from('session_users')
    .update({ username: null })
    .eq('username', u)
    .neq('status', 'left');

  const keep = keepSessionUserId?.trim();
  if (keep) {
    q = q.neq('id', keep);
  }

  const { error } = await q;
  if (error) {
    return { error: new Error(error.message) };
  }
  return { error: null };
}
