import { Injectable } from '@nestjs/common';
import { VoiceRepository } from './voice.repository';
import type { VoiceMessage } from '../common/domain.types';

@Injectable()
export class VoiceService {
  constructor(private readonly repo: VoiceRepository) {}

  async registerVoiceMessage(row: {
    message_id: string;
    audio_url: string;
    original_language?: string | null;
    duration_seconds?: number | null;
  }): Promise<VoiceMessage> {
    return this.repo.insertVoiceMessage(row);
  }

  /** Dispara la transcripción (Whisper) vía Edge Function. */
  async processVoiceMessage(messageId: string): Promise<void> {
    await this.repo.invokeProcessVoiceMessage(messageId);
  }

  /** Resuelve TTS con caché antes de invocar la Edge Function. */
  async resolveTtsAudioUrl(
    text: string,
    languageCode: string
  ): Promise<string | null> {
    const cached = await this.repo.fetchVoiceTtsFromCache(text, languageCode);
    if (cached) return cached;
    return this.repo.invokeGenerateVoiceTts({ text, language_code: languageCode });
  }
}
