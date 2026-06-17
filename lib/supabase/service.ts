import { createClient, type SupabaseClient } from '@supabase/supabase-js';

let serviceClient: SupabaseClient | null = null;

/** Cliente con service role — solo rutas API / webhooks. */
export function createSupabaseServiceRole(): SupabaseClient {
  if (serviceClient) return serviceClient;

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    throw new Error(
      'Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY'
    );
  }

  serviceClient = createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  return serviceClient;
}
