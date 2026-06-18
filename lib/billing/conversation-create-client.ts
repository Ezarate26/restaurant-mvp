import { supabase } from '@/lib/supabase';
import type { ConversationMember } from '@/lib/model/types';
import type { FreeCreateEligibility } from '@/lib/billing/free-daily-limit.server';

export type CreateConversationResponse = {
  conversation_id: string;
  member_id: string;
  invite_code: string;
  member: ConversationMember;
};

export type ActiveSessionPayload = {
  conversationId: string;
  memberId: string;
  inviteCode: string;
  isOwner: boolean;
  deviceId: string | null;
};

export type ActiveSessionApiResponse = {
  active: boolean;
  conversationId?: string;
  memberId?: string;
  inviteCode?: string;
  isOwner?: boolean;
  deviceId?: string | null;
  sameDevice?: boolean;
};

type CanCreateResponse = FreeCreateEligibility & {
  allowed?: boolean;
  error?: string;
};

type CreateApiResponse = CreateConversationResponse & {
  error?: string;
  code?: string;
  activeSession?: ActiveSessionPayload;
};

type JoinApiResponse = CreateConversationResponse & {
  error?: string;
  code?: string;
  activeSession?: ActiveSessionPayload;
};

export class ActiveSessionConflictClientError extends Error {
  readonly code = 'ACTIVE_SESSION_EXISTS' as const;
  readonly activeSession: ActiveSessionPayload;

  constructor(message: string, activeSession: ActiveSessionPayload) {
    super(message);
    this.name = 'ActiveSessionConflictClientError';
    this.activeSession = activeSession;
  }
}

async function authHeaders(): Promise<HeadersInit> {
  const { data } = await supabase.auth.getSession();
  const token = data.session?.access_token;
  const headers: HeadersInit = { 'Content-Type': 'application/json' };
  if (token) headers.Authorization = `Bearer ${token}`;
  return headers;
}

export async function createConversationViaApi(args: {
  device_id: string;
  display_name: string | null;
  preferred_language: string;
}): Promise<CreateConversationResponse> {
  const res = await fetch('/api/conversations/create', {
    method: 'POST',
    headers: await authHeaders(),
    body: JSON.stringify({
      deviceId: args.device_id,
      displayName: args.display_name,
      preferredLanguage: args.preferred_language,
    }),
  });

  const data = (await res.json()) as CreateApiResponse;
  if (!res.ok) {
    if (res.status === 409 && data.code === 'ACTIVE_SESSION_EXISTS' && data.activeSession) {
      throw new ActiveSessionConflictClientError(
        data.error ?? 'Ya tienes una sesión de chat activa',
        data.activeSession
      );
    }
    throw new Error(data.error ?? 'No se pudo crear la conversación');
  }

  return {
    conversation_id: data.conversation_id,
    member_id: data.member_id,
    invite_code: data.invite_code,
    member: data.member,
  };
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

export async function joinConversationViaApi(args: {
  invite_code: string;
  device_id: string;
  display_name: string | null;
  preferred_language: string;
}): Promise<CreateConversationResponse> {
  const res = await fetch('/api/conversations/join', {
    method: 'POST',
    headers: await authHeaders(),
    body: JSON.stringify({
      inviteCode: args.invite_code,
      deviceId: args.device_id,
      displayName: args.display_name,
      preferredLanguage: args.preferred_language,
    }),
  });

  const data = (await res.json()) as JoinApiResponse;
  if (!res.ok) {
    if (res.status === 409 && data.code === 'ACTIVE_SESSION_EXISTS' && data.activeSession) {
      throw new ActiveSessionConflictClientError(
        data.error ?? 'Ya tienes una sesión de chat activa',
        data.activeSession
      );
    }
    throw new Error(data.error ?? 'No se pudo unir a la conversación');
  }

  return {
    conversation_id: data.conversation_id,
    member_id: data.member_id,
    invite_code: data.invite_code,
    member: data.member,
  };
}

export async function fetchServerActiveSession(
  deviceId: string
): Promise<ActiveSessionApiResponse> {
  const qs = new URLSearchParams({ deviceId });
  const res = await fetch(`/api/conversations/active-session?${qs.toString()}`, {
    headers: await authHeaders(),
    cache: 'no-store',
  });
  const data = (await res.json()) as ActiveSessionApiResponse & { error?: string };
  if (!res.ok) {
    throw new Error(data.error ?? 'No se pudo consultar la sesión activa');
  }
  return data;
}
