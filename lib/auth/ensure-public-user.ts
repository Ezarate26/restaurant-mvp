import type { SupabaseClient } from '@supabase/supabase-js';
import { fetchUserById, upsertUserProfile } from '@/lib/model/profiles.repository';

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
