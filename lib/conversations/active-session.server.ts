import type { SupabaseClient } from '@supabase/supabase-js';
import type { ConversationMember } from '@/lib/model/types';
import { fetchConversationById } from '@/lib/model/conversations-table.repository';

export type ActiveMemberSession = {
  member: ConversationMember;
  conversationId: string;
  memberId: string;
  inviteCode: string;
  isOwner: boolean;
  deviceId: string | null;
};

export class ActiveSessionConflictError extends Error {
  readonly code = 'ACTIVE_SESSION_EXISTS' as const;
  readonly session: {
    conversationId: string;
    memberId: string;
    inviteCode: string;
    isOwner: boolean;
    deviceId: string | null;
  };

  constructor(
    message: string,
    session: ActiveSessionConflictError['session']
  ) {
    super(message);
    this.name = 'ActiveSessionConflictError';
    this.session = session;
  }
}

const ACTIVE_SESSION_MESSAGE =
  'Ya tienes una sesión de chat activa. Sal de la conversación en tu otro dispositivo antes de iniciar otra.';

async function findActiveSessionInRows(
  client: SupabaseClient,
  rows: ConversationMember[],
  exceptConversationId?: string
): Promise<ActiveMemberSession | null> {
  for (const member of rows) {
    if (exceptConversationId && member.conversation_id === exceptConversationId) {
      continue;
    }
    const conv = await fetchConversationById(client, member.conversation_id);
    if (!conv || conv.status !== 'active') continue;

    return {
      member,
      conversationId: conv.id,
      memberId: member.id,
      inviteCode: conv.invite_code,
      isOwner: member.role === 'owner' || conv.owner_member_id === member.id,
      deviceId: member.device_id ?? null,
    };
  }
  return null;
}

export async function fetchActiveSessionForUser(
  client: SupabaseClient,
  userId: string,
  exceptConversationId?: string
): Promise<ActiveMemberSession | null> {
  const { data, error } = await client
    .from('conversation_members')
    .select('*')
    .eq('user_id', userId)
    .is('left_at', null);

  if (error) {
    console.error('fetchActiveSessionForUser', error);
    return null;
  }
  return findActiveSessionInRows(
    client,
    (data as ConversationMember[]) ?? [],
    exceptConversationId
  );
}

export async function fetchActiveSessionForDevice(
  client: SupabaseClient,
  deviceId: string,
  exceptConversationId?: string
): Promise<ActiveMemberSession | null> {
  const { data, error } = await client
    .from('conversation_members')
    .select('*')
    .eq('device_id', deviceId)
    .is('left_at', null);

  if (error) {
    console.error('fetchActiveSessionForDevice', error);
    return null;
  }
  return findActiveSessionInRows(
    client,
    (data as ConversationMember[]) ?? [],
    exceptConversationId
  );
}

export async function findActiveMemberByUserInConversation(
  client: SupabaseClient,
  conversationId: string,
  userId: string
): Promise<ConversationMember | null> {
  const { data, error } = await client
    .from('conversation_members')
    .select('*')
    .eq('conversation_id', conversationId)
    .eq('user_id', userId)
    .is('left_at', null)
    .maybeSingle();

  if (error) {
    console.error('findActiveMemberByUserInConversation', error);
    return null;
  }
  return (data as ConversationMember) ?? null;
}

export async function resolveActiveSession(
  client: SupabaseClient,
  args: { userId?: string | null; deviceId: string }
): Promise<ActiveMemberSession | null> {
  if (args.userId) {
    return fetchActiveSessionForUser(client, args.userId);
  }
  return fetchActiveSessionForDevice(client, args.deviceId);
}

function toConflict(session: ActiveMemberSession): ActiveSessionConflictError {
  return new ActiveSessionConflictError(ACTIVE_SESSION_MESSAGE, {
    conversationId: session.conversationId,
    memberId: session.memberId,
    inviteCode: session.inviteCode,
    isOwner: session.isOwner,
    deviceId: session.deviceId,
  });
}

/** Bloquea crear o unirse a otra conversación si ya hay una sesión activa. */
export async function assertNoActiveSessionElsewhere(
  client: SupabaseClient,
  args: {
    userId?: string | null;
    deviceId: string;
    exceptConversationId?: string;
  }
): Promise<void> {
  const session = args.userId
    ? await fetchActiveSessionForUser(
        client,
        args.userId,
        args.exceptConversationId
      )
    : await fetchActiveSessionForDevice(
        client,
        args.deviceId,
        args.exceptConversationId
      );

  if (session) {
    throw toConflict(session);
  }
}

/** Valida unirse: reconecta mismo dispositivo; bloquea otra sala u otro dispositivo. */
export async function assertCanJoinConversation(
  client: SupabaseClient,
  args: {
    conversationId: string;
    userId?: string | null;
    deviceId: string;
  }
): Promise<ConversationMember | null> {
  const { conversationId, userId, deviceId } = args;

  if (userId) {
    const existingByUser = await findActiveMemberByUserInConversation(
      client,
      conversationId,
      userId
    );
    if (existingByUser) {
      if (existingByUser.device_id !== deviceId) {
        const conv = await fetchConversationById(client, conversationId);
        throw new ActiveSessionConflictError(ACTIVE_SESSION_MESSAGE, {
          conversationId,
          memberId: existingByUser.id,
          inviteCode: conv?.invite_code ?? '',
          isOwner:
            existingByUser.role === 'owner' ||
            conv?.owner_member_id === existingByUser.id,
          deviceId: existingByUser.device_id ?? null,
        });
      }
      return existingByUser;
    }

    const other = await fetchActiveSessionForUser(client, userId, conversationId);
    if (other) throw toConflict(other);
    return null;
  }

  const { data, error } = await client
    .from('conversation_members')
    .select('*')
    .eq('conversation_id', conversationId)
    .eq('device_id', deviceId)
    .is('left_at', null)
    .maybeSingle();

  if (error) {
    console.error('assertCanJoinConversation:device', error);
  } else if (data) {
    return data as ConversationMember;
  }

  const other = await fetchActiveSessionForDevice(client, deviceId, conversationId);
  if (other) throw toConflict(other);
  return null;
}
