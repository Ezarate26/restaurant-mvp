import type { SupabaseClient } from '@supabase/supabase-js';
import type { MessageTranslation } from './types';

type TranslationInsertRow = {
  message_id: string;
  language: string;
  translated_text: string;
};

export async function insertMessageTranslations(
  client: SupabaseClient,
  rows: TranslationInsertRow[]
): Promise<void> {
  if (rows.length === 0) return;
  const { error } = await client.from('message_translations').insert(rows);
  if (error) {
    console.error('insertMessageTranslations', error);
    throw error;
  }
}

/**
 * Inserta o completa traducciones faltantes sin duplicar.
 * Requiere UNIQUE en DB: (message_id, language).
 */
export async function upsertMessageTranslations(
  client: SupabaseClient,
  rows: TranslationInsertRow[]
): Promise<void> {
  if (rows.length === 0) return;
  const { error } = await client
    .from('message_translations')
    .upsert(rows, { onConflict: 'message_id,language', ignoreDuplicates: true });
  if (error) {
    console.error('upsertMessageTranslations', error);
    throw error;
  }
}

export function normalizeMessageTranslationRow(
  raw: Record<string, unknown>
): MessageTranslation {
  return raw as unknown as MessageTranslation;
}

