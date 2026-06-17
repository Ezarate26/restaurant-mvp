import { Injectable, InternalServerErrorException, Logger } from '@nestjs/common';
import { SupabaseService } from '../supabase/supabase.service';
import { normalizeLanguageCode } from '../common/utils/language.util';
import type { VoiceMessage } from '../common/domain.types';

export const VOICE_STORAGE_BUCKET = 'voice-messages';

@Injectable()
export class VoiceRepository {
  private readonly logger = new Logger(VoiceRepository.name);

  constructor(private readonly supabase: SupabaseService) {}

  private get db() {
    return this.supabase.serviceRole();
  }

  async insertVoiceMessage(row: {
    message_id: string;
    audio_url: string;
    original_language?: string | null;
    duration_seconds?: number | null;
  }): Promise<VoiceMessage> {
    const { data, error } = await this.db
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
      throw new InternalServerErrorException('No se pudo registrar el audio');
    }
    return data as VoiceMessage;
  }

  async fetchVoiceMessageByMessageId(
    messageId: string
  ): Promise<VoiceMessage | null> {
    const { data, error } = await this.db
      .from('voice_messages')
      .select('*')
      .eq('message_id', messageId)
      .maybeSingle();
    if (error) return null;
    return (data as VoiceMessage) ?? null;
  }

  async invokeProcessVoiceMessage(messageId: string): Promise<void> {
    const { error } = await this.db.functions.invoke('process-voice-message', {
      body: { message_id: messageId },
    });
    if (error) {
      this.logger.error(`invokeProcessVoiceMessage: ${error.message}`);
      throw new InternalServerErrorException('No se pudo procesar el audio');
    }
  }

  async fetchVoiceTtsFromCache(
    textContent: string,
    languageCode: string
  ): Promise<string | null> {
    const text = textContent.trim();
    const lang = normalizeLanguageCode(languageCode);
    if (!text || !lang) return null;

    const { data, error } = await this.db
      .from('voice_tts_cache')
      .select('audio_url')
      .eq('text_content', text)
      .eq('language_code', lang)
      .maybeSingle();
    if (error) return null;
    return (data?.audio_url as string | undefined)?.trim() || null;
  }

  async invokeGenerateVoiceTts(args: {
    text: string;
    language_code: string;
  }): Promise<string | null> {
    const text = args.text.trim();
    const language_code = normalizeLanguageCode(args.language_code);
    if (!text) return null;

    const { data, error } = await this.db.functions.invoke('generate-voice-tts', {
      body: { text, language_code },
    });
    if (error) {
      this.logger.error(`invokeGenerateVoiceTts: ${error.message}`);
      return null;
    }

    if (data && typeof data === 'object' && data !== null && 'audio_url' in data) {
      return (data as { audio_url?: string }).audio_url?.trim() || null;
    }
    return null;
  }
}
