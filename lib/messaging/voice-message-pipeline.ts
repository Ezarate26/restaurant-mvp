import type { SupabaseClient } from '@supabase/supabase-js';
import { normalizeLanguageCode } from '@/constants/languages';
import {
  fetchMessagesByConversation,
  insertMessage,
} from '@/lib/model/messages.repository';
import {
  insertVoiceMessage,
  invokeProcessVoiceMessage,
} from '@/lib/model/voice-messages.repository';
import { uploadVoiceAudio } from '@/lib/storage/voice-audio.storage';
import type { Message } from '@/lib/model/types';

export type VoiceOutboundArgs = {
  conversation_id: string;
  member_id: string;
  blob: Blob;
  mimeType?: string;
  original_language?: string | null;
  duration_seconds?: number | null;
};

export async function insertVoiceMessageAndProcess(
  client: SupabaseClient,
  args: VoiceOutboundArgs
): Promise<{ message: Message; messages: Message[] }> {
  const original = normalizeLanguageCode(args.original_language ?? 'es');

  const inserted = await insertMessage(client, {
    conversation_id: args.conversation_id,
    member_id: args.member_id,
    content: null,
    original_language: original,
    message_type: 'audio',
  });

  const audioUrl = await uploadVoiceAudio(client, {
    conversationId: args.conversation_id,
    messageId: inserted.id,
    blob: args.blob,
    mimeType: args.mimeType,
  });

  await insertVoiceMessage(client, {
    message_id: inserted.id,
    audio_url: audioUrl,
    original_language: original,
    duration_seconds: args.duration_seconds ?? null,
  });

  void invokeProcessVoiceMessage(client, inserted.id).catch((e) => {
    console.error('insertVoiceMessageAndProcess:invoke', e);
  });

  const messages = await fetchMessagesByConversation(
    client,
    args.conversation_id
  );
  const message =
    messages.find((m) => m.id === inserted.id) ?? {
      ...inserted,
      voice_message: {
        id: '',
        message_id: inserted.id,
        audio_url: audioUrl,
        original_language: original,
        duration_seconds: args.duration_seconds ?? null,
        transcription: null,
        processing_status: 'pending',
        transcription_status: 'pending',
      },
    };

  return { message, messages };
}
