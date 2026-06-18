'use client';

import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { useCallback, useEffect, useState } from 'react';
import { BillingPlansSection } from '@/components/billing/BillingPlansSection';
import { BillingStatusBadge } from '@/components/billing/BillingStatusBadge';
import { isStripePricingTableConfigured } from '@/components/billing/StripePricingTable';
import { canShowStripeTrial } from '@/lib/billing/billing-state';
import { AppShell } from '@/components/layout/AppShell';
import { useSupabaseAuth } from '@/lib/hooks/useSupabaseAuth';
import { usePlan } from '@/lib/billing/PlanProvider';
import { AUTH_HOME_PATH } from '@/lib/constants/routes';
import { uiCard } from '@/components/ui/ui-classes';
import { PRO_TRIAL_DAYS } from '@/lib/billing/constants';

export function BillingPageClient() {
  const searchParams = useSearchParams();
  const roomId = searchParams.get('room');
  const checkout = searchParams.get('checkout');
  const [notice, setNotice] = useState<string | null>(null);
  const [busyPlanId, setBusyPlanId] = useState<string | null>(null);
  const [pricingEpoch, setPricingEpoch] = useState(0);

  const {
    billing,
    tier,
    uiMode,
    isAuthenticated,
    isLoading,
    upgradeToPro,
    buyRoomPass,
    manageBilling,
    refreshPlan,
  } = usePlan();
  const { user } = useSupabaseAuth();

  const reloadBilling = useCallback(async () => {
    const state = await refreshPlan(roomId ?? undefined);
    if (state) setPricingEpoch((e) => e + 1);
    return state;
  }, [refreshPlan, roomId]);

  useEffect(() => {
    void reloadBilling();
  }, [reloadBilling]);

  useEffect(() => {
    if (checkout === 'success') {
      setNotice('Pago recibido. Sincronizando tu plan…');
      void reloadBilling().then(() => {
        setNotice('Plan actualizado. Si no ves cambios, espera unos segundos.');
        window.setTimeout(() => setNotice(null), 5000);
      });
    } else if (checkout === 'cancel') {
      setNotice('Pago cancelado. Tu plan no ha cambiado.');
      void reloadBilling();
      window.setTimeout(() => setNotice(null), 4000);
    }
  }, [checkout, reloadBilling]);

  useEffect(() => {
    const onPageShow = (event: PageTransitionEvent) => {
      if (!event.persisted) return;
      void reloadBilling();
    };
    window.addEventListener('pageshow', onPageShow);
    return () => window.removeEventListener('pageshow', onPageShow);
  }, [reloadBilling]);

  const clientReferenceId = user?.id
    ? roomId
      ? `${user.id}:${roomId}`
      : user.id
    : null;

  const showStripeEmbed =
    uiMode === 'free' &&
    isStripePricingTableConfigured() &&
    canShowStripeTrial(billing) &&
    billing.tier === 'free';

  const handleUpgradePro = async () => {
    setNotice(null);
    setBusyPlanId('pro');
    try {
      await upgradeToPro('/app/billing');
    } catch (e) {
      setNotice(e instanceof Error ? e.message : 'Error al iniciar checkout');
    } finally {
      setBusyPlanId(null);
    }
  };

  const handleBuyRoomPass = async () => {
    setNotice(null);
    if (!roomId) {
      setNotice(
        'Abre esta página desde una sala para comprar el pase, o crea una sala primero.'
      );
      return;
    }
    setBusyPlanId('room_pass');
    try {
      await buyRoomPass(roomId, '/app/billing');
    } catch (e) {
      setNotice(e instanceof Error ? e.message : 'Error al iniciar checkout');
    } finally {
      setBusyPlanId(null);
    }
  };

  return (
    <AppShell maxWidth="full">
      <div className="mx-auto max-w-5xl space-y-6">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
              Planes y facturación
            </h1>
            <p className="mt-2 text-sm text-[var(--app-muted)]">
              Todos los planes en USD. Pro incluye {PRO_TRIAL_DAYS} días de prueba gratis.
              El estado del plan siempre viene del servidor.
            </p>
          </div>
          <BillingStatusBadge
            tier={tier}
            roomPassActive={billing.roomPassActive && tier !== 'pro'}
          />
        </div>

        {!isAuthenticated ? (
          <div className={uiCard}>
            <p className="text-sm text-[var(--app-muted)]">
              Para hacerse Pro necesitas una cuenta registrada.
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              <Link
                href="/auth/register?redirect=/app/billing"
                className="text-sm font-semibold text-[var(--app-primary)] hover:underline"
              >
                Crear cuenta
              </Link>
              <span className="text-[var(--app-muted)]">·</span>
              <Link
                href="/auth/login?redirect=/app/billing"
                className="text-sm font-semibold text-[var(--app-primary)] hover:underline"
              >
                Iniciar sesión
              </Link>
            </div>
          </div>
        ) : null}

        {isLoading && isAuthenticated ? (
          <p className="text-center text-sm text-[var(--app-muted)]">
            Cargando tu plan…
          </p>
        ) : null}

        {notice ? (
          <p className="rounded-xl border border-[var(--app-warning)]/30 bg-[var(--app-warning)]/10 px-4 py-3 text-sm text-[var(--app-warning)]">
            {notice}
          </p>
        ) : null}

        <BillingPlansSection
          key={pricingEpoch}
          uiMode={uiMode}
          billing={billing}
          busyPlanId={busyPlanId}
          customerEmail={user?.email ?? null}
          clientReferenceId={clientReferenceId}
          roomId={roomId}
          showStripeEmbed={showStripeEmbed}
          onUpgradePro={() => void handleUpgradePro()}
          onBuyRoomPass={() => void handleBuyRoomPass()}
          onManageBilling={() => void manageBilling('/app/billing')}
        />

        <p className="text-center text-xs text-[var(--app-muted)]">
          <Link href={AUTH_HOME_PATH} className="hover:text-[var(--app-text)]">
            ← Volver al inicio
          </Link>
        </p>
      </div>
    </AppShell>
  );
}
