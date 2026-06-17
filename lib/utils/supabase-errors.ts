type SupabaseErrorLike = {
  message?: string;
  details?: string;
  hint?: string;
  code?: string;
};

export type UserFacingErrorKind = 'client' | 'system';

export type UserFacingError = {
  message: string;
  kind: UserFacingErrorKind;
  code?: string;
};

const SYSTEM_SUFFIX =
  ' Si el problema continúa, contacta a soporte.';

function isTechnicalMessage(message: string): boolean {
  const m = message.toLowerCase();
  return (
    m.includes('foreign key constraint') ||
    m.includes('violates') ||
    m.includes('key (') ||
    m.includes('duplicate key') ||
    m.includes('row-level security') ||
    m.includes('permission denied') ||
    m.includes('jwt') ||
    m.includes('pgrst') ||
    m.includes('insert or update on table')
  );
}

function mapPostgresCode(
  code: string | undefined,
  fallbackAction: string
): UserFacingError | null {
  switch (code) {
    case '23503':
      return {
        kind: 'system',
        message: `Error al ${fallbackAction}.${SYSTEM_SUFFIX}`,
        code: 'FK_VIOLATION',
      };
    case '23505':
      return {
        kind: 'client',
        message: 'Ese registro ya existe. Intenta de nuevo.',
        code: 'UNIQUE_VIOLATION',
      };
    case '23514':
      return {
        kind: 'client',
        message:
          'Los datos enviados no son válidos. Revísalos e intenta de nuevo.',
        code: 'CHECK_VIOLATION',
      };
    case '42501':
      return {
        kind: 'system',
        message: `No tienes permiso para ${fallbackAction}.${SYSTEM_SUFFIX}`,
        code: 'INSUFFICIENT_PRIVILEGE',
      };
    default:
      return null;
  }
}

export function toUserFacingError(
  error: unknown,
  fallbackAction = 'completar la operación'
): UserFacingError {
  if (error && typeof error === 'object' && 'kind' in error && 'message' in error) {
    return error as UserFacingError;
  }

  const supa = error as SupabaseErrorLike | null;
  const code = supa?.code;
  const mapped = mapPostgresCode(code, fallbackAction);
  if (mapped) return mapped;

  const raw =
    (error instanceof Error ? error.message : null) ??
    supa?.message?.trim() ??
    '';

  if (!raw) {
    return {
      kind: 'system',
      message: `Error al ${fallbackAction}.${SYSTEM_SUFFIX}`,
      code: 'UNKNOWN',
    };
  }

  if (isTechnicalMessage(raw)) {
    return {
      kind: 'system',
      message: `Error al ${fallbackAction}.${SYSTEM_SUFFIX}`,
      code: 'TECHNICAL',
    };
  }

  return {
    kind: 'client',
    message: raw,
    code: 'CLIENT',
  };
}

export function formatSupabaseError(
  error: SupabaseErrorLike | null | undefined,
  fallback: string
): Error {
  const action = fallback.replace(/^No se pudo /i, '').replace(/\.$/, '');
  const facing = toUserFacingError(error, action);
  const err = new Error(facing.message);
  (err as Error & { userFacing?: UserFacingError }).userFacing = facing;
  return err;
}

export function getErrorMessage(
  error: unknown,
  fallbackAction: string
): string {
  return toUserFacingError(error, fallbackAction).message;
}

export function generateInviteCode(length = 8): string {
  const alphabet = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';
  let out = '';
  for (let i = 0; i < length; i += 1) {
    out += alphabet.charAt(Math.floor(Math.random() * alphabet.length));
  }
  return out;
}
