import { Injectable, Logger } from '@nestjs/common';
import { SupabaseService } from '../supabase/supabase.service';
import { normalizeLanguageCode } from '../common/utils/language.util';

@Injectable()
export class TranslationRepository {
  private readonly logger = new Logger(TranslationRepository.name);

  constructor(private readonly supabase: SupabaseService) {}

  private get db() {
    return this.supabase.serviceRole();
  }

  async getCachedTranslation(
    sourceText: string,
    sourceLanguage: string,
    targetLanguage: string
  ): Promise<string | null> {
    const from = normalizeLanguageCode(sourceLanguage);
    const to = normalizeLanguageCode(targetLanguage);
    const text = sourceText.trim();
    if (!text || from === to) return text;

    const { data, error } = await this.db
      .from('translation_cache')
      .select('translated_text')
      .eq('source_text', text)
      .eq('source_language', from)
      .eq('target_language', to)
      .maybeSingle();

    if (error) {
      this.logger.error(`getCachedTranslation: ${error.message}`);
      return null;
    }

    const cached = (data?.translated_text as string | null | undefined)?.trim();
    return cached || null;
  }

  async saveCachedTranslation(
    sourceText: string,
    sourceLanguage: string,
    targetLanguage: string,
    translatedText: string
  ): Promise<void> {
    const from = normalizeLanguageCode(sourceLanguage);
    const to = normalizeLanguageCode(targetLanguage);
    const text = sourceText.trim();
    if (!text || !translatedText.trim()) return;

    const { error } = await this.db.from('translation_cache').upsert(
      [
        {
          source_text: text,
          source_language: from,
          target_language: to,
          translated_text: translatedText.trim(),
        },
      ],
      {
        onConflict: 'source_text,source_language,target_language',
        ignoreDuplicates: true,
      }
    );

    if (error) this.logger.error(`saveCachedTranslation: ${error.message}`);
  }
}
