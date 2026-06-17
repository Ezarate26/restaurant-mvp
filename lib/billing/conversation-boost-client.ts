import { supabase } from '@/lib/supabase';

type ProJoinBoostResponse = {
  applied?: boolean;
  sessionExtraMs?: number | null;
  error?: string;
};

async function authHeaders(): Promise<HeadersInit> {
  const { data } = await supabase.auth.getSession();
  const token = data.session?.access_token;
  const headers: HeadersInit = { 'Content-Type': 'application/json' };
  if (token) headers.Authorization = `Bearer ${token}`;
  return headers;
}

export async function requestProJoinRoomBoost(
  conversationId: string
): Promise<ProJoinBoostResponse> {
  const res = await fetch('/api/conversations/pro-join-boost', {
    method: 'POST',
    headers: await authHeaders(),
    body: JSON.stringify({ conversationId }),
  });
  const data = (await res.json()) as ProJoinBoostResponse;
  if (!res.ok) {
    throw new Error(data.error ?? 'No se pudo aplicar el beneficio Pro');
  }
  return data;
}
