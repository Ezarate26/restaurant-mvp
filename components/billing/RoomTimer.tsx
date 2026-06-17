'use client';

import { useRoomTimer } from '@/lib/billing/useRoomTimer';

type RoomTimerProps = {
  createdAt: string | null | undefined;
  durationMs: number;
  extraMs?: number;
  compact?: boolean;
};

export function RoomTimer({
  createdAt,
  durationMs,
  extraMs = 0,
  compact = false,
}: RoomTimerProps) {
  const { label, expired, progress, remainingMs } = useRoomTimer(
    createdAt,
    durationMs,
    extraMs
  );

  const urgent = !expired && remainingMs < 2 * 60_000;

  if (compact) {
    return (
      <span
        className={`inline-flex items-center gap-1.5 rounded-lg px-2 py-1 text-[11px] font-medium tabular-nums ${
          expired
            ? 'bg-[var(--app-danger)]/15 text-[var(--app-danger)]'
            : urgent
              ? 'bg-[var(--app-warning)]/15 text-[var(--app-warning)]'
              : 'bg-[var(--app-hover-bg)] text-[var(--app-muted)]'
        }`}
        title="Tiempo restante de la sala"
      >
        <span className="inline-block h-1.5 w-1.5 rounded-full bg-current" />
        {label}
      </span>
    );
  }

  return (
    <div className="rounded-xl border border-[var(--app-border)] bg-[var(--app-card)] p-3">
      <div className="flex items-center justify-between gap-2 text-xs">
        <span className="font-medium text-[var(--app-muted)]">Tiempo de sala</span>
        <span
          className={`font-semibold tabular-nums ${
            expired ? 'text-[var(--app-danger)]' : urgent ? 'text-[var(--app-warning)]' : ''
          }`}
        >
          {label}
        </span>
      </div>
      <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-[var(--app-hover-bg)]">
        <div
          className={`h-full rounded-full transition-all duration-1000 ${
            expired
              ? 'bg-[var(--app-danger)]'
              : urgent
                ? 'bg-[var(--app-warning)]'
                : 'btn-gradient'
          }`}
          style={{ width: `${Math.round(progress * 100)}%` }}
        />
      </div>
    </div>
  );
}
