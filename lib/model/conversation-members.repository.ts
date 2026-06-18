import type { SupabaseClient } from '@supabase/supabase-js';
import { normalizeLanguageCode } from '@/constants/languages';
import { formatSupabaseError } from '@/lib/utils/supabase-errors';
import type { ConversationMember, MemberRole } from './types';
import {
  createConversationRecord,
  fetchConversationById,
  setConversationOwner,
} from './conversations-table.repository';
import { createConversationInvite } from './conversation-invites.repository';
import { assertCanJoinConversation } from '@/lib/conversations/active-session.server';

export async function insertConversationMember(
  client: SupabaseClient,
  args: {
    conversationId: string;
    deviceId: string;
    displayName?: string | null;
    preferredLanguage: string;
    role: MemberRole;
    userId?: string | null;
  }
): Promise<ConversationMember> {
  const { data, error } = await client
    .from('conversation_members')
    .insert([
      {
        conversation_id: args.conversationId,
        device_id: args.deviceId,
        display_name: args.displayName?.trim() || null,
        preferred_language: normalizeLanguageCode(args.preferredLanguage),
        role: args.role,
        user_id: args.userId ?? null,
      },
    ])
    .select('*')
    .single();

  if (error || !data) {
    console.error('insertConversationMember', error);
    throw formatSupabaseError(error, 'No se pudo crear el participante');
  }
  return data as ConversationMember;
}

export async function fetchMemberById(
  client: SupabaseClient,
  memberId: string
): Promise<ConversationMember | null> {
  const { data, error } = await client
    .from('conversation_members')
    .select('*')
    .eq('id', memberId)
    .maybeSingle();

  if (error) {
    console.error('fetchMemberById', error);
    return null;
  }
  return (data as ConversationMember) ?? null;
}

export async function fetchActiveMembersByConversation(
  client: SupabaseClient,
  conversationId: string
): Promise<ConversationMember[]> {
  const { data, error } = await client
    .from('conversation_members')
    .select('*')
    .eq('conversation_id', conversationId)
    .is('left_at', null)
    .order('joined_at', { ascending: true });

  if (error) {
    console.error('fetchActiveMembersByConversation', error);
    return [];
  }
  return (data as ConversationMember[]) ?? [];
}

export async function findActiveMemberByDevice(
  client: SupabaseClient,
  conversationId: string,
  deviceId: string
): Promise<ConversationMember | null> {
  const { data, error } = await client
    .from('conversation_members')
    .select('*')
    .eq('conversation_id', conversationId)
    .eq('device_id', deviceId)
    .is('left_at', null)
    .maybeSingle();

  if (error) {
    console.error('findActiveMemberByDevice', error);
    return null;
  }
  return (data as ConversationMember) ?? null;
}

export async function updateMemberLanguage(
  client: SupabaseClient,
  memberId: string,
  language: string
): Promise<ConversationMember> {
  const { data, error } = await client
    .from('conversation_members')
    .update({ preferred_language: normalizeLanguageCode(language) })
    .eq('id', memberId)
    .select('*')
    .single();

  if (error || !data) {
    console.error('updateMemberLanguage', error);
    throw formatSupabaseError(error, 'No se pudo actualizar el idioma');
  }
  return data as ConversationMember;
}

export async function markMemberLeft(
  client: SupabaseClient,
  memberId: string
): Promise<void> {
  const { error } = await client
    .from('conversation_members')
    .update({ left_at: new Date().toISOString() })
    .eq('id', memberId)
    .is('left_at', null);

  if (error) {
    console.error('markMemberLeft', error);
    throw formatSupabaseError(error, 'No se pudo abandonar la conversación');
  }
}

/** Solo el owner puede expulsar a otro participante (no a sí mismo ni al owner). */
export async function expelMemberByOwner(
  client: SupabaseClient,
  args: {
    conversationId: string;
    actorMemberId: string;
    targetMemberId: string;
  }
): Promise<void> {
  const [conversation, actor, target] = await Promise.all([
    fetchConversationById(client, args.conversationId),
    fetchMemberById(client, args.actorMemberId),
    fetchMemberById(client, args.targetMemberId),
  ]);

  if (!conversation || conversation.status !== 'active') {
    throw new Error('La conversación no está activa');
  }

  const actorIsOwner =
    actor?.role === 'owner' ||
    conversation.owner_member_id === actor?.id;
  if (!actorIsOwner) {
    throw new Error('Solo el propietario puede expulsar participantes');
  }

  if (!target || target.conversation_id !== args.conversationId) {
    throw new Error('Participante no válido');
  }
  if (target.left_at) return;
  if (target.id === actor?.id) {
    throw new Error('Para salir tú mismo, usa el botón Salir');
  }
  if (
    target.role === 'owner' ||
    conversation.owner_member_id === target.id
  ) {
    throw new Error('No se puede expulsar al propietario');
  }

  await markMemberLeft(client, target.id);
}

export async function markAllMembersLeft(
  client: SupabaseClient,
  conversationId: string
): Promise<void> {
  const now = new Date().toISOString();
  const { error } = await client
    .from('conversation_members')
    .update({ left_at: now })
    .eq('conversation_id', conversationId)
    .is('left_at', null);

  if (error) {
    console.error('markAllMembersLeft', error);
    throw formatSupabaseError(error, 'No se pudo cerrar la conversación');
  }
}

/**
 * Crear conversación + owner + invite.
 */
export async function bootstrapConversationWithOwner(
  client: SupabaseClient,
  args: {
    deviceId: string;
    displayName?: string | null;
    preferredLanguage: string;
    userId?: string | null;
  }
): Promise<{
  conversationId: string;
  memberId: string;
  inviteCode: string;
  member: ConversationMember;
}> {
  const conversation = await createConversationRecord(client, {
    title: args.displayName,
  });

  const member = await insertConversationMember(client, {
    conversationId: conversation.id,
    deviceId: args.deviceId,
    displayName: args.displayName,
    preferredLanguage: args.preferredLanguage,
    role: 'owner',
    userId: args.userId,
  });

  await setConversationOwner(client, conversation.id, member.id);
  await createConversationInvite(client, conversation.id, conversation.invite_code);

  return {
    conversationId: conversation.id,
    memberId: member.id,
    inviteCode: conversation.invite_code,
    member,
  };
}

export async function joinConversationAsMember(
  client: SupabaseClient,
  args: {
    conversationId: string;
    deviceId: string;
    displayName?: string | null;
    preferredLanguage: string;
    userId?: string | null;
  }
): Promise<ConversationMember> {
  const conversation = await fetchConversationById(client, args.conversationId);
  if (!conversation || conversation.status !== 'active') {
    throw new Error('La conversación no está activa');
  }

  const existingByPolicy = await assertCanJoinConversation(client, {
    conversationId: args.conversationId,
    userId: args.userId,
    deviceId: args.deviceId,
  });
  if (existingByPolicy) return existingByPolicy;

  return insertConversationMember(client, {
    conversationId: args.conversationId,
    deviceId: args.deviceId,
    displayName: args.displayName,
    preferredLanguage: args.preferredLanguage,
    role: 'member',
    userId: args.userId,
  });
}
