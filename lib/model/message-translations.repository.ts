import type { SupabaseClient } from '@supabase/supabase-js';
import { normalizeLanguageCode } from '@/constants/languages';
import { translateMessage } from '@/features/translation/translation.service';
import { fetchActiveSessionLanguages } from '@/lib/model/session-languages.repository';
import type { Message, MessageTranslation } from './types';

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
 * Tras insertar un mensaje: traduce solo a idiomas activos en `session_users`
 * (`is_active`) distintos del idioma original. Idempotente por fila en BD.
 */
export async function ensureTranslationsForNewMessage(
  client: SupabaseClient,
  sessionId: string,
  message: Pick<Message, 'id' | 'text' | 'original_language' | 'sender'>
): Promise<void> {
  const sid = sessionId.trim();
  if (!sid || !message.id) return;
  if (message.sender === 'system') return;

  const body = (message.text ?? '').trim();
  const olRaw = message.original_language?.trim();
  if (!body || !olRaw) return;

  const orig = normalizeLanguageCode(olRaw);
  const activeLangs = await fetchActiveSessionLanguages(client, sid);
  const targets = [
    ...new Set(
      activeLangs
        .map((l) => normalizeLanguageCode(l))
        .filter((l) => l !== orig)
    ),
  ];
  if (!targets.length) return;

  const { data: existingRows, error: exErr } = await client
    .from('message_translations')
    .select('language')
    .eq('message_id', message.id);

  if (exErr) {
    console.error('ensureTranslationsForNewMessage:existing', exErr);
    throw exErr;
  }

  const have = new Set(
    (existingRows ?? []).map((r) =>
      normalizeLanguageCode(r.language as string | null | undefined)
    )
  );

  const pendingLangs = targets.filter((l) => !have.has(l));
  if (!pendingLangs.length) return;

  const rows: TranslationInsertRow[] = await Promise.all(
    pendingLangs.map(async (lang) => ({
      message_id: message.id,
      language: lang,
      translated_text: await translateMessage(client, body, orig, lang),
    }))
  );

  await upsertMessageTranslations(client, rows);
}

/**
 * Para el historial: completa solo la columna del idioma del usuario actual
 * cuando falta fila en `message_translations`. No recorre otros idiomas ni reescribe mensajes.
 */
export async function ensureViewerMissingTranslations(
  client: SupabaseClient,
  sessionId: string,
  viewerLanguage: string | null | undefined
): Promise<void> {
  const sid = sessionId.trim();
  const raw = (viewerLanguage ?? '').trim();
  if (!sid || !raw) return;

  const viewerLang = normalizeLanguageCode(raw);

  const { data: messageRows, error: msgErr } = await client
    .from('messages')
    .select('id, text, original_language, sender')
    .eq('session_id', sid);

  if (msgErr) {
    console.error('ensureViewerMissingTranslations:messages', msgErr);
    throw msgErr;
  }

  const rows = messageRows ?? [];
  const candidates = rows.filter((r) => {
    const sender = r.sender as string | null | undefined;
    if (sender !== 'customer' && sender !== 'waiter') return false;
    const t = (r.text as string | null | undefined)?.trim();
    const ol = (r.original_language as string | null | undefined)?.trim();
    return Boolean(t && ol);
  });

  const ids: string[] = [];
  const meta = new Map<
    string,
    { body: string; orig: string }
  >();

  for (const r of candidates) {
    const mid = r.id as string;
    const body = (r.text as string).trim();
    const orig = normalizeLanguageCode(r.original_language as string);
    if (orig === viewerLang) continue;
    ids.push(mid);
    meta.set(mid, { body, orig });
  }

  if (!ids.length) return;

  const { data: existingTr, error: trErr } = await client
    .from('message_translations')
    .select('message_id')
    .eq('language', viewerLang)
    .in('message_id', ids);

  if (trErr) {
    console.error('ensureViewerMissingTranslations:existing-tr', trErr);
    throw trErr;
  }

  const covered = new Set(
    (existingTr ?? []).map((x) => x.message_id as string)
  );

  const missingIds = ids.filter((id) => !covered.has(id));
  if (!missingIds.length) return;

  const insertRows: TranslationInsertRow[] = await Promise.all(
    missingIds.map(async (message_id) => {
      const m = meta.get(message_id)!;
      return {
        message_id,
        language: viewerLang,
        translated_text: await translateMessage(
          client,
          m.body,
          m.orig,
          viewerLang
        ),
      };
    })
  );

  await upsertMessageTranslations(client, insertRows);
}
