import type { PlanDefinition } from '@/lib/billing/types';
import type { AppMessages } from '@/lib/i18n/messages';
import { uiBtnPrimary, uiBtnSecondary } from '@/components/ui/ui-classes';

type PlanCardCopy = AppMessages['landing']['planCard'];

type PlanCardProps = {
  plan: PlanDefinition;
  currentPlanId?: string;
  busy?: boolean;
  disabled?: boolean;
  disabledReason?: string;
  ctaOverride?: string;
  cardCopy?: PlanCardCopy;
  onSelect: (planId: PlanDefinition['id']) => void;
};

const DEFAULT_CARD_COPY: PlanCardCopy = {
  recommended: 'Recomendado',
  currentPlan: 'Plan actual',
  processing: 'Procesando…',
  perMonth: 'por mes',
  oneTime: 'pago único',
  usd: 'USD',
};

export function PlanCard({
  plan,
  currentPlanId,
  busy = false,
  disabled = false,
  disabledReason,
  ctaOverride,
  cardCopy = DEFAULT_CARD_COPY,
  onSelect,
}: PlanCardProps) {
  const isCurrent = currentPlanId === plan.id;
  const isHighlighted = plan.highlighted;
  const isDisabled = disabled || busy || isCurrent;

  return (
    <article
      className={`relative flex flex-col rounded-2xl border p-6 transition duration-200 ${
        isHighlighted
          ? 'border-[var(--app-primary)]/50 bg-[var(--app-card)] shadow-lg ring-1 ring-[var(--app-primary)]/30'
          : 'border-[var(--app-border)] bg-[var(--app-card)]/80'
      }`}
    >
      {isHighlighted ? (
        <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-[var(--app-primary)] px-3 py-0.5 text-[10px] font-bold uppercase tracking-wider text-white">
          {cardCopy.recommended}
        </span>
      ) : null}

      <div className="mb-5">
        <h3 className="text-lg font-bold">{plan.name}</h3>
        <p className="mt-2 text-3xl font-bold tracking-tight">{plan.priceLabel}</p>
        {plan.currency === 'usd' && plan.id !== 'free' ? (
          <p className="mt-1 text-xs text-[var(--app-muted)]">
            {cardCopy.usd}
            {plan.interval === 'monthly'
              ? ` · ${cardCopy.perMonth}`
              : plan.interval === 'one_time'
                ? ` · ${cardCopy.oneTime}`
                : ''}
          </p>
        ) : plan.interval === 'monthly' ? (
          <p className="mt-1 text-xs text-[var(--app-muted)]">{cardCopy.perMonth}</p>
        ) : plan.interval === 'one_time' ? (
          <p className="mt-1 text-xs text-[var(--app-muted)]">{cardCopy.oneTime}</p>
        ) : null}
      </div>

      <ul className="mb-6 flex-1 space-y-2.5 text-sm text-[var(--app-muted)]">
        {plan.features.map((feature) => (
          <li key={feature} className="flex items-start gap-2">
            <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-[var(--app-primary)]" />
            <span>{feature}</span>
          </li>
        ))}
      </ul>

      <button
        type="button"
        disabled={isDisabled}
        onClick={() => onSelect(plan.id)}
        className={
          isHighlighted || plan.id === 'pro'
            ? `${uiBtnPrimary} ${isCurrent || disabled ? 'opacity-60' : ''}`
            : `${uiBtnSecondary} ${isCurrent || disabled ? 'opacity-60' : ''}`
        }
      >
        {isCurrent
          ? cardCopy.currentPlan
          : busy
            ? cardCopy.processing
            : ctaOverride ?? plan.cta}
      </button>
      {disabled && disabledReason ? (
        <p className="mt-2 text-center text-xs text-[var(--app-muted)]">
          {disabledReason}
        </p>
      ) : null}
    </article>
  );
}
