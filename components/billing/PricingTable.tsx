'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';
import type { LandingLang } from '@/lib/i18n/landing';
import { LANDING_COPY } from '@/lib/i18n/landing';
import type { PlanDefinition } from '@/lib/billing/types';
import {
  getLocalizedPlanDefinitions,
  getPlanCardCopy,
} from '@/lib/billing/localized-plan-definitions';
import { PlanCard } from '@/components/billing/PlanCard';
import {
  isStripePricingTableConfigured,
  StripePricingTable,
} from '@/components/billing/StripePricingTable';

type PricingTableProps = {
  currentPlanId?: string;
  onSelectPlan: (planId: PlanDefinition['id']) => void | Promise<void>;
  compact?: boolean;
  variant?: 'marketing' | 'billing';
  customerEmail?: string | null;
  clientReferenceId?: string | null;
  locale?: LandingLang;
};

export function PricingTable({
  currentPlanId,
  onSelectPlan,
  compact = false,
  variant = 'marketing',
  customerEmail = null,
  clientReferenceId = null,
  locale = 'es',
}: PricingTableProps) {
  const [busyId, setBusyId] = useState<string | null>(null);
  const stripeEmbed = isStripePricingTableConfigured();
  const landingPricing = LANDING_COPY[locale];
  const plans = useMemo(() => getLocalizedPlanDefinitions(locale), [locale]);
  const planCardCopy = useMemo(() => getPlanCardCopy(locale), [locale]);

  const handleSelect = async (planId: PlanDefinition['id']) => {
    setBusyId(planId);
    try {
      await onSelectPlan(planId);
    } finally {
      setBusyId(null);
    }
  };

  return (
    <section className={compact ? 'space-y-4' : 'space-y-6'}>
      {!compact ? (
        <div className="text-center">
          <p className="text-xs font-semibold uppercase tracking-widest text-[var(--app-primary)]">
            {landingPricing.pricingBadge}
          </p>
          <h2 className="mt-2 text-2xl font-bold tracking-tight sm:text-3xl">
            {variant === 'billing' ? landingPricing.pricingTitle : landingPricing.pricingTitle}
          </h2>
          <p className="mx-auto mt-3 max-w-xl text-sm text-[var(--app-muted)]">
            {variant === 'billing' && stripeEmbed
              ? locale === 'en'
                ? 'All prices in USD. Free plan needs no payment — start anytime.'
                : 'Todos los precios en USD. El plan Free no requiere pago — empieza cuando quieras.'
              : landingPricing.pricingSubtitle}
          </p>
        </div>
      ) : null}

      {variant === 'billing' && stripeEmbed ? (
        <div className="space-y-4">
          {currentPlanId === 'free' ? (
            <p className="rounded-xl border border-[var(--app-border)] bg-[var(--app-card)] px-4 py-3 text-center text-sm text-[var(--app-muted)]">
              Estás en <span className="font-semibold text-[var(--app-text)]">Free</span>.
              {' '}
              <Link href="/create" className="font-semibold text-[var(--app-primary)] hover:underline">
                Crear sala gratis →
              </Link>
            </p>
          ) : null}

          <StripePricingTable
            customerEmail={customerEmail}
            clientReferenceId={clientReferenceId}
            className="w-full"
          />
        </div>
      ) : variant === 'billing' ? (
        <div className="grid gap-5 md:grid-cols-3">
          {plans.map((plan) => (
            <PlanCard
              key={plan.id}
              plan={plan}
              currentPlanId={currentPlanId}
              busy={busyId === plan.id}
              onSelect={handleSelect}
              cardCopy={planCardCopy}
            />
          ))}
        </div>
      ) : (
        <div className="grid gap-5 md:grid-cols-3">
          {plans.map((plan) => (
            <PlanCard
              key={plan.id}
              plan={plan}
              currentPlanId={currentPlanId}
              busy={busyId === plan.id}
              onSelect={handleSelect}
              cardCopy={planCardCopy}
            />
          ))}
        </div>
      )}
    </section>
  );
}
