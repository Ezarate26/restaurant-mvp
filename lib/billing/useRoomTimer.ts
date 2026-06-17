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

export function useRoomTimer(
  createdAt: string | null | undefined,
  durationMs: number,
  extraMs = 0
): RoomTimerState {
  const [now, setNow] = useState(() => Date.now());

  const startedAt = useMemo(() => {
    if (!createdAt) return Date.now();
    const parsed = Date.parse(createdAt);
    return Number.isFinite(parsed) ? parsed : Date.now();
  }, [createdAt]);

  const endsAt = startedAt + durationMs + extraMs;

  useEffect(() => {
    const id = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(id);
  }, []);

  const totalMs = durationMs + extraMs;
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
