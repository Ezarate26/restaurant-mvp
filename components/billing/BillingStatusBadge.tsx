import type { PlanTier } from '@/lib/billing/types';

type BillingStatusBadgeProps = {
  tier: PlanTier;
  roomPassActive?: boolean;
  compact?: boolean;
};

export function BillingStatusBadge({
  tier,
  roomPassActive = false,
  compact = false,
}: BillingStatusBadgeProps) {
  const isPro = tier === 'pro' || roomPassActive;
  const label =
    tier === 'pro'
      ? 'Pro'
      : roomPassActive
        ? 'Room Pass'
        : 'Free';

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full font-semibold uppercase tracking-wider ${
        compact ? 'px-2 py-0.5 text-[10px]' : 'px-2.5 py-1 text-[11px]'
      } ${
        isPro
          ? 'bg-[var(--app-primary)]/15 text-[var(--app-primary)] ring-1 ring-[var(--app-primary)]/25'
          : 'bg-[var(--app-hover-bg)] text-[var(--app-muted)] ring-1 ring-[var(--app-border)]'
      }`}
    >
      {isPro ? (
        <span className="inline-block h-1.5 w-1.5 rounded-full bg-[var(--app-primary)]" />
      ) : null}
      {label}
    </span>
  );
}
