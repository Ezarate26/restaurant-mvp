type SupabaseErrorLike = {
  message?: string;
  details?: string;
  hint?: string;
  code?: string;
};

export function formatSupabaseError(
  error: SupabaseErrorLike | null | undefined,
  fallback: string
): Error {
  if (!error?.message?.trim()) return new Error(fallback);
  const parts = [error.message, error.details, error.hint].filter(Boolean);
  return new Error(parts.length > 0 ? parts.join(' — ') : fallback);
}

export function generateInviteCode(length = 8): string {
  const alphabet = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';
  let out = '';
  for (let i = 0; i < length; i += 1) {
    out += alphabet.charAt(Math.floor(Math.random() * alphabet.length));
  }
  return out;
}
