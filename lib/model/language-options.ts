import {
  LANGUAGES,
  normalizeLanguageCode,
} from '@/constants/languages';

/** Compatibilidad: mismo uso histórico en formularios (`label`). */
export const APP_LANGUAGE_OPTIONS = LANGUAGES.map((l) => ({
  code: l.code,
  label: l.name,
}));

export function normalizeAppLanguage(code: string | null | undefined): string {
  return normalizeLanguageCode(code);
}
