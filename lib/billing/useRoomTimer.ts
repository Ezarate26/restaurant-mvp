'use client';

import { useEffect, useMemo, useState } from 'react';

type RoomTimerState = {
  remainingMs: number;
  totalMs: number;
  expired: boolean;
  progress: number;
  label: string;
};

function formatRemaining(ms: number): string {
  const totalSec = Math.max(0, Math.ceil(ms / 1000));
  const min = Math.floor(totalSec / 60);
  const sec = totalSec % 60;
  return `${min}:${sec.toString().padStart(2, '0')}`;
}

type UseRoomTimerOptions = {
  /** Tiempo fijo sin cuenta regresiva (esperando 2.º participante o pausa). */
  holdRemainingMs?: number;
  holdProgress?: number;
  /** En espera de 2.º participante: nunca marcar como expirado. */
  holdWaiting?: boolean;
};

export function useRoomTimer(
  startedAtIso: string | null | undefined,
  durationMs: number,
  extraMs = 0,
  options?: UseRoomTimerOptions
): RoomTimerState {
  const [now, setNow] = useState(() => Date.now());

  const startedAt = useMemo(() => {
    if (!startedAtIso) return null;
    const parsed = Date.parse(startedAtIso);
    return Number.isFinite(parsed) ? parsed : null;
  }, [startedAtIso]);

  const endsAt =
    startedAt != null ? startedAt + durationMs + extraMs : null;

  useEffect(() => {
    if (options?.holdRemainingMs != null) return;
    const id = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(id);
  }, [options?.holdRemainingMs]);

  const totalMs = durationMs + extraMs;

  if (options?.holdRemainingMs != null) {
    const remainingMs = Math.max(0, options.holdRemainingMs);
    const progress =
      options.holdProgress ??
      (totalMs > 0 ? Math.min(1, 1 - remainingMs / totalMs) : 0);
    const expired = !options.holdWaiting && remainingMs <= 0;
    return {
      remainingMs,
      totalMs,
      expired,
      progress,
      label: expired ? 'Tiempo agotado' : formatRemaining(remainingMs),
    };
  }

  if (endsAt == null) {
    return {
      remainingMs: totalMs,
      totalMs,
      expired: false,
      progress: 0,
      label: formatRemaining(totalMs),
    };
  }

  const remainingMs = Math.max(0, endsAt - now);
  const expired = remainingMs <= 0;
  const progress = totalMs > 0 ? Math.min(1, 1 - remainingMs / totalMs) : 1;

  return {
    remainingMs,
    totalMs,
    expired,
    progress,
    label: expired ? 'Tiempo agotado' : formatRemaining(remainingMs),
  };
}
