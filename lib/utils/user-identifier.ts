/**
 * Identificadores opacos (UUID, token de dispositivo, etc.) no deben mostrarse en UI.
 */
const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export function isTechnicalUserIdentifier(raw: string | null | undefined): boolean {
  const s = (raw ?? '').trim();
  if (!s) return false;
  if (UUID_RE.test(s)) return true;
  if (s.length >= 32 && /^[0-9a-f-]+$/i.test(s)) return true;
  if (s.length >= 28 && /^[a-z0-9_-]+$/i.test(s) && !/\s/.test(s)) return true;
  return false;
}

/** Etiqueta en burbujas y listas: Usuario 01, Usuario 02… */
export function paddedUsuarioOrder(arrivalIndex: number): string {
  return `Usuario ${String(arrivalIndex).padStart(2, '0')}`;
}
