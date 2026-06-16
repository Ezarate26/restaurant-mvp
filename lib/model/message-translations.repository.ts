import type { SupabaseClient } from '@supabase/supabase-js';
import { normalizeLanguageCode } from '@/constants/languages';
import { fetchActiveConversationLanguages } from '@/lib/model/conversation-languages.repository';
import { translateWithCache } from '@/lib/model/translation-cache.repository';
import type { Message, MessageTranslation } from './types';

type TranslationInsertRow = {
  message_id: string;
  language_code: string;
  translated_content: string;
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

export async function upsertMessageTranslations(
  client: SupabaseClient,
  rows: TranslationInsertRow[]
): Promise<void> {
  if (rows.length === 0) return;
  const { error } = await client
    .from('message_translations')
    .upsert(rows, {
      onConflict: 'message_id,language_code',
      ignoreDuplicates: true,
    });
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

export async function ensureTranslationsForNewMessage(
  client: SupabaseClient,
  conversationId: string,
  message: Pick<Message, 'id' | 'content' | 'original_language' | 'message_type'>
): Promise<void> {
  const cid = conversationId.trim();
  if (!cid || !message.id) return;
  if (message.message_type !== 'text' && message.message_type !== 'audio') return;

  const body = (message.content ?? '').trim();
  const olRaw = message.original_language?.trim();
  if (!body || !olRaw) return;

  const orig = normalizeLanguageCode(olRaw);
  const activeLangs = await fetchActiveConversationLanguages(client, cid);
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
    .select('language_code')
    .eq('message_id', message.id);

  if (exErr) {
    console.error('ensureTranslationsForNewMessage:existing', exErr);
    throw exErr;
  }

  const have = new Set(
    (existingRows ?? []).map((r) =>
      normalizeLanguageCode(r.language_code as string | null | undefined)
    )
  );

  const pendingLangs = targets.filter((l) => !have.has(l));
  if (!pendingLangs.length) return;

  const rows: TranslationInsertRow[] = await Promise.all(
    pendingLangs.map(async (lang) => ({
      message_id: message.id,
      language_code: lang,
      translated_content: await translateWithCache(client, body, orig, lang),
    }))
  );

  await upsertMessageTranslations(client, rows);

  await client
    .from('messages')
    .update({ translation_status: 'completed' })
    .eq('id', message.id);
}

export async function ensureViewerMissingTranslations(
  client: SupabaseClient,
  conversationId: string,
  viewerLanguage: string | null | undefined
): Promise<void> {
  const cid = conversationId.trim();
  const raw = (viewerLanguage ?? '').trim();
  if (!cid || !raw) return;

  const viewerLang = normalizeLanguageCode(raw);

  const { data: messageRows, error: msgErr } = await client
    .from('messages')
    .select('id, content, original_language, message_type')
    .eq('conversation_id', cid)
    .is('deleted_at', null);

  if (msgErr) {
    console.error('ensureViewerMissingTranslations:messages', msgErr);
    throw msgErr;
  }

  const candidates = (messageRows ?? []).filter((r) => {
    if (r.message_type !== 'text' && r.message_type !== 'audio') return false;
    const t = (r.content as string | null | undefined)?.trim();
    const ol = (r.original_language as string | null | undefined)?.trim();
    return Boolean(t && ol);
  });

  const ids: string[] = [];
  const meta = new Map<string, { body: string; orig: string }>();

  for (const r of candidates) {
    const mid = r.id as string;
    const body = (r.content as string).trim();
    const orig = normalizeLanguageCode(r.original_language as string);
    if (orig === viewerLang) continue;
    ids.push(mid);
    meta.set(mid, { body, orig });
  }

  if (!ids.length) return;

  const { data: existingTr, error: trErr } = await client
    .from('message_translations')
    .select('message_id')
    .eq('language_code', viewerLang)
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
        language_code: viewerLang,
        translated_content: await translateWithCache(
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
