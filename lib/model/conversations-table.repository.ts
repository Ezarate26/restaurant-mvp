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

export async function addConversationSessionExtraMs(
  client: SupabaseClient,
  conversationId: string,
  extraMs: number
): Promise<Conversation | null> {
  const current = await fetchConversationById(client, conversationId);
  if (!current) return null;

  const nextExtra =
    (typeof current.session_extra_ms === 'number' ? current.session_extra_ms : 0) +
    extraMs;

  const { data, error } = await client
    .from('conversations')
    .update({ session_extra_ms: nextExtra })
    .eq('id', conversationId)
    .select('*')
    .single();

  if (error || !data) {
    console.error('addConversationSessionExtraMs', error);
    throw formatSupabaseError(error, 'No se pudo extender la sesión');
  }
  return data as Conversation;
}

export async function grantConversationFreeSessionBonus(
  client: SupabaseClient,
  conversationId: string
): Promise<Conversation | null> {
  const current = await fetchConversationById(client, conversationId);
  if (!current || current.session_free_bonus_used) return null;

  const nextExtra =
    (typeof current.session_extra_ms === 'number' ? current.session_extra_ms : 0) +
    10 * 60_000;

  const { data, error } = await client
    .from('conversations')
    .update({
      session_extra_ms: nextExtra,
      session_free_bonus_used: true,
    })
    .eq('id', conversationId)
    .select('*')
    .single();

  if (error || !data) {
    console.error('grantConversationFreeSessionBonus', error);
    throw formatSupabaseError(error, 'No se pudo otorgar tiempo extra');
  }
  return data as Conversation;
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
