import { LANGUAGES, normalizeLanguageCode } from '@/constants/languages';
import { FREE_LANGUAGE_CODES } from '@/lib/billing/constants';

export function getFreeLanguageOptions(): { code: string; name: string }[] {
  return LANGUAGES.filter((l) => FREE_LANGUAGE_CODES.has(l.code));
}

/** Idiomas disponibles al crear una sala (según plan del creador). */
export function getCreateLanguageOptions(allowAllLanguages: boolean) {
  return allowAllLanguages ? LANGUAGES : getFreeLanguageOptions();
}

/**
 * Idiomas al unirse: salas Free solo ES/EN; invitados sin cuenta siempre ES/EN.
 */
export function getJoinLanguageOptions(
  roomAllowsAllLanguages: boolean,
  isAuthenticated: boolean
) {
  if (!roomAllowsAllLanguages || !isAuthenticated) {
    return getFreeLanguageOptions();
  }
  return LANGUAGES;
}

export function assertLanguageAllowed(
  code: string,
  allowAllLanguages: boolean
): void {
  const normalized = normalizeLanguageCode(code);
  if (allowAllLanguages || FREE_LANGUAGE_CODES.has(normalized)) return;
  throw new Error(
    'En plan Free solo están disponibles Español e Inglés. Pro desbloquea todos los idiomas.'
  );
}

export function clampLanguageToFree(code: string): string {
  const normalized = normalizeLanguageCode(code);
  return FREE_LANGUAGE_CODES.has(normalized) ? normalized : 'es';
}
