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

export function resolvePreferredLanguage(input: {
  customerLanguages?: string[] | null;
  selectedLanguage?: string | null;
  sessionUserLanguage?: string | null;
  initialLanguageHint?: string | null;
}): string {
  const pref =
    input.customerLanguages
      ?.find((c) => typeof c === 'string' && c.trim())
      ?.trim() ?? null;
  return (
    pref ||
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

