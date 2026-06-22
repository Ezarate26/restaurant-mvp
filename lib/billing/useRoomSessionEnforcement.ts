'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import type { BillingUiMode } from '@/lib/billing/billing-state';
import {
  PRO_ROOM_EXTENSION_MS,
  ROOM_GRACE_PERIOD_MS,
  ROOM_PASS_DURATION_MINUTES,
} from '@/lib/billing/constants';
import { consumePendingRoomPassExtension } from '@/lib/billing/room-session.storage';
import type { ConversationMember } from '@/lib/model/types';
import { useRoomParticipantTimer } from '@/lib/billing/useRoomParticipantTimer';

export type FreeSessionEndedKind = 'owner-upgrade' | 'guest-ended' | null;

type UseRoomSessionEnforcementArgs = {
  conversationId: string;
  members: Pick<ConversationMember, 'joined_at' | 'left_at'>[];
  roomTimerStartedAt?: string | null;
  durationMs: number;
  sessionExtraMs: number;
  uiMode: BillingUiMode;
  isOwner: boolean;
  isConversationActive: boolean;
  hasActiveRoomPass: boolean;
  onEndSession: () => void | Promise<void>;
  onExtendSession: (extraMs: number) => void | Promise<void>;
  onFreeGuestExpire?: () => void | Promise<void>;
  onEnforceExpiry?: () => void | Promise<void>;
};

export function useRoomSessionEnforcement({
  conversationId,
  members,
  roomTimerStartedAt = null,
  durationMs,
  sessionExtraMs,
  uiMode,
  isOwner,
  isConversationActive,
  hasActiveRoomPass,
  onEndSession,
  onExtendSession,
  onFreeGuestExpire,
  onEnforceExpiry,
}: UseRoomSessionEnforcementArgs) {
  const [expiredModalOpen, setExpiredModalOpen] = useState(false);
  const [graceEndsAt, setGraceEndsAt] = useState<number | null>(null);
  const [graceRemainingMs, setGraceRemainingMs] = useState(0);
  const [sessionEnding, setSessionEnding] = useState(false);
  const [freeEndedKind, setFreeEndedKind] =
    useState<FreeSessionEndedKind>(null);
  const freeEndedHandledRef = useRef(false);
  const onEndSessionRef = useRef(onEndSession);
  onEndSessionRef.current = onEndSession;
  const onFreeGuestExpireRef = useRef(onFreeGuestExpire);
  onFreeGuestExpireRef.current = onFreeGuestExpire;
  const onEnforceExpiryRef = useRef(onEnforceExpiry);
  onEnforceExpiryRef.current = onEnforceExpiry;

  const timer = useRoomParticipantTimer(
    members,
    durationMs,
    sessionExtraMs,
    roomTimerStartedAt
  );

  useEffect(() => {
    if (
      !consumePendingRoomPassExtension(conversationId) ||
      !hasActiveRoomPass ||
      !isOwner
    ) {
      return;
    }
    void onExtendSession(ROOM_PASS_DURATION_MINUTES * 60_000);
  }, [conversationId, hasActiveRoomPass, isOwner, onExtendSession]);

  useEffect(() => {
    if (!isConversationActive && uiMode !== 'free') {
      setExpiredModalOpen(false);
      setGraceEndsAt(null);
    }
    if (!timer.expired && expiredModalOpen) {
      setExpiredModalOpen(false);
      setGraceEndsAt(null);
    }
  }, [timer.expired, expiredModalOpen, isConversationActive, uiMode]);

  useEffect(() => {
    if (!timer.expired || freeEndedHandledRef.current) return;

    if (uiMode === 'free') {
      freeEndedHandledRef.current = true;
      if (isOwner) {
        setFreeEndedKind('owner-upgrade');
        void (async () => {
          try {
            await onEnforceExpiryRef.current?.();
            await onEndSessionRef.current();
          } catch (e) {
            console.error('useRoomSessionEnforcement:freeOwnerEnd', e);
            freeEndedHandledRef.current = false;
            setFreeEndedKind(null);
          }
        })();
      } else {
        setFreeEndedKind('guest-ended');
        void (async () => {
          try {
            await onEnforceExpiryRef.current?.();
            await onFreeGuestExpireRef.current?.();
          } catch (e) {
            console.error('useRoomSessionEnforcement:freeGuestEnd', e);
            freeEndedHandledRef.current = false;
            setFreeEndedKind(null);
          }
        })();
      }
      return;
    }

    if (!isConversationActive || expiredModalOpen || sessionEnding) return;

    setExpiredModalOpen(true);
    if (isOwner) {
      setGraceEndsAt(Date.now() + ROOM_GRACE_PERIOD_MS);
    }
  }, [
    timer.expired,
    isConversationActive,
    expiredModalOpen,
    sessionEnding,
    isOwner,
    uiMode,
  ]);

  useEffect(() => {
    if (!expiredModalOpen || !graceEndsAt || !isOwner) {
      setGraceRemainingMs(0);
      return;
    }

    const tick = () => {
      const remaining = Math.max(0, graceEndsAt - Date.now());
      setGraceRemainingMs(remaining);
      if (remaining <= 0 && !sessionEnding) {
        void (async () => {
          if (sessionEnding) return;
          setSessionEnding(true);
          setExpiredModalOpen(false);
          setGraceEndsAt(null);
          try {
            await onEndSessionRef.current();
          } catch (e) {
            console.error('useRoomSessionEnforcement:graceEnd', e);
            setSessionEnding(false);
          }
        })();
      }
    };

    tick();
    const id = window.setInterval(tick, 500);
    return () => window.clearInterval(id);
  }, [expiredModalOpen, graceEndsAt, sessionEnding, isOwner]);

  const handleEndSession = useCallback(async () => {
    if (sessionEnding) return;
    setSessionEnding(true);
    setExpiredModalOpen(false);
    setGraceEndsAt(null);
    try {
      await onEndSession();
    } catch (e) {
      console.error('useRoomSessionEnforcement:endSession', e);
      setSessionEnding(false);
    }
  }, [onEndSession, sessionEnding]);

  const handleProContinue = useCallback(async () => {
    await onExtendSession(PRO_ROOM_EXTENSION_MS);
    setExpiredModalOpen(false);
    setGraceEndsAt(null);
  }, [onExtendSession]);

  const dismissExpiredModal = useCallback(() => {
    setExpiredModalOpen(false);
    setGraceEndsAt(null);
  }, []);

  const roomTimeBlocked =
    freeEndedKind != null ||
    (isConversationActive && (timer.expired || expiredModalOpen));

  return {
    timer,
    expiredModalOpen,
    graceRemainingMs,
    freeEndedKind,
    roomTimeBlocked,
    sessionEnding,
    handleProContinue,
    handleEndSession,
    dismissExpiredModal,
  };
}
