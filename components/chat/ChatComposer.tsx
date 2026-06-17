'use client';

import { VoiceRecordingBar } from '@/components/chat/VoiceRecordingBar';
import { VoiceButton } from '@/components/billing/VoiceButton';
import { TapButton } from '@/components/ui/TapButton';

type ChatComposerProps = {
  message: string;
  disabled?: boolean;
  isRecording?: boolean;
  voiceBusy?: boolean;
  waveformLevels?: number[];
  recordingDurationMs?: number;
  micActive?: boolean;
  micMuted?: boolean;
  canSendRecording?: boolean;
  voiceAllowed?: boolean;
  onMessageChange: (value: string) => void;
  onSend: () => void;
  onStartVoice?: () => void;
  onStopVoice?: () => void;
  onCancelVoice?: () => void;
  onVoiceUpgrade?: () => void;
};

export function ChatComposer({
  message,
  disabled = false,
  isRecording = false,
  voiceBusy = false,
  waveformLevels = [],
  recordingDurationMs = 0,
  micActive = false,
  micMuted = false,
  canSendRecording = false,
  voiceAllowed = true,
  onMessageChange,
  onSend,
  onStartVoice,
  onStopVoice,
  onCancelVoice,
  onVoiceUpgrade,
}: ChatComposerProps) {
  const canSend = !disabled && message.trim().length > 0;
  const showVoiceTooltipSpace =
    Boolean(onStartVoice) && !voiceAllowed && !isRecording && !voiceBusy;

  return (
    <div
      className={`relative z-10 shrink-0 overflow-visible bg-[var(--app-sidebar)] px-3 pb-[calc(env(safe-area-inset-bottom)+0.875rem)] sm:px-4 sm:pb-[calc(env(safe-area-inset-bottom)+1rem)] ${showVoiceTooltipSpace ? 'pt-10 sm:pt-10' : 'pt-2'}`}
    >
      {isRecording || voiceBusy ? (
        <VoiceRecordingBar
          waveformLevels={waveformLevels}
          durationMs={recordingDurationMs}
          micActive={micActive}
          micMuted={micMuted}
          saving={voiceBusy}
          canSend={canSendRecording && !voiceBusy}
          onCancel={onCancelVoice ?? (() => undefined)}
          onSend={onStopVoice ?? (() => undefined)}
        />
      ) : (
        <div className="flex items-center gap-2 overflow-visible">
          {onStartVoice ? (
            <VoiceButton
              allowed={voiceAllowed}
              disabled={disabled || voiceBusy}
              onStart={onStartVoice}
              onUpgradeRequest={onVoiceUpgrade}
            />
          ) : null}
          <div className="flex min-w-0 flex-1 items-center gap-2 rounded-xl bg-[var(--chat-input-bg)] px-3 py-2 ring-1 ring-[var(--app-border)]">
            <input
            className={`min-w-0 flex-1 bg-transparent text-base text-[var(--chat-input-text)] placeholder:text-[var(--chat-input-placeholder)] outline-none disabled:cursor-not-allowed disabled:opacity-50 sm:text-[15px] ${message ? 'text-left' : 'text-center'}`}
            placeholder="Escribe un mensaje en tu idioma…"
              value={message}
              onChange={(e) => onMessageChange(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  if (canSend) onSend();
                }
              }}
              aria-label="Mensaje"
              disabled={disabled}
            />
            <TapButton
              onTap={onSend}
              disabled={!canSend}
              className="app-touchable touch-target app-hover shrink-0 rounded-lg btn-gradient px-3 py-2 text-xs font-semibold disabled:cursor-not-allowed disabled:opacity-40"
            >
              Enviar
            </TapButton>
          </div>
        </div>
      )}
    </div>
  );
}
