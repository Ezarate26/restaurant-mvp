import type { SupabaseClient } from '@supabase/supabase-js';
import { getTranscriptionFallback } from '@/lib/constants/transcription-fallback';
import { ensureTranslationsForNewMessage } from '@/lib/model/message-translations.repository';
import type { VoiceMessage } from '@/lib/model/types';

/** Si la transcripción falló, rellena el mensaje con texto de fallback y dispara traducción. */
export async function applyTranscriptionFallbackIfNeeded(
  client: SupabaseClient,
  conversationId: string,
  messageId: string,
  voiceRow: Pick<VoiceMessage, 'transcription_status' | 'original_language'>
): Promise<boolean> {
  const status = voiceRow.transcription_status?.toLowerCase();
  if (status !== 'failed') return false;

  const { data: msg, error } = await client
    .from('messages')
    .select('id, content, original_language, message_type')
    .eq('id', messageId)
    .maybeSingle();

  if (error || !msg) return false;
  if ((msg.content as string | null)?.trim()) return false;

  const lang =
    voiceRow.original_language ??
    (msg.original_language as string | null) ??
    'es';
  const fallback = getTranscriptionFallback(lang);

  const { error: upErr } = await client
    .from('messages')
    .update({
      content: fallback,
      original_language: lang,
      translation_status: 'pending',
    })
    .eq('id', messageId);

  if (upErr) {
    console.error('applyTranscriptionFallbackIfNeeded:update', upErr);
    return false;
  }

  await ensureTranslationsForNewMessage(client, conversationId, {
    id: messageId,
    content: fallback,
    original_language: lang,
    message_type: (msg.message_type as string) ?? 'audio',
  });

  await client
    .from('messages')
    .update({ translation_status: 'completed' })
    .eq('id', messageId);

  return true;
}

/** Aplica fallback en mensajes de voz con transcripción fallida (p. ej. al cargar el chat). */
export async function applyTranscriptionFallbacksForMessages(
  client: SupabaseClient,
  conversationId: string,
  messages: { id: string; message_type?: string | null; voice_message?: VoiceMessage | null }[]
): Promise<boolean> {
  let changed = false;
  for (const m of messages) {
    if (m.message_type !== 'audio' || !m.voice_message) continue;
    const applied = await applyTranscriptionFallbackIfNeeded(
      client,
      conversationId,
      m.id,
      m.voice_message
    );
    if (applied) changed = true;
  }
  return changed;
}
