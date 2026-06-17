import { Injectable } from '@nestjs/common';
import { MessagesRepository } from './messages.repository';
import { ConversationsRepository } from '../conversations/conversations.repository';
import { normalizeLanguageCode } from '../common/utils/language.util';
import type { Message } from '../common/domain.types';

export interface SendMessageResult {
  inserted: Message;
  messages: Message[];
  conversationLanguages: string[];
  originalLanguage: string;
}

@Injectable()
export class MessagesService {
  constructor(
    private readonly repo: MessagesRepository,
    private readonly conversations: ConversationsRepository
  ) {}

  /** Inserta el mensaje y ejecuta el pipeline de traducción. */
  async sendMessage(row: {
    conversation_id: string;
    member_id: string;
    content: string | null;
    original_language?: string | null;
    message_type?: string;
  }): Promise<SendMessageResult> {
    const inserted = await this.repo.insertMessage(row);
    await this.repo.ensureTranslationsForNewMessage(row.conversation_id, inserted);

    const conversationLanguages =
      await this.conversations.fetchActiveConversationLanguages(
        row.conversation_id
      );

    const messages = await this.repo.fetchMessagesByConversation(
      row.conversation_id
    );

    const originalLanguage = normalizeLanguageCode(
      inserted.original_language ?? row.original_language ?? 'es'
    );

    return { inserted, messages, conversationLanguages, originalLanguage };
  }

  /** Hidrata los mensajes para un viewer, generando traducciones faltantes. */
  async listForViewer(
    conversationId: string,
    viewerLanguage: string | null | undefined
  ): Promise<{ messages: Message[]; conversationLanguages: string[] }> {
    const cid = conversationId.trim();
    const conversationLanguages =
      await this.conversations.fetchActiveConversationLanguages(cid);

    await this.repo.ensureViewerMissingTranslations(cid, viewerLanguage);
    const messages = await this.repo.fetchMessagesByConversation(cid);
    return { messages, conversationLanguages };
  }
}
