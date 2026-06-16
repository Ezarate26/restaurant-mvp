import type { SupabaseClient } from '@supabase/supabase-js';
import { normalizeLanguageCode } from '@/constants/languages';
import { translateMessage } from '@/features/translation/translation.service';

export async function getCachedTranslation(
  client: SupabaseClient,
  sourceText: string,
  sourceLanguage: string,
  targetLanguage: string
): Promise<string | null> {
  const from = normalizeLanguageCode(sourceLanguage);
  const to = normalizeLanguageCode(targetLanguage);
  const text = sourceText.trim();
  if (!text || from === to) return text;

  const { data, error } = await client
    .from('translation_cache')
    .select('translated_text')
    .eq('source_text', text)
    .eq('source_language', from)
    .eq('target_language', to)
    .maybeSingle();

  if (error) {
    console.error('getCachedTranslation', error);
    return null;
  }

  const cached = (data?.translated_text as string | null | undefined)?.trim();
  return cached || null;
}

export async function saveCachedTranslation(
  client: SupabaseClient,
  sourceText: string,
  sourceLanguage: string,
  targetLanguage: string,
  translatedText: string
): Promise<void> {
  const from = normalizeLanguageCode(sourceLanguage);
  const to = normalizeLanguageCode(targetLanguage);
  const text = sourceText.trim();
  if (!text || !translatedText.trim()) return;

  const { error } = await client.from('translation_cache').upsert(
    [
      {
        source_text: text,
        source_language: from,
        target_language: to,
        translated_text: translatedText.trim(),
      },
    ],
    { onConflict: 'source_text,source_language,target_language', ignoreDuplicates: true }
  );

  if (error) {
    console.error('saveCachedTranslation', error);
  }
}

/** Traduce con caché global antes de llamar a la IA. */
export async function translateWithCache(
  client: SupabaseClient,
  text: string,
  from: string,
  to: string
): Promise<string> {
  const cached = await getCachedTranslation(client, text, from, to);
  if (cached) return cached;

  const translated = await translateMessage(client, text, from, to);
  await saveCachedTranslation(client, text, from, to, translated);
  return translated;
}
