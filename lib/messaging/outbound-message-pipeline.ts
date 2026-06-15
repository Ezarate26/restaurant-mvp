import type { SupabaseClient } from '@supabase/supabase-js';
import {
  fetchMessagesByConversation,
  insertMessage,
} from '@/lib/model/messages.repository';
import {
  ensureTranslationsForNewMessage,
  ensureViewerMissingTranslations,
} from '@/lib/model/message-translations.repository';
import { fetchActiveConversationLanguages } from '@/lib/model/conversation-languages.repository';
import { normalizeLanguageCode } from '@/constants/languages';
import type { Message } from '@/lib/model/types';

export type ConversationLanguagesRef = { current: string[] };

export type ChatOutboundInsertRow = {
  conversation_id: string;
  member_id: string;
  content: string | null;
  original_language?: string | null;
  message_type?: string;
};

export type OutboundPipelineResult = {
  inserted: Message;
  messages: Message[];
  conversationLanguages: string[];
  originalLanguage: string;
};

export async function insertMessageAndRunTranslationPipeline(
  client: SupabaseClient,
  row: ChatOutboundInsertRow,
  opts?: { latestLanguagesRef?: ConversationLanguagesRef }
): Promise<OutboundPipelineResult> {
  const inserted = await insertMessage(client, row);
  await ensureTranslationsForNewMessage(client, row.conversation_id, inserted);

  const conversationLanguages = await fetchActiveConversationLanguages(
    client,
    row.conversation_id
  );
  if (opts?.latestLanguagesRef) {
    opts.latestLanguagesRef.current = conversationLanguages;
  }

  const messages = await fetchMessagesByConversation(
    client,
    row.conversation_id
  );
  const original = normalizeLanguageCode(
    inserted.original_language ?? row.original_language ?? 'es'
  );

  return {
    inserted,
    messages,
    conversationLanguages,
    originalLanguage: original,
  };
}

export async function hydrateChatMessagesForViewer(
  client: SupabaseClient,
  conversationId: string,
  viewerLanguage: string | null | undefined,
  opts?: { latestLanguagesRef?: ConversationLanguagesRef }
): Promise<{ messages: Message[]; conversationLanguages: string[] }> {
  const cid = conversationId.trim();
  const conversationLanguages = await fetchActiveConversationLanguages(
    client,
    cid
  );
  if (opts?.latestLanguagesRef) {
    opts.latestLanguagesRef.current = conversationLanguages;
  }

  await ensureViewerMissingTranslations(client, cid, viewerLanguage);
  const messages = await fetchMessagesByConversation(client, cid);
  return { messages, conversationLanguages };
}
