import type { SupabaseClient } from '@supabase/supabase-js';

/**
 * Mock síncrono — implementación anterior solo como referencia / rollback.
 * No borrar: descomentar el bloque inferior si necesitas probar sin Edge Function.
 */
export function mockTranslate(text: string, from: string, to: string): string {
  /*
   * MOCK anterior (fallback rápido durante pruebas):
   *
   * if (!text) return '';
   * if (from === to) return text;
   * return `[${to}] ${text}`;
   */
  if (!text) return '';
  if (from === to) return text;
  return text;
}

/**
 * Traducción real vía Supabase Edge Function `translate-message`.
 * Mismos parámetros que el mock: text, from, to.
 */
export async function translateMessage(
  client: SupabaseClient,
  text: string,
  from: string,
  to: string
): Promise<string> {
  if (!text.trim()) return '';
  if (from === to) return text;

  try {
    const { data, error } = await client.functions.invoke('translate-message', {
      body: { text, from, to },
    });

    if (error) throw error;

    const translation =
      data &&
      typeof data === 'object' &&
      data !== null &&
      'translation' in data &&
      typeof (data as { translation: unknown }).translation === 'string'
        ? (data as { translation: string }).translation.trim()
        : '';

    if (translation) return translation;

    return text;
  } catch (e) {
    console.error('translation error', e);
    // Fallback mock durante pruebas:
    // return mockTranslate(text, from, to);
    return text;
  }
}

/** Texto sync legacy hacia `messages.translated_text` si algún caller lo usa. */
export function translateForPersistence(
  text: string,
  from: string,
  to: string
): string {
  return mockTranslate(text, from, to);
}
