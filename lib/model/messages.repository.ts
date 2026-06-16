import type { SupabaseClient } from '@supabase/supabase-js';
import { normalizeLanguageCode } from '@/constants/languages';
import type { Message, MessageTranslation } from './types';
import { normalizeMessageTranslationRow } from './message-translations.repository';

function normalizeMessageRow(raw: Record<string, unknown>): Message {
  const nested = raw.conversation_members as Message['conversation_members'];
  let conversation_members: Message['conversation_members'] = null;
  if (Array.isArray(nested)) {
    conversation_members = nested[0] ?? null;
  } else if (nested && typeof nested === 'object') {
    conversation_members = nested;
  }

  const nestedTranslations = (raw as { message_translations?: unknown })
    .message_translations;
  const translations = Array.isArray(nestedTranslations)
    ? (nestedTranslations as Record<string, unknown>[]).map(
        normalizeMessageTranslationRow
      )
    : null;

  const nestedVoice = (raw as { voice_messages?: unknown }).voice_messages;
  let voice_message: Message['voice_message'] = null;
  if (Array.isArray(nestedVoice)) {
    voice_message = (nestedVoice[0] as Message['voice_message']) ?? null;
  } else if (nestedVoice && typeof nestedVoice === 'object') {
    voice_message = nestedVoice as Message['voice_message'];
  }

  const { message_translations: _skip, voice_messages: _skipVoice, ...rest } =
    raw as Record<string, unknown> & {
      message_translations?: unknown;
      voice_messages?: unknown;
    };

  return {
    ...(rest as unknown as Message),
    conversation_members,
    translations,
    voice_message,
  };
}

export async function fetchMessagesByConversation(
  client: SupabaseClient,
  conversationId: string
): Promise<Message[]> {
  const { data, error } = await client
    .from('messages')
    .select(
      `
      *,
      conversation_members ( display_name, preferred_language ),
      message_translations ( id, message_id, language_code, translated_content, created_at ),
      voice_messages ( id, message_id, audio_url, original_language, duration_seconds, transcription, processing_status, transcription_status, transcription_completed_at, created_at )
    `
    )
    .eq('conversation_id', conversationId)
    .is('deleted_at', null)
    .order('created_at', { ascending: true });

  if (error) {
    console.error('fetchMessagesByConversation', error);
    return [];
  }
  return ((data as Record<string, unknown>[]) ?? []).map(normalizeMessageRow);
}

export async function insertMessage(
  client: SupabaseClient,
  row: {
    conversation_id: string;
    member_id: string;
    content: string | null;
    original_language?: string | null;
    message_type?: string;
  }
): Promise<Message> {
  const original_language = normalizeLanguageCode(
    row.original_language ?? 'es'
  );
  const message_type = row.message_type ?? 'text';

  const { data, error } = await client
    .from('messages')
    .insert([
      {
        conversation_id: row.conversation_id,
        member_id: row.member_id,
        content: row.content,
        original_language,
        message_type,
        translation_status:
          message_type === 'audio' && !row.content?.trim()
            ? 'processing'
            : 'pending',
      },
    ])
    .select(
      `
      *,
      conversation_members ( display_name, preferred_language )
    `
    )
    .single();

  if (error || !data) {
    console.error('insertMessage', error);
    throw error ?? new Error('insertMessage: no data');
  }
  return normalizeMessageRow(data as Record<string, unknown>);
}

/** @deprecated alias */
export const fetchMessagesBySession = fetchMessagesByConversation;
