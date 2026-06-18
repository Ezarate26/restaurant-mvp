import {
  getOrCreateBillingRow,
  resolveEffectiveTier,
} from '@/lib/billing/billing.repository';
import type { SupabaseClient } from '@supabase/supabase-js';

export async function resolveCreatorAllowAllLanguagesServer(
  client: SupabaseClient,
  userId: string | null
): Promise<boolean> {
  if (!userId) return false;
  const billing = await getOrCreateBillingRow(client, userId);
  return resolveEffectiveTier(billing) === 'pro';
}
