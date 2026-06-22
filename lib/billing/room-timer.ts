export function computeRoomEndsAtMs(
  startedAtIso: string | null | undefined,
  durationMs: number,
  extraMs = 0
): number | null {
  if (!startedAtIso) return null;
  const started = Date.parse(startedAtIso);
  if (!Number.isFinite(started)) return null;
  return started + durationMs + extraMs;
}

export function computeRoomRemainingMs(
  startedAtIso: string | null | undefined,
  durationMs: number,
  extraMs = 0,
  now = Date.now()
): number | null {
  const endsAt = computeRoomEndsAtMs(startedAtIso, durationMs, extraMs);
  if (endsAt == null) return null;
  return Math.max(0, endsAt - now);
}

/** El tiempo solo corre con al menos 2 participantes activos. */
export function isRoomTimerExpired(
  startedAtIso: string | null | undefined,
  durationMs: number,
  extraMs: number,
  activeParticipantCount: number,
  now = Date.now()
): boolean {
  if (activeParticipantCount < 2) return false;
  const endsAt = computeRoomEndsAtMs(startedAtIso, durationMs, extraMs);
  if (endsAt == null) return false;
  return now >= endsAt;
}
