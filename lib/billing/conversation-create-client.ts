import { supabase } from '@/lib/supabase';
import type { FreeCreateEligibility } from '@/lib/billing/free-daily-limit.server';

type CanCreateResponse = FreeCreateEligibility & {
  allowed?: boolean;
  error?: string;
};

async function authHeaders(): Promise<HeadersInit> {
  const { data } = await supabase.auth.getSession();
  const token = data.session?.access_token;
  const headers: HeadersInit = { 'Content-Type': 'application/json' };
  if (token) headers.Authorization = `Bearer ${token}`;
  return headers;
}

export async function fetchFreeCreateEligibility(
  deviceId: string
): Promise<CanCreateResponse> {
  const qs = new URLSearchParams({ deviceId });
  const res = await fetch(`/api/conversations/can-create?${qs.toString()}`, {
    headers: await authHeaders(),
    cache: 'no-store',
  });
  const data = (await res.json()) as CanCreateResponse;
  if (!res.ok) {
    throw new Error(data.error ?? 'No se pudo consultar el límite diario');
  }
  return data;
}

export async function assertCanCreateConversationClient(
  deviceId: string
): Promise<void> {
  const res = await fetch('/api/conversations/can-create', {
    method: 'POST',
    headers: await authHeaders(),
    body: JSON.stringify({ deviceId }),
  });
  const data = (await res.json()) as CanCreateResponse;
  if (!res.ok) {
    throw new Error(
      data.message ||
        data.error ||
        'No puedes crear más conversaciones en este período de 24 horas'
    );
  }
  if (data.allowed === false) {
    throw new Error(
      data.message ||
        'No puedes crear más conversaciones en este período de 24 horas'
    );
  }
}
