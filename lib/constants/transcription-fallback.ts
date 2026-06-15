import { normalizeLanguageCode } from '@/constants/languages';

const FALLBACK_BY_LANG: Record<string, string> = {
  es: 'No fue posible transcribir este mensaje de voz.',
  en: 'Unable to transcribe this voice message.',
  fr: 'Impossible de transcrire ce message vocal.',
  de: 'Sprachnachricht konnte nicht transkribiert werden.',
};

export function getTranscriptionFallback(languageCode: string | null | undefined): string {
  const code = normalizeLanguageCode(languageCode ?? 'es');
  return FALLBACK_BY_LANG[code] ?? FALLBACK_BY_LANG.en;
}
