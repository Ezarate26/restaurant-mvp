/** Códigos ISO 639-1 soportados (paridad con el frontend `constants/languages.ts`). */
export const LANGUAGE_CODES: ReadonlySet<string> = new Set([
  'es', 'en', 'fr', 'de', 'it', 'pt', 'nl', 'pl', 'ru', 'uk', 'ro', 'el', 'tr',
  'sv', 'da', 'no', 'fi', 'cs', 'sk', 'hu', 'bg', 'hr', 'sr', 'bs', 'sl', 'sq',
  'lv', 'lt', 'et', 'is', 'ga', 'cy', 'ca', 'eu', 'gl', 'ar', 'he', 'fa', 'ur',
  'hi', 'bn', 'ta', 'te', 'mr', 'gu', 'kn', 'ml', 'th', 'vi', 'id', 'ms', 'tl',
  'zh', 'ja', 'ko', 'sw', 'am', 'zu', 'af',
]);

/** Normaliza código de idioma; desconocidos → `es`. */
export function normalizeLanguageCode(code: string | null | undefined): string {
  const c = (code ?? 'es').trim().toLowerCase();
  return LANGUAGE_CODES.has(c) ? c : 'es';
}
