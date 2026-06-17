import type { User } from '@supabase/supabase-js';
import type { AppUser } from '@/lib/model/types';

/** Nombre visible de la cuenta: perfil → metadata → email. */
export function resolveAccountDisplayName(
  user: User,
  profile?: AppUser | null
): string {
  const meta = user.user_metadata ?? {};
  const metaName =
    typeof meta.full_name === 'string' ? meta.full_name.trim() : '';

  return (
    profile?.display_name?.trim() ||
    metaName ||
    user.email?.split('@')[0] ||
    ''
  );
}
