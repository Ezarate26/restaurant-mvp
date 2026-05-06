import type { SupabaseClient } from '@supabase/supabase-js';
import { normalizeLanguageCode } from '@/constants/languages';

function isMissingIsActiveColumn(msg: string): boolean {
  const m = (msg ?? '').toLowerCase();
  return m.includes('is_active') && (m.includes('column') || m.includes('schema'));
}

/**
 * Idiomas activos de la sesión: solo participantes en `session_users`
 * con `session_id`, `is_active = true`, idioma no nulo.
 * No usa `profiles`, `customers` ni defaults del restaurante.
 */
export async function fetchActiveSessionLanguages(
  client: SupabaseClient,
  sessionId: string
): Promise<string[]> {
  const sid = sessionId.trim();
  if (!sid) return [];

  const buildUsersQuery = (withIsActive: boolean) => {
    let q = client
      .from('session_users')
      .select('language')
      .eq('session_id', sid)
      .eq('status', 'active')
      .not('language', 'is', null);
    return withIsActive ? q.eq('is_active', true) : q;
  };

  let rows: { language: string | null }[] = [];
  try {
    const { data: d, error } = await buildUsersQuery(true);
    if (error) throw error;
    rows = (d as { language: string | null }[]) ?? [];
  } catch (e) {
    const msg = e instanceof Error ? e.message : '';
    if (!isMissingIsActiveColumn(msg)) {
      console.error('fetchActiveSessionLanguages:session_users', e);
      throw e;
    }
    const { data: d2, error: e2 } = await buildUsersQuery(false);
    if (e2) {
      console.error('fetchActiveSessionLanguages:session_users-fallback', e2);
      throw e2;
    }
    rows = (d2 as { language: string | null }[]) ?? [];
  }

  const languages = new Set<string>();
  for (const u of rows) {
    const t = u.language?.trim();
    if (!t) continue;
    languages.add(normalizeLanguageCode(t));
  }

  return [...languages];
}
