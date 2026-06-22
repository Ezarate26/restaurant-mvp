'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import type { ConversationMember } from '@/lib/model/types';
import { computeRoomRemainingMs } from '@/lib/billing/room-timer';
import { resolveRoomTimerStartedAt } from '@/lib/billing/resolve-room-timer-started-at';
import { useRoomTimer } from '@/lib/billing/useRoomTimer';

function computeRemainingFromStart(
  startedAt: string,
  durationMs: number,
  extraMs: number
): number {
  return (
    computeRoomRemainingMs(startedAt, durationMs, extraMs) ?? durationMs + extraMs
  );
}

export function useRoomParticipantTimer(
  members: Pick<ConversationMember, 'joined_at' | 'left_at'>[],
  durationMs: number,
  extraMs = 0,
  persistedStartedAt?: string | null
) {
  const totalMs = durationMs + extraMs;
  const activeCount = useMemo(
    () => members.filter((m) => !m.left_at).length,
    [members]
  );
  const participantStartedAt = useMemo(() => {
    if (persistedStartedAt) return persistedStartedAt;
    return resolveRoomTimerStartedAt(members);
  }, [persistedStartedAt, members]);

  const [pausedRemainingMs, setPausedRemainingMs] = useState<number | null>(
    null
  );
  const [syntheticStartedAt, setSyntheticStartedAt] = useState<string | null>(
    null
  );
  const prevActiveCountRef = useRef(activeCount);
  const runningStartedAtRef = useRef<string | null>(null);
  const pauseInitializedRef = useRef(false);

  const effectiveStartedAt = syntheticStartedAt ?? participantStartedAt;

  useEffect(() => {
    if (activeCount >= 2 && effectiveStartedAt) {
      runningStartedAtRef.current = effectiveStartedAt;
    }
  }, [activeCount, effectiveStartedAt]);

  useEffect(() => {
    if (
      pauseInitializedRef.current ||
      activeCount >= 2 ||
      !participantStartedAt
    ) {
      return;
    }
    pauseInitializedRef.current = true;
    setPausedRemainingMs(
      computeRemainingFromStart(participantStartedAt, durationMs, extraMs)
    );
  }, [activeCount, participantStartedAt, totalMs]);

  useEffect(() => {
    const prev = prevActiveCountRef.current;

    if (prev >= 2 && activeCount < 2) {
      const started = runningStartedAtRef.current;
      if (started) {
        setPausedRemainingMs(
          computeRemainingFromStart(started, durationMs, extraMs)
        );
        setSyntheticStartedAt(null);
      }
    }

    if (prev < 2 && activeCount >= 2 && pausedRemainingMs != null) {
      const resumeStart = Date.now() - (totalMs - pausedRemainingMs);
      setSyntheticStartedAt(new Date(resumeStart).toISOString());
      setPausedRemainingMs(null);
    }

    prevActiveCountRef.current = activeCount;
  }, [activeCount, totalMs, pausedRemainingMs]);

  const waitingForParticipants =
    activeCount < 2 &&
    pausedRemainingMs == null &&
    syntheticStartedAt == null &&
    !participantStartedAt;

  const holdRemainingMs = waitingForParticipants
    ? totalMs
    : activeCount < 2 && pausedRemainingMs != null
      ? pausedRemainingMs
      : undefined;

  const holdProgress =
    holdRemainingMs != null && totalMs > 0
      ? waitingForParticipants
        ? 0
        : 1 - holdRemainingMs / totalMs
      : undefined;

  const timer = useRoomTimer(
    waitingForParticipants || (activeCount < 2 && pausedRemainingMs != null)
      ? null
      : effectiveStartedAt,
    durationMs,
    extraMs,
    holdRemainingMs != null
      ? {
          holdRemainingMs,
          holdProgress: holdProgress ?? 0,
          holdWaiting: waitingForParticipants,
        }
      : undefined
  );

  return {
    ...timer,
    waitingForParticipants,
  };
}
