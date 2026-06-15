import type { SupabaseClient } from '@supabase/supabase-js';
import { normalizeLanguageCode } from '@/constants/languages';

/** Idiomas preferidos de participantes activos en la conversación. */
export async function fetchActiveConversationLanguages(
  client: SupabaseClient,
  conversationId: string
): Promise<string[]> {
  const { data, error } = await client
    .from('conversation_members')
    .select('preferred_language')
    .eq('conversation_id', conversationId)
    .is('left_at', null);

  if (error) {
    console.error('fetchActiveConversationLanguages', error);
    return [];
  }

  const langs = [
    ...new Set(
      (data ?? [])
        .map((r) => normalizeLanguageCode(r.preferred_language))
        .filter(Boolean)
    ),
  ];
  return langs;
}
