'use client';

import { TapButton } from '@/components/ui/TapButton';

function formatDuration(ms: number): string {
  const totalSec = Math.floor(ms / 1000);
  const min = Math.floor(totalSec / 60);
  const sec = totalSec % 60;
  return `${min}:${sec.toString().padStart(2, '0')}`;
}

type VoiceRecordingBarProps = {
  waveformLevels: number[];
  durationMs: number;
  micActive: boolean;
  micMuted?: boolean;
  saving?: boolean;
  canSend?: boolean;
  onCancel: () => void;
  onSend: () => void;
};

export function VoiceRecordingBar({
  waveformLevels,
  durationMs,
  micActive,
  micMuted = false,
  saving = false,
  canSend = true,
  onCancel,
  onSend,
}: VoiceRecordingBarProps) {
  if (saving) {
    return (
      <div className="flex items-center gap-3 rounded-lg bg-[var(--app-panel-hover)] px-4 py-3 ring-1 ring-[var(--app-border)]">
        <span className="inline-block h-5 w-5 animate-spin rounded-full border-2 border-[var(--app-accent)] border-t-transparent" />
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-[var(--app-text)]">
            Guardando audio…
          </p>
          <p className="text-xs text-[var(--app-muted)]">
            Subiendo y procesando
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2 rounded-lg bg-[var(--app-panel-hover)] px-3 py-2.5 ring-1 ring-[var(--app-border)]">
      <TapButton
        onTap={onCancel}
        aria-label="Cancelar grabación"
        className="app-hover touch-target flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-[var(--app-danger)] hover:bg-[var(--app-hover-bg)]"
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
          <path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z" />
        </svg>
      </TapButton>

      <div className="flex min-w-0 flex-1 flex-col gap-1">
        <div className="flex items-center gap-2">
          <span
            className={`h-2 w-2 shrink-0 rounded-full ${micActive ? 'animate-pulse bg-[var(--app-success)]' : 'bg-[var(--app-muted)]'}`}
          />
          <span className="font-mono text-sm font-semibold tabular-nums text-[var(--app-text)]">
            {formatDuration(durationMs)}
          </span>
          <span className="truncate text-[11px] text-[var(--app-muted)]">
            {micMuted
              ? 'Micrófono silenciado'
              : micActive
                ? 'Te escucho…'
                : 'Habla ahora…'}
          </span>
        </div>

        <div
          className="flex h-8 items-end justify-center gap-[2px] overflow-hidden px-1"
          aria-hidden
        >
          {waveformLevels.map((level, i) => (
            <span
              key={i}
              className="w-[3px] rounded-full bg-[var(--app-success)] transition-[height] duration-75 ease-out"
              style={{ height: `${Math.round(level * 100)}%`, minHeight: '3px' }}
            />
          ))}
        </div>
      </div>

      <TapButton
        onTap={onSend}
        disabled={!canSend}
        aria-label="Enviar audio"
        className="app-hover touch-target flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[var(--app-success)] text-white hover:brightness-110 disabled:opacity-40"
      >
        <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
          <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z" />
        </svg>
      </TapButton>
    </div>
  );
}
