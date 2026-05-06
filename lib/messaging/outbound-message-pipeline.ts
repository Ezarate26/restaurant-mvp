import type { SupabaseClient } from '@supabase/supabase-js';
import {
  fetchMessagesBySession,
  insertMessage,
} from '@/lib/model/messages.repository';
import {
  ensureTranslationsForNewMessage,
  ensureViewerMissingTranslations,
} from '@/lib/model/message-translations.repository';
import { fetchActiveSessionLanguages } from '@/lib/model/session-languages.repository';
import { normalizeLanguageCode } from '@/constants/languages';
import type { Message } from '@/lib/model/types';

/** Ref opcional para alinear idiomas con realtime / store (sin depender de React en este módulo). */
export type SessionLanguagesRef = { current: string[] };

export type ChatOutboundInsertRow = {
  session_id: string;
  restaurant_id: string;
  sender: 'customer' | 'waiter';
  text: string;
  session_user_id?: string | null;
  user_identifier?: string | null;
  original_language?: string | null;
};

export type OutboundPipelineResult = {
  inserted: Message;
  messages: Message[];
  sessionLanguages: string[];
  originalLanguage: string;
};

/**
 * Post-insert: traducciones solo para el mensaje nuevo (idiomas activos en BD).
 */
export async function insertMessageAndRunTranslationPipeline(
  client: SupabaseClient,
  row: ChatOutboundInsertRow,
  opts?: { latestLanguagesRef?: SessionLanguagesRef }
): Promise<OutboundPipelineResult> {
  const inserted = await insertMessage(client, row);
  await ensureTranslationsForNewMessage(client, row.session_id, inserted);

  const sessionLanguages = await fetchActiveSessionLanguages(
    client,
    row.session_id
  );
  if (opts?.latestLanguagesRef) {
    opts.latestLanguagesRef.current = sessionLanguages;
  }

  const messages = await fetchMessagesBySession(client, row.session_id);
  const original = normalizeLanguageCode(
    inserted.original_language ?? row.original_language ?? 'es'
  );

  return {
    inserted,
    messages,
    sessionLanguages,
    originalLanguage: original,
  };
}

/**
 * Al abrir el chat o tras login: solo filas faltantes en `message_translations`
 * para el idioma del usuario que está viendo (sin regenerar otro idiomas ni el historial completo).
 */
export async function hydrateChatMessagesForViewer(
  client: SupabaseClient,
  sessionId: string,
  viewerLanguage: string | null | undefined,
  opts?: { latestLanguagesRef?: SessionLanguagesRef }
): Promise<{ messages: Message[]; sessionLanguages: string[] }> {
  const sid = sessionId.trim();
  const sessionLanguages = await fetchActiveSessionLanguages(client, sid);
  if (opts?.latestLanguagesRef) {
    opts.latestLanguagesRef.current = sessionLanguages;
  }

  await ensureViewerMissingTranslations(client, sid, viewerLanguage);
  const messages = await fetchMessagesBySession(client, sid);
  return { messages, sessionLanguages };
}
