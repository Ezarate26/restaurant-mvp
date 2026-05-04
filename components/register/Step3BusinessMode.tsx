'use client';

import type { BusinessModeState } from '@/lib/viewmodels/useRegisterRestaurantViewModel';
import type { BusinessMode } from '@/lib/model/types';

const numberInputClass =
  'w-32 rounded-lg border border-[#E5E7EB] bg-white px-3 py-2.5 text-[15px] text-[#1F2937] placeholder:text-[#6B7280] shadow-sm outline-none transition focus:border-[#229ED9] focus:ring-2 focus:ring-[#229ED9]/35';

const OPTIONS: {
  id: BusinessMode;
  title: string;
  description: string;
}[] = [
  {
    id: 'multi_table',
    title: 'Mesas múltiples',
    description:
      'Restaurante clásico con varias mesas independientes.',
  },
  {
    id: 'single_point',
    title: 'Punto único',
    description: 'Mostrador / barra. Un solo punto, muchos clientes a la vez.',
  },
  {
    id: 'hybrid',
    title: 'Híbrido',
    description: 'Mesas + mostrador para walk-ins.',
  },
];

export interface Step3BusinessModeProps {
  value: BusinessModeState;
  onChange: (value: BusinessModeState) => void;
}

export function Step3BusinessMode({ value, onChange }: Step3BusinessModeProps) {
  const showTablesInput =
    value.mode === 'multi_table' || value.mode === 'hybrid';

  return (
    <div className="space-y-4">
      <header>
        <h2 className="text-lg font-semibold text-[#1F2937]">
          Modo de operación
        </h2>
        <p className="mt-1 text-sm text-[#6B7280]">
          Elige cómo se atiende a tus clientes. Esto define los puntos de
          servicio iniciales.
        </p>
      </header>

      <div className="space-y-2.5">
        {OPTIONS.map((opt) => {
          const checked = value.mode === opt.id;
          return (
            <label
              key={opt.id}
              className={`flex cursor-pointer items-start gap-3 rounded-xl border p-4 transition ${
                checked
                  ? 'border-[#229ED9] bg-[#E3F2FD]/40 ring-1 ring-[#229ED9]/40'
                  : 'border-[#E5E7EB] bg-white hover:bg-[#F4F6F8]'
              }`}
            >
              <input
                type="radio"
                name="business-mode"
                checked={checked}
                onChange={() => onChange({ ...value, mode: opt.id })}
                className="mt-1 h-4 w-4 accent-[#229ED9]"
              />
              <div className="min-w-0">
                <p className="text-sm font-semibold text-[#1F2937]">
                  {opt.title}
                </p>
                <p className="mt-0.5 text-xs text-[#6B7280]">
                  {opt.description}
                </p>
              </div>
            </label>
          );
        })}
      </div>

      {showTablesInput && (
        <div className="rounded-xl border border-[#E5E7EB] bg-[#FAFBFC] p-4">
          <label className="block text-xs font-semibold uppercase tracking-wide text-[#6B7280]">
            Número de mesas iniciales
          </label>
          <div className="mt-2 flex items-center gap-3">
            <input
              type="number"
              min={1}
              max={200}
              className={numberInputClass}
              value={value.tablesCount}
              onChange={(e) =>
                onChange({
                  ...value,
                  tablesCount: Math.max(
                    1,
                    Math.min(200, Number(e.target.value) || 1)
                  ),
                })
              }
            />
            <p className="text-xs text-[#6B7280]">
              Podrás agregar más después desde el panel de admin.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
