'use client';

import { VoiceRecordingBar } from '@/components/chat/VoiceRecordingBar';
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
  onMessageChange: (value: string) => void;
  onSend: () => void;
  onStartVoice?: () => void;
  onStopVoice?: () => void;
  onCancelVoice?: () => void;
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
  onMessageChange,
  onSend,
  onStartVoice,
  onStopVoice,
  onCancelVoice,
}: ChatComposerProps) {
  const canSend = !disabled && message.trim().length > 0;

  return (
    <div className="shrink-0 bg-[var(--app-sidebar)] px-3 pt-2 pb-[calc(env(safe-area-inset-bottom)+0.875rem)] sm:px-4 sm:pb-[calc(env(safe-area-inset-bottom)+1rem)]">
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
        <div className="flex items-center gap-2">
          {onStartVoice ? (
            <TapButton
              onTap={onStartVoice}
              disabled={disabled || voiceBusy}
              aria-label="Grabar mensaje de voz"
              className="app-touchable touch-target flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-lg text-[var(--app-muted)] hover:text-[var(--app-primary)] disabled:opacity-40"
            >
              🎤
            </TapButton>
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
