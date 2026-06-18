import type { SupabaseClient } from '@supabase/supabase-js';
import { fetchUserById, upsertUserProfile } from '@/lib/model/profiles.repository';

/**
 * Garantiza fila en public.users (service role / API servidor).
 */
export async function ensurePublicUserById(
  client: SupabaseClient,
  userId: string
): Promise<void> {
  const existing = await fetchUserById(client, userId);
  if (existing) return;

  const { data, error } = await client.auth.admin.getUserById(userId);
  if (error || !data.user) {
    console.error('ensurePublicUserById:getUser', error);
    throw new Error('No se pudo validar tu cuenta. Inicia sesión de nuevo.');
  }

  const user = data.user;
  const meta = user.user_metadata as Record<string, unknown> | undefined;
  const displayName =
    typeof meta?.full_name === 'string' && meta.full_name.trim()
      ? meta.full_name.trim()
      : null;
  const phone =
    typeof meta?.phone === 'string' && meta.phone.trim()
      ? meta.phone.trim()
      : null;

  await upsertUserProfile(client, {
    id: user.id,
    email: user.email ?? null,
    display_name: displayName,
    phone,
  });
}

/**
 * Garantiza fila en public.users antes de asignar user_id en conversation_members.
 * Auth puede existir sin perfil público (p. ej. registro incompleto).
 */
export async function ensurePublicUserFromSession(
  client: SupabaseClient
): Promise<string | null> {
  const { data } = await client.auth.getSession();
  const user = data.session?.user;
  if (!user?.id) return null;

  const existing = await fetchUserById(client, user.id);
  if (existing) return user.id;

  const meta = user.user_metadata as Record<string, unknown> | undefined;
  const displayName =
    typeof meta?.full_name === 'string' && meta.full_name.trim()
      ? meta.full_name.trim()
      : null;
  const phone =
    typeof meta?.phone === 'string' && meta.phone.trim()
      ? meta.phone.trim()
      : null;

  await upsertUserProfile(client, {
    id: user.id,
    email: user.email ?? null,
    display_name: displayName,
    phone,
  });

  return user.id;
}
