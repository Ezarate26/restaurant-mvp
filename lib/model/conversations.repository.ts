import {
  createConversationViaApi,
  joinConversationViaApi,
  type CreateConversationResponse,
} from '@/lib/billing/conversation-create-client';
import type { ConversationMember } from './types';

export interface CreateConversationPayload {
  display_name?: string | null;
  preferred_language: string;
  device_id: string;
}

export type { CreateConversationResponse };

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
  const deviceId = payload.device_id?.trim();
  if (!deviceId) {
    throw new Error(
      'No se pudo identificar tu dispositivo. Activa el almacenamiento local del navegador.'
    );
  }

  const displayName =
    payload.display_name == null
      ? null
      : payload.display_name.trim() || null;

  if (payload.display_name != null && !displayName) {
    throw new Error('Ingresa tu nombre visible para unirte a la conversación.');
  }

  return joinConversationViaApi({
    invite_code: payload.invite_code,
    device_id: deviceId,
    display_name: displayName,
    preferred_language: payload.preferred_language,
  });
}
