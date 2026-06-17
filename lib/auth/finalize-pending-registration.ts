import type { SupabaseClient } from '@supabase/supabase-js';
import { clearAllPendingRegistration } from '@/lib/auth/pending-registration.storage';

export type FinalizePendingResult =
  | { ok: true; dashboard: 'home' }
  | { ok: false; message: string };

export async function finalizePendingRegistration(
  client: SupabaseClient,
  userId: string,
  email: string
): Promise<FinalizePendingResult> {
  const { data: auth } = await client.auth.getUser();
  const meta = auth.user?.user_metadata;
  const phone =
    typeof meta?.phone === 'string' && meta.phone.trim()
      ? meta.phone.trim()
      : null;
  const displayName =
    typeof meta?.full_name === 'string' && meta.full_name.trim()
      ? meta.full_name.trim()
      : null;

  const { error } = await client.from('users').upsert(
    {
      id: userId,
      email,
      phone,
      display_name: displayName,
    },
    { onConflict: 'id' }
  );

  if (error) {
    console.error('finalizePendingRegistration:users', error);
  }

  clearAllPendingRegistration();
  return { ok: true, dashboard: 'home' };
}

export async function precheckWaiterSignupEmail(
  _client: SupabaseClient,
  _email: string
): Promise<{ ok: true } | { ok: false; message: string }> {
  return { ok: true };
}
