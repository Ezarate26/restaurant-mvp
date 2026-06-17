import { Injectable, Logger } from '@nestjs/common';
import { SupabaseService } from '../supabase/supabase.service';
import { TranslationRepository } from './translation.repository';

@Injectable()
export class TranslationService {
  private readonly logger = new Logger(TranslationService.name);

  constructor(
    private readonly supabase: SupabaseService,
    private readonly repo: TranslationRepository
  ) {}

  /** Traducción real vía Edge Function `translate-message` (mantiene la clave de IA fuera de este servicio). */
  async translateMessage(
    text: string,
    from: string,
    to: string
  ): Promise<string> {
    if (!text.trim()) return '';
    if (from === to) return text;

    try {
      const { data, error } = await this.supabase
        .serviceRole()
        .functions.invoke('translate-message', { body: { text, from, to } });

      if (error) {
        this.logger.error(`translate-message: ${error.message}`);
        return text;
      }

      const translation =
        data &&
        typeof data === 'object' &&
        data !== null &&
        'translation' in data &&
        typeof (data as { translation: unknown }).translation === 'string'
          ? (data as { translation: string }).translation.trim()
          : '';

      return translation || text;
    } catch (e) {
      this.logger.error(`translate-message: ${(e as Error).message}`);
      return text;
    }
  }

  /** Traduce con caché global antes de llamar a la IA. */
  async translateWithCache(
    text: string,
    from: string,
    to: string
  ): Promise<string> {
    const cached = await this.repo.getCachedTranslation(text, from, to);
    if (cached) return cached;

    const translated = await this.translateMessage(text, from, to);
    await this.repo.saveCachedTranslation(text, from, to, translated);
    return translated;
  }
}
