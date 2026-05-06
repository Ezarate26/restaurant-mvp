import type { SupabaseClient } from '@supabase/supabase-js';
import {
  fetchMessagesBySession,
} from '@/lib/model/messages.repository';
import { fetchActiveSessionUsersBySession } from '@/lib/model/session-users.repository';
import type { ServiceSession, SessionUser } from '@/lib/model/types';

export async function loadChatSnapshot(
  client: SupabaseClient,
  sessionId: string
) {
  const [messages, sessionUsers] = await Promise.all([
    fetchMessagesBySession(client, sessionId),
    fetchActiveSessionUsersBySession(client, sessionId),
  ]);
  const valid = messages.filter(
    (m) =>
      m.sender === 'system' ||
      (Boolean(m.session_user_id) &&
        Boolean(m.user_identifier) &&
        Boolean(m.original_language) &&
        Boolean((m.text ?? '').trim()))
  );
  const tail = valid.at(-1)?.created_at ?? null;
  return {
    messages: valid,
    sessionUsers,
    lastReadAt: tail ?? new Date().toISOString(),
  };
}

/** Prioriza idioma de UI / sesión; no usa `customers.languages` ni perfiles. */
export function resolvePreferredLanguage(input: {
  selectedLanguage?: string | null;
  sessionUserLanguage?: string | null;
  initialLanguageHint?: string | null;
}): string {
  return (
    input.selectedLanguage?.trim() ||
    input.sessionUserLanguage?.trim() ||
    input.initialLanguageHint?.trim() ||
    'es'
  );
}

export type LoginCustomerResponse = {
  error?: string;
  detail?: string;
  session?: ServiceSession | null;
  sessionUser?: SessionUser;
  customer?: {
    languages?: string[] | null;
    full_name?: string | null;
    username?: string | null;
  } | null;
};

