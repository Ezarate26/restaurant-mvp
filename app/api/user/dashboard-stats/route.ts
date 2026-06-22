import { NextResponse } from 'next/server';
import {
  FREE_DAILY_CONVERSATION_LIMIT,
  FREE_LIMITS,
  PRO_LIMITS,
  ROOM_PASS_DURATION_MINUTES,
} from '@/lib/billing/constants';
import {
  getOrCreateBillingRow,
  fetchActiveRoomPassesForUser,
  fetchUserHourBalanceMs,
  resolveEffectiveTier,
} from '@/lib/billing/billing.repository';
import { getFreeCreateEligibility } from '@/lib/billing/free-daily-limit.server';
import { getUserIdFromRequest } from '@/lib/billing/server-auth';
import { createSupabaseServiceRole } from '@/lib/supabase/service';

export async function GET(request: Request) {
  const userId = await getUserIdFromRequest(request);
  if (!userId) {
    return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
  }

  const url = new URL(request.url);
  const deviceId = url.searchParams.get('deviceId')?.trim() || null;

  try {
    const service = createSupabaseServiceRole();
    const billing = await getOrCreateBillingRow(service, userId);
    const tier = resolveEffectiveTier(billing);
    const eligibility = await getFreeCreateEligibility(service, {
      userId,
      deviceId,
    });
    const [activePasses, hourBalanceMs] = await Promise.all([
      fetchActiveRoomPassesForUser(service, userId),
      fetchUserHourBalanceMs(service, userId),
    ]);

    let hoursRemainingLabel: string;
    let timeAvailableLabel: string;

    if (tier === 'pro') {
      hoursRemainingLabel = 'unlimited';
      timeAvailableLabel = 'unlimited';
    } else if (hourBalanceMs > 0) {
      const hours = (hourBalanceMs / 3_600_000).toFixed(1);
      hoursRemainingLabel = `${hours} h`;
      timeAvailableLabel = `${hours} h`;
    } else if (activePasses.length > 0) {
      const latest = activePasses[0];
      const msLeft = Math.max(0, Date.parse(latest.expiresAt) - Date.now());
      const mins = Math.ceil(msLeft / 60_000);
      hoursRemainingLabel = `${mins} min`;
      timeAvailableLabel = 'room_pass';
    } else {
      hoursRemainingLabel = 'per_room';
      const minsLeft = eligibility.remaining * FREE_LIMITS.roomDurationMinutes;
      timeAvailableLabel = `${minsLeft} min`;
    }

    return NextResponse.json({
      tier,
      planLabel: tier === 'pro' ? 'Pro' : 'Free',
      hoursRemaining: hoursRemainingLabel,
      chatsUsedToday: eligibility.unlimited
        ? 0
        : FREE_DAILY_CONVERSATION_LIMIT - eligibility.remaining,
      chatsLimitToday: eligibility.unlimited
        ? null
        : FREE_DAILY_CONVERSATION_LIMIT,
      chatsRemainingToday: eligibility.unlimited ? null : eligibility.remaining,
      timeAvailable: timeAvailableLabel,
      roomDurationMinutes:
        tier === 'pro' ? PRO_LIMITS.roomDurationMinutes : FREE_LIMITS.roomDurationMinutes,
      roomPassMinutes: ROOM_PASS_DURATION_MINUTES,
      hasActiveRoomPass: activePasses.length > 0,
      hourBalanceMs,
    });
  } catch (e) {
    console.error('GET /api/user/dashboard-stats', e);
    return NextResponse.json(
      { error: 'No se pudieron cargar las estadísticas' },
      { status: 500 }
    );
  }
}
