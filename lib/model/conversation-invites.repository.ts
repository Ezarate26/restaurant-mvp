import type { SupabaseClient } from '@supabase/supabase-js';
import { formatSupabaseError } from '@/lib/utils/supabase-errors';
import type { ConversationInvite } from './types';

export async function createConversationInvite(
  client: SupabaseClient,
  conversationId: string,
  inviteCode: string
): Promise<ConversationInvite> {
  const { data, error } = await client
    .from('conversation_invites')
    .insert([
      {
        conversation_id: conversationId,
        invite_code: inviteCode,
      },
    ])
    .select('*')
    .single();

  if (error || !data) {
    console.error('createConversationInvite', error);
    throw formatSupabaseError(error, 'No se pudo crear la invitación');
  }
  return data as ConversationInvite;
}

export async function fetchInviteByCode(
  client: SupabaseClient,
  inviteCode: string
): Promise<ConversationInvite | null> {
  const code = inviteCode.trim().toUpperCase();
  const { data, error } = await client
    .from('conversation_invites')
    .select('*')
    .eq('invite_code', code)
    .maybeSingle();

  if (error) {
    console.error('fetchInviteByCode', error);
    return null;
  }
  return (data as ConversationInvite) ?? null;
}
