import { supabase } from '@/lib/supabase';
import type { UserBillingSnapshot } from '@/lib/billing/billing-state';

type CheckoutResponse = { url?: string; error?: string };

async function authHeaders(): Promise<HeadersInit> {
  const { data } = await supabase.auth.getSession();
  const token = data.session?.access_token;
  const headers: HeadersInit = { 'Content-Type': 'application/json' };
  if (token) headers.Authorization = `Bearer ${token}`;
  return headers;
}

async function postStripe(path: string, body: Record<string, unknown> = {}) {
  const res = await fetch(path, {
    method: 'POST',
    headers: await authHeaders(),
    body: JSON.stringify(body),
  });
  const data = (await res.json()) as CheckoutResponse;
  if (!res.ok) {
    throw new Error(data.error ?? 'No se pudo iniciar el pago');
  }
  return data;
}

/** Fuente de verdad — siempre consultar al volver de Stripe */
export async function fetchUserBilling(
  conversationId?: string
): Promise<UserBillingSnapshot | null> {
  const qs = new URLSearchParams();
  if (conversationId) qs.set('conversationId', conversationId);

  const suffix = qs.toString() ? `?${qs.toString()}` : '';
  const res = await fetch(`/api/user/billing${suffix}`, {
    headers: await authHeaders(),
    cache: 'no-store',
  });

  if (!res.ok) return null;
  return res.json() as Promise<UserBillingSnapshot>;
}

/** @deprecated Usar fetchUserBilling */
export async function fetchBillingStatus(conversationId?: string) {
  return fetchUserBilling(conversationId);
}

export async function startProCheckout(returnUrl?: string) {
  const data = await postStripe('/api/stripe/checkout-session', { returnUrl });
  if (data.url) window.location.href = data.url;
  return data;
}

export async function startRoomPassCheckout(
  conversationId: string,
  returnUrl?: string
) {
  const data = await postStripe('/api/stripe/room-session', {
    conversationId,
    returnUrl,
  });
  if (data.url) window.location.href = data.url;
  return data;
}

export async function startHours24PackCheckout(returnUrl?: string) {
  const data = await postStripe('/api/stripe/hours-pack', { returnUrl });
  if (data.url) window.location.href = data.url;
  return data;
}

export async function openBillingPortal(returnUrl?: string) {
  const data = await postStripe('/api/stripe/portal', { returnUrl });
  if (data.url) window.location.href = data.url;
  return data;
}
