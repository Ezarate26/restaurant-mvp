import { fetchUserBilling } from '@/lib/billing/stripe-client';

/** Plan Pro del creador autenticado; anónimos y Free solo ES/EN. */
export async function resolveCreatorAllowAllLanguages(): Promise<boolean> {
  const billing = await fetchUserBilling();
  return billing?.tier === 'pro';
}
