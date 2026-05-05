import type { SupabaseClient } from '@supabase/supabase-js';
import { normalizeLanguageCode } from '@/constants/languages';
import type { Message, MessageSender } from './types';
import { normalizeMessageTranslationRow } from './message-translations.repository';

function normalizeMessageRow(raw: Record<string, unknown>): Message {
  const nested = raw.session_users as
    | Message['session_users']
    | undefined;
  let session_users: Message['session_users'] = null;
  if (Array.isArray(nested)) {
    session_users = nested[0] ?? null;
  } else if (nested && typeof nested === 'object') {
    session_users = nested;
  }
  const nestedTranslations = (raw as { message_translations?: unknown })
    .message_translations;
  const translations = Array.isArray(nestedTranslations)
    ? (nestedTranslations as Record<string, unknown>[]).map(
        normalizeMessageTranslationRow
      )
    : null;
  const { message_translations: _skip, ...rest } = raw as Record<string, unknown> & {
    message_translations?: unknown;
  };
  return { ...(rest as unknown as Message), session_users, translations };
}

export async function fetchMessagesBySession(
  client: SupabaseClient,
  sessionId: string
): Promise<Message[]> {
  const { data, error } = await client
    .from('messages')
    .select(
      `
      *,
      session_users ( user_identifier, display_name, username, email )
      ,
      message_translations ( id, message_id, language, translated_text, created_at )
    `
    )
    .eq('session_id', sessionId)
    .order('created_at', { ascending: true });

  if (error) {
    console.error('fetchMessagesBySession', error);
    return [];
  }
  const rows = (data as Record<string, unknown>[]) ?? [];
  return rows.map(normalizeMessageRow);
}

export async function insertMessage(
  client: SupabaseClient,
  row: {
    session_id: string;
    restaurant_id: string;
    sender: MessageSender;
    text: string;
    session_user_id?: string | null;
    user_identifier?: string | null;
    /** Solo mensajes `customer` | `waiter`: idiomas ISO cortos normalizados. */
    original_language?: string | null;
  }
): Promise<Message> {
  const translatable =
    row.sender === 'customer' || row.sender === 'waiter';
  const original_language =
    translatable && row.text.trim()
      ? normalizeLanguageCode(row.original_language)
      : null;

  const { data, error } = await client
    .from('messages')
    .insert([
      {
        session_id: row.session_id,
        restaurant_id: row.restaurant_id,
        sender: row.sender,
        text: row.text,
        session_user_id: row.session_user_id ?? null,
        user_identifier: row.user_identifier ?? null,
        original_language,
        // legacy fields: mantener null; el nuevo flujo usa `message_translations`
        translated_text: null,
        translated_language: null,
      },
    ])
    .select(
      `
      *,
      session_users ( user_identifier, display_name, username, email )
    `
    )
    .single();

  if (error || !data) {
    console.error('insertMessage', error);
    throw error ?? new Error('insertMessage: no data');
  }
  return normalizeMessageRow(data as Record<string, unknown>);
}
