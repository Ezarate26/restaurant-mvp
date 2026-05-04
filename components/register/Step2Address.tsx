'use client';

import type { AddressState } from '@/lib/viewmodels/useRegisterRestaurantViewModel';

const textareaClass =
  'min-h-[7rem] w-full rounded-lg border border-[#E5E7EB] bg-white px-3 py-2.5 text-[15px] text-[#1F2937] placeholder:text-[#6B7280] shadow-sm outline-none transition focus:border-[#229ED9] focus:ring-2 focus:ring-[#229ED9]/35';

export interface Step2AddressProps {
  value: AddressState;
  onChange: (value: AddressState) => void;
}

export function Step2Address({ value, onChange }: Step2AddressProps) {
  return (
    <div className="space-y-4">
      <header>
        <h2 className="text-lg font-semibold text-[#1F2937]">Dirección</h2>
        <p className="mt-1 text-sm text-[#6B7280]">
          Domicilio donde opera el restaurante.
        </p>
      </header>

      <textarea
        className={textareaClass}
        placeholder="Calle, número, colonia, ciudad…"
        value={value.address}
        onChange={(e) => onChange({ address: e.target.value })}
      />
    </div>
  );
}
