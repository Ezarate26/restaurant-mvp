import type { SupabaseClient } from '@supabase/supabase-js';
import { normalizeLanguageCode } from '@/constants/languages';
import { formatSupabaseError } from '@/lib/utils/supabase-errors';
import type { VoiceMessage } from './types';

export const VOICE_STORAGE_BUCKET = 'voice-messages';

export async function insertVoiceMessage(
  client: SupabaseClient,
  row: {
    message_id: string;
    audio_url: string;
    original_language?: string | null;
    duration_seconds?: number | null;
  }
): Promise<VoiceMessage> {
  const { data, error } = await client
    .from('voice_messages')
    .insert([
      {
        message_id: row.message_id,
        audio_url: row.audio_url,
        original_language: normalizeLanguageCode(row.original_language ?? 'es'),
        duration_seconds: row.duration_seconds ?? null,
        processing_status: 'pending',
        transcription_status: 'pending',
      },
    ])
    .select('*')
    .single();

  if (error || !data) {
    console.error('insertVoiceMessage', error);
    throw formatSupabaseError(error, 'No se pudo registrar el audio');
  }
  return data as VoiceMessage;
}

export async function fetchVoiceMessageByMessageId(
  client: SupabaseClient,
  messageId: string
): Promise<VoiceMessage | null> {
  const { data, error } = await client
    .from('voice_messages')
    .select('*')
    .eq('message_id', messageId)
    .maybeSingle();

  if (error) {
    console.error('fetchVoiceMessageByMessageId', error);
    return null;
  }
  return (data as VoiceMessage) ?? null;
}

export async function invokeProcessVoiceMessage(
  client: SupabaseClient,
  messageId: string
): Promise<void> {
  const { error } = await client.functions.invoke('process-voice-message', {
    body: { message_id: messageId },
  });
  if (error) {
    console.error('invokeProcessVoiceMessage', error);
    throw new Error('No se pudo procesar el audio');
  }
}
