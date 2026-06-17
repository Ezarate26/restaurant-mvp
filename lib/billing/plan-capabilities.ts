import {
  FREE_LIMITS,
  PRO_LIMITS,
  ROOM_PASS_DURATION_MINUTES,
} from '@/lib/billing/constants';
import type { PlanLimits, PlanTier } from '@/lib/billing/types';

export function getLimitsForTier(tier: PlanTier): PlanLimits {
  return tier === 'pro' ? PRO_LIMITS : FREE_LIMITS;
}

export function getEffectiveLimits(
  userTier: PlanTier,
  hasActiveRoomPass: boolean
): PlanLimits {
  if (userTier === 'pro' || hasActiveRoomPass) return PRO_LIMITS;
  return FREE_LIMITS;
}

export function canUseVoice(
  userTier: PlanTier,
  hasActiveRoomPass: boolean
): boolean {
  return getEffectiveLimits(userTier, hasActiveRoomPass).voiceEnabled;
}

export function getRoomDurationMs(
  userTier: PlanTier,
  hasActiveRoomPass: boolean
): number {
  const minutes = getEffectiveLimits(userTier, hasActiveRoomPass).roomDurationMinutes;
  return minutes * 60_000;
}

export function getRoomPassDurationMs(): number {
  return ROOM_PASS_DURATION_MINUTES * 60_000;
}
