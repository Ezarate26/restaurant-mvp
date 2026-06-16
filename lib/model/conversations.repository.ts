import { supabase } from '@/lib/supabase';
import type { ConversationMember } from './types';
import {
  bootstrapConversationWithOwner,
  joinConversationAsMember,
} from './conversation-members.repository';
import { fetchConversationByInviteCode } from './conversations-table.repository';

export interface CreateConversationPayload {
  display_name?: string | null;
  preferred_language: string;
  device_id: string;
}

export interface CreateConversationResponse {
  conversation_id: string;
  member_id: string;
  invite_code: string;
  member: ConversationMember;
}

export interface JoinConversationPayload {
  invite_code: string;
  display_name?: string | null;
  preferred_language: string;
  device_id: string;
}

export async function createConversation(
  payload: CreateConversationPayload
): Promise<CreateConversationResponse> {
  const result = await bootstrapConversationWithOwner(supabase, {
    deviceId: payload.device_id,
    displayName: payload.display_name,
    preferredLanguage: payload.preferred_language,
  });

  return {
    conversation_id: result.conversationId,
    member_id: result.memberId,
    invite_code: result.inviteCode,
    member: result.member,
  };
}

export async function joinConversation(
  payload: JoinConversationPayload
): Promise<CreateConversationResponse> {
  const conversation = await fetchConversationByInviteCode(
    supabase,
    payload.invite_code
  );
  if (!conversation) {
    throw new Error('Código de invitación no válido o conversación cerrada');
  }

  const member = await joinConversationAsMember(supabase, {
    conversationId: conversation.id,
    deviceId: payload.device_id,
    displayName: payload.display_name,
    preferredLanguage: payload.preferred_language,
  });

  return {
    conversation_id: conversation.id,
    member_id: member.id,
    invite_code: conversation.invite_code,
    member,
  };
}
