import type { SupabaseClient } from '@supabase/supabase-js';
import { normalizeLanguageCode } from '@/constants/languages';

export interface VoiceTtsCacheRow {
  id: string;
  text_content: string;
  language_code: string;
  audio_url: string;
  created_at?: string | null;
}

export async function fetchVoiceTtsFromCache(
  client: SupabaseClient,
  textContent: string,
  languageCode: string
): Promise<string | null> {
  const text = textContent.trim();
  const lang = normalizeLanguageCode(languageCode);
  if (!text || !lang) return null;

  const { data, error } = await client
    .from('voice_tts_cache')
    .select('audio_url')
    .eq('text_content', text)
    .eq('language_code', lang)
    .maybeSingle();

  if (error) {
    console.error('fetchVoiceTtsFromCache', error);
    return null;
  }
  return (data?.audio_url as string | undefined)?.trim() || null;
}

export async function invokeGenerateVoiceTts(
  client: SupabaseClient,
  args: { text: string; language_code: string }
): Promise<string | null> {
  const text = args.text.trim();
  const language_code = normalizeLanguageCode(args.language_code);
  if (!text) return null;

  const { data, error } = await client.functions.invoke('generate-voice-tts', {
    body: { text, language_code },
  });

  if (error) {
    console.error('invokeGenerateVoiceTts', error);
    return null;
  }

  if (data && typeof data === 'object' && data !== null && 'audio_url' in data) {
    const url = (data as { audio_url?: string }).audio_url?.trim();
    return url || null;
  }
  return null;
}

export async function resolveVoiceTtsAudioUrl(
  client: SupabaseClient,
  textContent: string,
  languageCode: string
): Promise<string | null> {
  const cached = await fetchVoiceTtsFromCache(client, textContent, languageCode);
  if (cached) return cached;
  return invokeGenerateVoiceTts(client, {
    text: textContent,
    language_code: languageCode,
  });
}
