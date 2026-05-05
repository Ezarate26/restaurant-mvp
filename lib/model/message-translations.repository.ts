import type { SupabaseClient } from '@supabase/supabase-js';
import { normalizeLanguageCode } from '@/constants/languages';
import { mockTranslate } from '@/features/translation/translation.service';
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

/**
 * Idempotente: lee **todos** los mensajes traducibles de la sesión desde la BD y completa
 * `message_translations` para los idiomas dados (sin confiar en estado React ni en cuándo
 * se insertó el mensaje).
 */
export async function ensureTranslationsForSession(
  client: SupabaseClient,
  sessionId: string,
  languages: string[] | null | undefined
): Promise<void> {
  const sid = sessionId.trim();
  if (!sid || !languages?.length) return;

  const langs = [
    ...new Set(
      languages
        .filter((l): l is string => typeof l === 'string' && Boolean(l.trim()))
        .map((l) => normalizeLanguageCode(l))
    ),
  ];
  if (!langs.length) return;

  const { data: messageRows, error: msgErr } = await client
    .from('messages')
    .select('id, text, original_language')
    .eq('session_id', sid);

  if (msgErr) {
    console.error('ensureTranslationsForSession:messages', msgErr);
    throw msgErr;
  }

  const rows = messageRows ?? [];
  const ids = rows.map((r) => r.id).filter((id): id is string => Boolean(id));
  if (!ids.length) return;

  const { data: existingRows, error: exErr } = await client
    .from('message_translations')
    .select('message_id, language')
    .in('message_id', ids);

  if (exErr) {
    console.error('ensureTranslationsForSession:existing', exErr);
    throw exErr;
  }

  const existingSet = new Set(
    (existingRows ?? []).map(
      (e) =>
        `${e.message_id}-${normalizeLanguageCode(e.language as string | null | undefined)}`
    )
  );

  const missing: TranslationInsertRow[] = [];

  for (const msg of rows) {
    const mid = msg.id as string;
    const body = (msg.text ?? '').trim();
    const olRaw = msg.original_language as string | null | undefined;
    if (!mid || !body || !olRaw?.trim()) continue;

    const orig = normalizeLanguageCode(olRaw);

    for (const lang of langs) {
      if (lang === orig) continue;

      const key = `${mid}-${lang}`;
      if (existingSet.has(key)) continue;

      missing.push({
        message_id: mid,
        language: lang,
        translated_text: mockTranslate(body, orig, lang),
      });
    }
  }

  if (!missing.length) return;

  const CHUNK = 500;
  for (let i = 0; i < missing.length; i += CHUNK) {
    await upsertMessageTranslations(client, missing.slice(i, i + CHUNK));
  }
}

