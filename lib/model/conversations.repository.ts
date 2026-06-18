import { createConversationViaApi } from '@/lib/billing/conversation-create-client';
import { fetchConversationRoomLimits } from '@/lib/billing/conversation-room-limits-client';
import {
  assertLanguageAllowed,
  clampLanguageToFree,
} from '@/lib/billing/language-access';
import { ensurePublicUserFromSession } from '@/lib/auth/ensure-public-user';
import { supabase } from '@/lib/supabase';
import type { ConversationMember } from './types';
import { requestProJoinRoomBoost } from '@/lib/billing/conversation-boost-client';
import {
  fetchActiveMembersByConversation,
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
  const displayName = payload.display_name?.trim() || null;
  if (!displayName) {
    throw new Error('Ingresa tu nombre visible para iniciar la conversación.');
  }

  const deviceId = payload.device_id?.trim();
  if (!deviceId) {
    throw new Error(
      'No se pudo identificar tu dispositivo. Activa el almacenamiento local del navegador.'
    );
  }

  return createConversationViaApi({
    device_id: deviceId,
    display_name: displayName,
    preferred_language: payload.preferred_language,
  });
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

  const { data: authData } = await supabase.auth.getSession();
  let userId: string | null = null;
  if (authData.session?.user?.id) {
    try {
      userId = await ensurePublicUserFromSession(supabase);
    } catch (e) {
      console.error('joinConversation:ensurePublicUser', e);
      userId = null;
    }
  }

  const limits = await fetchConversationRoomLimits(conversation.id);
  const activeMembers = await fetchActiveMembersByConversation(
    supabase,
    conversation.id
  );
  if (activeMembers.length >= limits.maxParticipants) {
    const msg =
      limits.maxParticipants <= 2
        ? 'Esta sala gratuita admite solo 2 participantes (tú y un invitado). Pro desbloquea hasta 10 invitados.'
        : `Esta sala ya tiene el máximo de ${limits.maxParticipants} participantes.`;
    throw new Error(msg);
  }

  const joinerAllowsAll = limits.allowAllLanguages && Boolean(userId);
  const preferredLanguage = joinerAllowsAll
    ? payload.preferred_language
    : clampLanguageToFree(payload.preferred_language);
  assertLanguageAllowed(preferredLanguage, joinerAllowsAll);

  const member = await joinConversationAsMember(supabase, {
    conversationId: conversation.id,
    deviceId: payload.device_id,
    displayName: payload.display_name,
    preferredLanguage,
    userId,
  });

  if (userId) {
    try {
      await requestProJoinRoomBoost(conversation.id);
    } catch (e) {
      console.error('joinConversation:proJoinBoost', e);
    }
  }

  return {
    conversation_id: conversation.id,
    member_id: member.id,
    invite_code: conversation.invite_code,
    member,
  };
}
