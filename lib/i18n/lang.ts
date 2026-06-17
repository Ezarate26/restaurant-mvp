/** Idiomas de interfaz soportados (sin IA — diccionario estático). */
export type AppLang = 'es' | 'en';

export const APP_LANG_STORAGE_KEY = 'conversationPlatform.landingLang';

export function isAppLang(value: string | null | undefined): value is AppLang {
  return value === 'es' || value === 'en';
}
