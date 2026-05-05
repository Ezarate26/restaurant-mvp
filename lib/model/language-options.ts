/** Idiomas disponibles en formularios (coinciden con `profiles.language` / `restaurant_settings.default_language`). */
export const APP_LANGUAGE_OPTIONS = [
  { code: 'es', label: 'Español' },
  { code: 'en', label: 'English' },
  { code: 'fr', label: 'Français' },
  { code: 'pt', label: 'Português' },
] as const;

const ALLOWED: ReadonlySet<string> = new Set<string>(
  APP_LANGUAGE_OPTIONS.map((o) => o.code)
);

export function normalizeAppLanguage(
  code: string | null | undefined
): string {
  const c = (code ?? 'es').trim().toLowerCase();
  return ALLOWED.has(c) ? c : 'es';
}
