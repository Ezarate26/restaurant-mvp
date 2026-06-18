'use client';

import type { PlanDefinition } from '@/lib/billing/types';
import type { BillingUiMode, UserBillingSnapshot } from '@/lib/billing/billing-state';
import { PLAN_DEFINITIONS, PRO_TRIAL_DAYS } from '@/lib/billing/constants';
import { PlanCard } from '@/components/billing/PlanCard';
import { StripePricingTable } from '@/components/billing/StripePricingTable';
import { uiBtnPrimary, uiCard } from '@/components/ui/ui-classes';

type BillingPlansSectionProps = {
  uiMode: BillingUiMode;
  billing: UserBillingSnapshot;
  busyPlanId: string | null;
  customerEmail?: string | null;
  clientReferenceId?: string | null;
  roomId?: string | null;
  showStripeEmbed: boolean;
  onUpgradePro: () => void;
  onBuyRoomPass: () => void;
  onManageBilling: () => void;
};

function formatRoomPassRemaining(expiresAt: string | null): string | null {
  if (!expiresAt) return null;
  const ms = Date.parse(expiresAt) - Date.now();
  if (Number.isNaN(ms) || ms <= 0) return null;
  const minutes = Math.ceil(ms / 60_000);
  if (minutes < 60) return `${minutes} min`;
  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;
  return rest > 0 ? `${hours} h ${rest} min` : `${hours} h`;
}

export function BillingPlansSection({
  uiMode,
  billing,
  busyPlanId,
  customerEmail,
  clientReferenceId,
  roomId,
  showStripeEmbed,
  onUpgradePro,
  onBuyRoomPass,
  onManageBilling,
}: BillingPlansSectionProps) {
  const remaining = formatRoomPassRemaining(billing.roomPassExpiresAt);

  if (uiMode === 'pro') {
    return (
      <div className="space-y-4">
        <div className={uiCard}>
          <p className="text-xs font-bold uppercase tracking-widest text-[var(--app-primary)]">
            Plan actual
          </p>
          <h2 className="mt-2 text-xl font-bold">Pro</h2>
          <p className="mt-2 text-sm text-[var(--app-muted)]">
            Tu suscripción está activa. Para cambiar de plan, actualizar tu tarjeta o
            cancelar, usa el portal seguro de Stripe.
          </p>
          {billing.proExpiresAt ? (
            <p className="mt-2 text-xs text-[var(--app-muted)]">
              Próximo ciclo:{' '}
              {new Date(billing.proExpiresAt).toLocaleDateString('es-MX')}
            </p>
          ) : null}
          <button
            type="button"
            onClick={onManageBilling}
            className={`${uiBtnPrimary} mt-5 w-auto px-6`}
          >
            Gestionar suscripción
          </button>
        </div>

        {billing.activeRoomPasses.length > 0 ? (
          <div className={`${uiCard} border-dashed`}>
            <h3 className="text-sm font-bold">Pases por sala activos</h3>
            <ul className="mt-3 space-y-2 text-sm text-[var(--app-muted)]">
              {billing.activeRoomPasses.map((pass) => (
                <li key={pass.conversationId}>
                  Sala {pass.conversationId.slice(0, 8)}… — expira{' '}
                  {new Date(pass.expiresAt).toLocaleString('es-MX')}
                </li>
              ))}
            </ul>
          </div>
        ) : null}
      </div>
    );
  }

  if (uiMode === 'room_pass') {
    return (
      <div className="space-y-4">
        <div className="rounded-xl border border-[var(--app-primary)]/30 bg-[var(--app-primary)]/10 px-4 py-4">
          <p className="text-xs font-bold uppercase tracking-widest text-[var(--app-primary)]">
            Room Pass activo
          </p>
          <p className="mt-2 text-sm text-[var(--app-text)]">
            Estás en modo Room Pass — características Pro en esta sala.
          </p>
          {remaining ? (
            <p className="mt-1 text-xs text-[var(--app-muted)]">
              Tiempo restante: {remaining}
            </p>
          ) : null}
        </div>

        <div className={uiCard}>
          <h2 className="text-lg font-bold">Actualizar a Pro</h2>
          <p className="mt-2 text-sm text-[var(--app-muted)]">
            Obtén Pro en todas tus salas con suscripción mensual ($9.99 USD).
            {!billing.trialUsed ? (
              <span className="mt-1 block font-medium text-[var(--app-text)]">
                Incluye{' '}
                <strong className="text-[var(--app-success)]">
                  {PRO_TRIAL_DAYS} días de prueba gratis
                </strong>
                .
              </span>
            ) : null}
          </p>
          <button
            type="button"
            disabled={busyPlanId === 'pro'}
            onClick={onUpgradePro}
            className={`${uiBtnPrimary} mt-4 w-auto px-6`}
          >
            {busyPlanId === 'pro' ? 'Procesando…' : 'Actualizar a Pro'}
          </button>
        </div>
      </div>
    );
  }

  const freePlan = PLAN_DEFINITIONS.find((p) => p.id === 'free')!;
  const proPlan = PLAN_DEFINITIONS.find((p) => p.id === 'pro')!;
  const roomPlan = PLAN_DEFINITIONS.find((p) => p.id === 'room_pass')!;

  const proCta = billing.trialUsed
    ? 'Suscribirse a Pro'
    : `Probar Pro ${PRO_TRIAL_DAYS} días gratis`;

  if (showStripeEmbed) {
    return (
      <div className="space-y-4">
        <p className="rounded-xl border border-[var(--app-border)] bg-[var(--app-card)] px-4 py-3 text-center text-sm text-[var(--app-muted)]">
          Estás en <span className="font-semibold text-[var(--app-text)]">Free</span>.
          {billing.trialUsed ? (
            <span className="mt-1 block text-xs">
              Ya usaste tu prueba gratis. La suscripción Pro se cobrará al activarse.
            </span>
          ) : (
            <span className="mt-2 block text-sm font-medium text-[var(--app-text)]">
              Pro incluye{' '}
              <strong className="text-[var(--app-success)]">
                {PRO_TRIAL_DAYS} días de prueba gratis
              </strong>
              . No se te cobrará hasta que termine el periodo de prueba.
            </span>
          )}
        </p>
        <StripePricingTable
          customerEmail={customerEmail}
          clientReferenceId={clientReferenceId}
          className="w-full"
        />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {!billing.trialUsed ? (
        <p className="rounded-xl border border-[var(--app-success)]/35 bg-[var(--app-success)]/10 px-4 py-3 text-center text-sm font-medium text-[var(--app-text)]">
          El plan Pro incluye{' '}
          <strong className="text-[var(--app-success)]">
            {PRO_TRIAL_DAYS} días de prueba gratis
          </strong>
          . No se te cobrará hasta que termine el periodo de prueba.
        </p>
      ) : null}
      <div className="grid gap-5 md:grid-cols-3">
      <PlanCard
        plan={{ ...freePlan, cta: 'Plan actual' }}
        currentPlanId="free"
        disabled
        onSelect={() => undefined}
      />
      <PlanCard
        plan={{ ...proPlan, cta: proCta }}
        currentPlanId="free"
        busy={busyPlanId === 'pro'}
        onSelect={() => onUpgradePro()}
      />
      <PlanCard
        plan={roomPlan}
        currentPlanId="free"
        busy={busyPlanId === 'room_pass'}
        disabled={!roomId}
        disabledReason={
          roomId ? undefined : 'Abre billing desde una sala (?room=...)'
        }
        onSelect={() => onBuyRoomPass()}
      />
    </div>
    </div>
  );
}
