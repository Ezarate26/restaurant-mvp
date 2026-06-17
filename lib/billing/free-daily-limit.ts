import {
  FREE_DAILY_CONVERSATION_LIMIT,
  FREE_DAILY_WINDOW_MS,
} from '@/lib/billing/constants';

export type FreeDailyUsageSnapshot = {
  count: number;
  limit: number;
  canCreate: boolean;
  windowEndsAt: string | null;
  remaining: number;
};

export function computeFreeDailyUsage(
  conversationCreatedAts: string[],
  nowMs = Date.now()
): FreeDailyUsageSnapshot {
  const limit = FREE_DAILY_CONVERSATION_LIMIT;
  const sorted = [...conversationCreatedAts]
    .map((iso) => Date.parse(iso))
    .filter((t) => !Number.isNaN(t))
    .sort((a, b) => a - b);

  let windowStart: number | null = null;
  let count = 0;

  for (const t of sorted) {
    if (windowStart === null || t >= windowStart + FREE_DAILY_WINDOW_MS) {
      windowStart = t;
      count = 1;
    } else {
      count += 1;
    }
  }

  if (windowStart === null || nowMs >= windowStart + FREE_DAILY_WINDOW_MS) {
    return {
      count: 0,
      limit,
      canCreate: true,
      windowEndsAt: null,
      remaining: limit,
    };
  }

  const windowEndsAt = new Date(windowStart + FREE_DAILY_WINDOW_MS).toISOString();
  const remaining = Math.max(0, limit - count);

  return {
    count,
    limit,
    canCreate: count < limit,
    windowEndsAt,
    remaining,
  };
}

export function formatFreeDailyLimitMessage(
  usage: FreeDailyUsageSnapshot
): string {
  if (usage.canCreate) return '';

  const resetLabel = usage.windowEndsAt
    ? new Date(usage.windowEndsAt).toLocaleString('es-MX', {
        dateStyle: 'short',
        timeStyle: 'short',
      })
    : 'pronto';

  return `Has alcanzado el límite de ${usage.limit} conversaciones gratuitas en 24 horas. Podrás crear otra sala después del ${resetLabel}, o pásate a Pro para conversaciones ilimitadas.`;
}
