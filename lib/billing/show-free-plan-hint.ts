import type { BillingUiMode } from '@/lib/billing/billing-state';
import type { PlanTier } from '@/lib/billing/types';

/** Aviso de límites Free solo para usuarios Free uniéndose o creando en contexto Free. */
export function shouldShowFreePlanLimitsHint(options: {
  userTier?: PlanTier;
  roomUiMode?: BillingUiMode | null;
}): boolean {
  if (options.userTier === 'pro') return false;
  if (options.roomUiMode != null) {
    return options.roomUiMode === 'free';
  }
  return true;
}
