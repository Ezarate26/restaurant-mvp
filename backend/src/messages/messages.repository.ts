import { Injectable, InternalServerErrorException, Logger } from '@nestjs/common';
import { SupabaseService } from '../supabase/supabase.service';
import { ConversationsRepository } from '../conversations/conversations.repository';
import { TranslationService } from '../translation/translation.service';
import { normalizeLanguageCode } from '../common/utils/language.util';
import type { Message, MessageTranslation } from '../common/domain.types';

type TranslationInsertRow = {
  message_id: string;
  language_code: string;
  translated_content: string;
};

function normalizeMessageRow(raw: Record<string, unknown>): Message {
  const nested = raw.conversation_members as Message['conversation_members'];
  let conversation_members: Message['conversation_members'] = null;
  if (Array.isArray(nested)) {
    conversation_members = nested[0] ?? null;
  } else if (nested && typeof nested === 'object') {
    conversation_members = nested;
  }

  const nestedTranslations = (raw as { message_translations?: unknown })
    .message_translations;
  const translations = Array.isArray(nestedTranslations)
    ? (nestedTranslations as MessageTranslation[])
    : null;

  const nestedVoice = (raw as { voice_messages?: unknown }).voice_messages;
  let voice_message: Message['voice_message'] = null;
  if (Array.isArray(nestedVoice)) {
    voice_message = (nestedVoice[0] as Message['voice_message']) ?? null;
  } else if (nestedVoice && typeof nestedVoice === 'object') {
    voice_message = nestedVoice as Message['voice_message'];
  }

  const {
    message_translations: _skip,
    voice_messages: _skipVoice,
    ...rest
  } = raw as Record<string, unknown> & {
    message_translations?: unknown;
    voice_messages?: unknown;
  };

  return {
    ...(rest as unknown as Message),
    conversation_members,
    translations,
    voice_message,
  };
}

@Injectable()
export class MessagesRepository {
  private readonly logger = new Logger(MessagesRepository.name);

  constructor(
    private readonly supabase: SupabaseService,
    private readonly conversations: ConversationsRepository,
    private readonly translation: TranslationService
  ) {}

  private get db() {
    return this.supabase.serviceRole();
  }

  async fetchMessagesByConversation(conversationId: string): Promise<Message[]> {
    const { data, error } = await this.db
      .from('messages')
      .select(
        `
        *,
        conversation_members ( display_name, preferred_language ),
        message_translations ( id, message_id, language_code, translated_content, created_at ),
        voice_messages ( id, message_id, audio_url, original_language, duration_seconds, transcription, processing_status, transcription_status, transcription_completed_at, created_at )
      `
      )
      .eq('conversation_id', conversationId)
      .is('deleted_at', null)
      .order('created_at', { ascending: true });

    if (error) {
      this.logger.error(`fetchMessagesByConversation: ${error.message}`);
      return [];
    }
    return ((data as Record<string, unknown>[]) ?? []).map(normalizeMessageRow);
  }

  async insertMessage(row: {
    conversation_id: string;
    member_id: string;
    content: string | null;
    original_language?: string | null;
    message_type?: string;
  }): Promise<Message> {
    const original_language = normalizeLanguageCode(row.original_language ?? 'es');
    const message_type = row.message_type ?? 'text';

    const { data, error } = await this.db
      .from('messages')
      .insert([
        {
          conversation_id: row.conversation_id,
          member_id: row.member_id,
          content: row.content,
          original_language,
          message_type,
          translation_status:
            message_type === 'audio' && !row.content?.trim()
              ? 'processing'
              : 'pending',
        },
      ])
      .select(
        `
        *,
        conversation_members ( display_name, preferred_language )
      `
      )
      .single();

    if (error || !data) {
      throw new InternalServerErrorException('No se pudo enviar el mensaje');
    }
    return normalizeMessageRow(data as Record<string, unknown>);
  }

