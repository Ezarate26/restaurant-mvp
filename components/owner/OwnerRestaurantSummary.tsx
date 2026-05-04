'use client';

import type { Restaurant } from '@/lib/model/types';
import { businessModeLabel } from '@/lib/utils/businessModeLabel';

export interface OwnerRestaurantSummaryProps {
  restaurant: Restaurant | null;
}

export function OwnerRestaurantSummary({
  restaurant,
}: OwnerRestaurantSummaryProps) {
  if (!restaurant) {
    return (
      <section className="rounded-2xl border border-[#E5E7EB] bg-white p-5 shadow-sm">
        <p className="text-sm text-[#6B7280]">Cargando datos del negocio…</p>
      </section>
    );
  }

  return (
    <section className="rounded-2xl border border-[#E5E7EB] bg-white p-5 shadow-sm">
      <h2 className="text-sm font-semibold uppercase tracking-wide text-[#6B7280]">
        Resumen del negocio
      </h2>
      <dl className="mt-4 grid gap-3 text-sm sm:grid-cols-2">
        <div>
          <dt className="text-[11px] font-semibold uppercase text-[#9CA3AF]">
            Restaurante
          </dt>
          <dd className="mt-0.5 font-medium text-[#1F2937]">
            {restaurant.name ?? '—'}
          </dd>
        </div>
        <div>
          <dt className="text-[11px] font-semibold uppercase text-[#9CA3AF]">
            Dirección
          </dt>
          <dd className="mt-0.5 text-[#374151]">{restaurant.address ?? '—'}</dd>
        </div>
        <div>
          <dt className="text-[11px] font-semibold uppercase text-[#9CA3AF]">
            Código de invitación
          </dt>
          <dd className="mt-0.5 font-mono text-lg font-bold tracking-widest text-[#229ED9]">
            {restaurant.invite_code ?? '—'}
          </dd>
        </div>
        <div>
          <dt className="text-[11px] font-semibold uppercase text-[#9CA3AF]">
            Tipo de negocio
          </dt>
          <dd className="mt-0.5 text-[#374151]">
            {businessModeLabel(restaurant.business_mode)}
          </dd>
        </div>
      </dl>
    </section>
  );
}
