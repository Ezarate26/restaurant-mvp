import type { SupabaseClient } from '@supabase/supabase-js';
import { resolveAccountDisplayName } from '@/lib/utils/account-display-name';
import { fetchUserById } from '@/lib/model/profiles.repository';

/** Nombre visible al unirse con cuenta (perfil → metadata → email). */
export async function resolveJoinDisplayNameForUser(
  client: SupabaseClient,
  userId: string
): Promise<string> {
  const profile = await fetchUserById(client, userId);
  const { data, error } = await client.auth.admin.getUserById(userId);
  if (error || !data.user) {
    console.error('resolveJoinDisplayNameForUser:getUser', error);
    throw new Error('No se pudo validar tu cuenta. Inicia sesión de nuevo.');
  }

  const name = resolveAccountDisplayName(data.user, profile);
  if (!name) {
    throw new Error(
      'Completa tu perfil con un nombre antes de unirte a una conversación.'
    );
  }
  return name;
}
