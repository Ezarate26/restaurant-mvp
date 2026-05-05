import type { SupabaseClient, User } from '@supabase/supabase-js';
import { fetchProfileByUserId } from '@/lib/model/profiles.repository';
import type { Profile } from '@/lib/model/types';

export type DashboardGateResult = {
  user: User | null;
  profile: Profile | null;
  redirectTo: string | null;
};

export async function resolveDashboardGate(
  client: SupabaseClient,
  dashboard: 'owner' | 'waiter'
): Promise<DashboardGateResult> {
  const { data: auth } = await client.auth.getUser();
  const user = auth.user ?? null;
  if (!user) return { user: null, profile: null, redirectTo: '/login' };

  const profile = await fetchProfileByUserId(client, user.id);
  if (!profile?.restaurant_id) {
    return { user, profile: null, redirectTo: '/login' };
  }

  if (dashboard === 'owner' && profile.role !== 'owner') {
    return { user, profile, redirectTo: '/waiter' };
  }
  if (dashboard === 'waiter' && profile.role === 'owner') {
    return { user, profile, redirectTo: '/owner' };
  }
  return { user, profile, redirectTo: null };
}

export async function signOutAndRedirect(
  client: SupabaseClient,
  redirect: (path: string) => void
): Promise<void> {
  await client.auth.signOut();
  redirect('/login');
}