  private async upsertMessageTranslations(
    rows: TranslationInsertRow[]
  ): Promise<void> {
    if (rows.length === 0) return;
    const { error } = await this.db
      .from('message_translations')
      .upsert(rows, {
        onConflict: 'message_id,language_code',
        ignoreDuplicates: true,
      });
    if (error) {
      this.logger.error(`upsertMessageTranslations: ${error.message}`);
      throw new InternalServerErrorException(error.message);
    }
  }

  async ensureTranslationsForNewMessage(
    conversationId: string,
    message: Pick<Message, 'id' | 'content' | 'original_language' | 'message_type'>
  ): Promise<void> {
    const cid = conversationId.trim();
    if (!cid || !message.id) return;
    if (message.message_type !== 'text' && message.message_type !== 'audio') {
      return;
    }

    const body = (message.content ?? '').trim();
    const olRaw = message.original_language?.trim();
    if (!body || !olRaw) return;

    const orig = normalizeLanguageCode(olRaw);
    const activeLangs =
      await this.conversations.fetchActiveConversationLanguages(cid);
    const targets = [
      ...new Set(
        activeLangs.map((l) => normalizeLanguageCode(l)).filter((l) => l !== orig)
      ),
    ];
    if (!targets.length) return;

    const { data: existingRows, error: exErr } = await this.db
      .from('message_translations')
      .select('language_code')
      .eq('message_id', message.id);

    if (exErr) throw new InternalServerErrorException(exErr.message);

    const have = new Set(
      (existingRows ?? []).map((r) =>
        normalizeLanguageCode(r.language_code as string | null | undefined)
      )
    );

    const pendingLangs = targets.filter((l) => !have.has(l));
    if (!pendingLangs.length) return;

    const rows: TranslationInsertRow[] = await Promise.all(
      pendingLangs.map(async (lang) => ({
        message_id: message.id,
        language_code: lang,
        translated_content: await this.translation.translateWithCache(
          body,
          orig,
          lang
        ),
      }))
    );

    await this.upsertMessageTranslations(rows);

    await this.db
      .from('messages')
      .update({ translation_status: 'completed' })
      .eq('id', message.id);
  }

  async ensureViewerMissingTranslations(
    conversationId: string,
    viewerLanguage: string | null | undefined
  ): Promise<void> {
    const cid = conversationId.trim();
    const raw = (viewerLanguage ?? '').trim();
    if (!cid || !raw) return;

    const viewerLang = normalizeLanguageCode(raw);

    const { data: messageRows, error: msgErr } = await this.db
      .from('messages')
      .select('id, content, original_language, message_type')
      .eq('conversation_id', cid)
      .is('deleted_at', null);

    if (msgErr) throw new InternalServerErrorException(msgErr.message);

    const candidates = (messageRows ?? []).filter((r) => {
      if (r.message_type !== 'text' && r.message_type !== 'audio') return false;
      const t = (r.content as string | null | undefined)?.trim();
      const ol = (r.original_language as string | null | undefined)?.trim();
      return Boolean(t && ol);
    });

    const ids: string[] = [];
    const meta = new Map<string, { body: string; orig: string }>();

    for (const r of candidates) {
      const mid = r.id as string;
      const body = (r.content as string).trim();
      const orig = normalizeLanguageCode(r.original_language as string);
      if (orig === viewerLang) continue;
      ids.push(mid);
      meta.set(mid, { body, orig });
    }

    if (!ids.length) return;

    const { data: existingTr, error: trErr } = await this.db
      .from('message_translations')
      .select('message_id')
      .eq('language_code', viewerLang)
      .in('message_id', ids);

    if (trErr) throw new InternalServerErrorException(trErr.message);

    const covered = new Set((existingTr ?? []).map((x) => x.message_id as string));
    const missingIds = ids.filter((id) => !covered.has(id));
    if (!missingIds.length) return;

    const insertRows: TranslationInsertRow[] = await Promise.all(
      missingIds.map(async (message_id) => {
        const m = meta.get(message_id)!;
        return {
          message_id,
          language_code: viewerLang,
          translated_content: await this.translation.translateWithCache(
            m.body,
            m.orig,
            viewerLang
          ),
        };
      })
    );

    await this.upsertMessageTranslations(insertRows);
  }
}
