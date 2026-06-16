'use client';

import { normalizeLanguageCode } from '@/constants/languages';
import { AudioPlaybackBlock } from '@/components/chat/AudioPlaybackBlock';
import { LanguageBadge } from '@/components/chat/LanguageBadge';
import { useChatUiStrings } from '@/lib/hooks/useChatUiStrings';
import {
  avatarColor,
  formatMessageTime,
  memberInitials,
} from '@/lib/utils/chat-avatar';
import type { ConversationMember, Message } from '@/lib/model/types';

export interface MessageBubbleProps {
  message: Message;
  currentMemberId?: string | null;
  viewerLanguage?: string | null;
  lastReadAt?: string | null;
  showReadReceipts?: boolean;
  members?: ConversationMember[] | null;
  showAvatar?: boolean;
  showHeader?: boolean;
}

function memberDisplayName(
  message: Message,
  members: ConversationMember[]
): string {
  const nested = message.conversation_members;
  const fromJoin = Array.isArray(nested) ? nested[0] : nested;
  if (fromJoin?.display_name?.trim()) return fromJoin.display_name.trim();
  const m = members.find((x) => x.id === message.member_id);
  return m?.display_name?.trim() || 'Participante';
}

function isVoiceProcessing(message: Message): boolean {
  if (message.message_type !== 'audio') return false;
  const vm = message.voice_message;
  if (!vm) return !message.content?.trim();
  const status = vm.processing_status ?? vm.transcription_status;
  return status === 'pending' || status === 'processing';
}

export function MessageBubble({
  message,
  currentMemberId = null,
  viewerLanguage = null,
  showReadReceipts = false,
  members = [],
  showAvatar = true,
  showHeader = true,
}: MessageBubbleProps) {
  const originalText = (message.content ?? '').trim();
  const viewerNorm = viewerLanguage?.trim()
    ? normalizeLanguageCode(viewerLanguage)
    : null;
  const origLang = message.original_language
    ? normalizeLanguageCode(message.original_language)
    : null;

  const translation = viewerNorm
    ? message.translations?.find(
        (t) =>
          t.message_id === message.id &&
          normalizeLanguageCode(t.language_code) === viewerNorm
      )
    : undefined;

  const isMe = Boolean(currentMemberId && message.member_id === currentMemberId);
  const senderName = isMe ? 'Tú' : memberDisplayName(message, members ?? []);
  const processing = isVoiceProcessing(message);
  const isAudio = message.message_type === 'audio';
  const audioUrl = message.voice_message?.audio_url ?? null;
  const durationSeconds = message.voice_message?.duration_seconds ?? null;

  const translatedText = (translation?.translated_content ?? '').trim();
  const primaryLine =
    translatedText || originalText || (processing ? '' : '…');
  const showOriginalBlock =
    !processing &&
    Boolean(originalText) &&
    Boolean(translatedText) &&
    primaryLine !== originalText;

  const memberId = message.member_id ?? 'unknown';
  const timeLabel = formatMessageTime(message.created_at);
  const ttsSourceText = translatedText || primaryLine;
  const ui = useChatUiStrings(viewerNorm ?? viewerLanguage);

  const bubbleClass = isMe ? 'msg-bubble-out' : 'msg-bubble-in';

  const originalBlock = showOriginalBlock ? (
    <div className="mt-2 border-t border-white/15 pt-2">
      <p className="text-[11px] font-semibold opacity-90">
        Original ({origLang?.toUpperCase()})
      </p>
      <p className="mt-0.5 whitespace-pre-wrap text-[13px] leading-relaxed opacity-85">
        {originalText}
      </p>
    </div>
  ) : null;

  const textBubble = !processing && primaryLine ? (
    <div
      className={`${bubbleClass} app-hover inline-block max-w-[min(100%,28rem)] rounded-2xl px-3.5 py-2.5 transition duration-200`}
    >
      <p className="whitespace-pre-wrap text-[15px] leading-relaxed">
        {primaryLine}
      </p>
      {originalBlock}
    </div>
  ) : null;

  return (
    <article
      className={`message-fade-in group relative flex gap-2.5 px-4 py-0.5 ${isMe ? 'flex-row-reverse' : ''} ${showHeader ? 'mt-4' : 'mt-1'}`}
    >
      <div className={`w-9 shrink-0 ${isMe ? 'items-end' : ''}`}>
        {showAvatar ? (
          <div
            className="mt-0.5 flex h-9 w-9 items-center justify-center rounded-full text-[11px] font-bold text-white"
            style={{ backgroundColor: avatarColor(memberId) }}
            aria-hidden
          >
            {memberInitials(senderName)}
          </div>
        ) : (
          <span
            className="mt-1 block text-center text-[10px] text-[var(--app-muted)] opacity-0 transition-opacity duration-200 group-hover:opacity-100"
            aria-hidden
          >
            {timeLabel}
          </span>
        )}
      </div>

      <div
        className={`flex min-w-0 max-w-[85%] flex-col ${isMe ? 'items-end' : 'items-start'}`}
      >
        {showHeader ? (
          <div
            className={`mb-1 flex flex-wrap items-baseline gap-x-1.5 gap-y-0.5 ${isMe ? 'flex-row-reverse' : ''}`}
          >
            <span className="text-sm font-semibold text-[var(--app-text)]">
              {senderName}
            </span>
            {timeLabel ? (
              <>
                <span className="text-[var(--app-muted)]" aria-hidden>
                  •
                </span>
                <time
                  className="text-[10px] text-[var(--app-muted)]"
                  dateTime={message.created_at ?? undefined}
                >
                  {timeLabel}
                </time>
              </>
            ) : null}
            {origLang ? <LanguageBadge languageCode={origLang} /> : null}
          </div>
        ) : null}

        {isAudio ? (
          <div className={`space-y-1.5 ${isMe ? 'items-end' : 'items-start'}`}>
            {processing ? (
              <div className="flex items-center gap-2 text-xs font-medium text-[var(--app-primary)]">
                <span className="typing-dot h-1.5 w-1.5 rounded-full bg-[var(--app-primary)]" />
                <span>{ui.processingAudio}</span>
              </div>
            ) : null}

            {audioUrl ? (
              <AudioPlaybackBlock
                variant="original"
                viewerLanguage={viewerNorm ?? viewerLanguage}
                languageCode={origLang}
                audioUrl={audioUrl}
                durationSeconds={durationSeconds}
              />
            ) : null}

            {!processing && viewerNorm && ttsSourceText ? (
              <AudioPlaybackBlock
                variant="translated"
                viewerLanguage={viewerNorm ?? viewerLanguage}
                languageCode={viewerNorm}
                ttsText={ttsSourceText}
              />
            ) : null}

            {textBubble}
          </div>
        ) : (
          textBubble
        )}

        {showReadReceipts && isMe ? (
          <p className="mt-0.5 text-[10px] text-[var(--app-muted)] opacity-0 transition-opacity duration-200 group-hover:opacity-100">
            Enviado
          </p>
        ) : null}
      </div>
    </article>
  );
}
