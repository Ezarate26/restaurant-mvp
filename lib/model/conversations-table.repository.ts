import type { SupabaseClient } from '@supabase/supabase-js';
import {
  formatSupabaseError,
  generateInviteCode,
} from '@/lib/utils/supabase-errors';
import type { Conversation } from './types';

export async function createConversationRecord(
  client: SupabaseClient,
  args?: { title?: string | null }
): Promise<Conversation> {
  const { data, error } = await client
    .from('conversations')
    .insert([
      {
        status: 'active',
        invite_code: generateInviteCode(),
        title: args?.title?.trim() || null,
        conversation_type: 'temporary',
      },
    ])
    .select('*')
    .single();

  if (error || !data) {
    console.error('createConversationRecord', error);
    throw formatSupabaseError(error, 'No se pudo crear la conversación');
  }
  return data as Conversation;
}

export async function setConversationOwner(
  client: SupabaseClient,
  conversationId: string,
  memberId: string
): Promise<void> {
  const { error } = await client
    .from('conversations')
    .update({ owner_member_id: memberId })
    .eq('id', conversationId);

  if (error) {
    console.error('setConversationOwner', error);
    throw formatSupabaseError(error, 'No se pudo asignar el propietario');
  }
}

export async function fetchConversationById(
  client: SupabaseClient,
  conversationId: string
): Promise<Conversation | null> {
  const { data, error } = await client
    .from('conversations')
    .select('*')
    .eq('id', conversationId)
    .maybeSingle();

  if (error) {
    console.error('fetchConversationById', error);
    return null;
  }
  return (data as Conversation) ?? null;
}

export async function fetchConversationByInviteCode(
  client: SupabaseClient,
  inviteCode: string
): Promise<Conversation | null> {
  const code = inviteCode.trim().toUpperCase();
  if (!code) return null;

  const { data, error } = await client
    .from('conversations')
    .select('*')
    .eq('invite_code', code)
    .eq('status', 'active')
    .maybeSingle();

  if (error) {
    console.error('fetchConversationByInviteCode', error);
    return null;
  }
  return (data as Conversation) ?? null;
}

export async function closeConversationRecord(
  client: SupabaseClient,
  conversationId: string,
  closedByMemberId?: string | null
): Promise<void> {
  const { error } = await client
    .from('conversations')
    .update({
      status: 'closed',
      closed_at: new Date().toISOString(),
      closed_by_member_id: closedByMemberId ?? null,
    })
    .eq('id', conversationId);

  if (error) {
    console.error('closeConversationRecord', error);
    throw formatSupabaseError(error, 'No se pudo cerrar la conversación');
  }
}
