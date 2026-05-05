/**
 * Capa de traducción para mensajes. Hoy: mock síncrono.
 * Para IA real: sustituir el cuerpo de `translateForPersistence` (u operador async dedicado en el repositorio).
 */
export function mockTranslate(text: string, from: string, to: string): string {
  if (!text) return '';

  if (from === to) return text;

  return `[${to}] ${text}`;
}

/** Texto que se guarda en `messages.translated_text`. */
export function translateForPersistence(
  text: string,
  from: string,
  to: string
): string {
  return mockTranslate(text, from, to);
}
