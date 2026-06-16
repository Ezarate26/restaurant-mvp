import type { SupabaseClient } from '@supabase/supabase-js';
import { clearAllPendingRegistration } from '@/lib/auth/pending-registration.storage';

export type FinalizePendingResult =
  | { ok: true; dashboard: 'home' }
  | { ok: false; message: string };

export async function finalizePendingRegistration(
  _client: SupabaseClient,
  _userId: string,
  _email: string
): Promise<FinalizePendingResult> {
  clearAllPendingRegistration();
  return { ok: true, dashboard: 'home' };
}

export async function precheckWaiterSignupEmail(
  _client: SupabaseClient,
  _email: string
): Promise<{ ok: true } | { ok: false; message: string }> {
  return { ok: true };
}
