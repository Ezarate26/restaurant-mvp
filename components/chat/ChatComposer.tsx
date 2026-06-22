'use client';

import { useRef } from 'react';
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

/** Evita que el botón Enviar robe el foco y cierre el teclado en móvil. */
function preventInputBlur(e: { preventDefault(): void }) {
  e.preventDefault();
}

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
  const inputRef = useRef<HTMLInputElement>(null);
  const canSend = !disabled && message.trim().length > 0;
  const showVoiceTooltipSpace =
    Boolean(onStartVoice) && !voiceAllowed && !isRecording && !voiceBusy;

  const keepInputFocused = () => {
    const input = inputRef.current;
    if (!input) return;
    try {
      input.focus({ preventScroll: true });
    } catch {
      input.focus();
    }
  };

  const handleSend = () => {
    if (!canSend) return;
    onSend();
    window.requestAnimationFrame(() => {
      keepInputFocused();
      window.requestAnimationFrame(keepInputFocused);
    });
  };

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
        <div className="flex items-end gap-2 overflow-visible">
          {onStartVoice ? (
            <VoiceButton
              allowed={voiceAllowed}
              disabled={disabled || voiceBusy}
              onStart={onStartVoice}
              onUpgradeRequest={onVoiceUpgrade}
            />
          ) : null}
          <div className="flex min-h-[48px] min-w-0 flex-1 items-center gap-2 rounded-xl bg-[var(--chat-input-bg)] px-3 py-1.5 ring-1 ring-[var(--app-border)]">
            <input
              ref={inputRef}
              type="text"
              enterKeyHint="send"
              inputMode="text"
              autoComplete="off"
              autoCorrect="on"
              spellCheck
              className="min-w-0 flex-1 appearance-none border-0 bg-transparent py-2 text-left text-[16px] leading-[1.35] text-[var(--chat-input-text)] placeholder:text-[var(--chat-input-placeholder)] outline-none disabled:cursor-not-allowed disabled:opacity-50 sm:text-[15px] sm:leading-normal"
              style={{ WebkitAppearance: 'none' }}
              placeholder="Escribe un mensaje en tu idioma…"
              value={message}
              onChange={(e) => onMessageChange(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSend();
                }
              }}
              aria-label="Mensaje"
              disabled={disabled}
            />
            <TapButton
              onPointerDown={preventInputBlur}
              onMouseDown={preventInputBlur}
              onTouchStart={preventInputBlur}
              onTap={handleSend}
              disabled={!canSend}
              className="app-touchable touch-target app-hover mb-0.5 shrink-0 rounded-lg btn-gradient px-3 py-2.5 text-xs font-semibold disabled:cursor-not-allowed disabled:opacity-40"
            >
              Enviar
            </TapButton>
          </div>
        </div>
      )}
    </div>
  );
}
